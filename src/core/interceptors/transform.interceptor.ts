import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { PrismaService } from "../prisma.service";
import { Prisma } from "../../../generated/prisma";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    return next.handle().pipe(
      tap((data) => {
        // Determine if it is a critical operation
        let action: string | null = null;
        let userId: string | null = null;

        const method = request.method;
        const path = request.path;

        if (method === "POST" && path === "/auth/login") {
          action = "login_exitoso";
          if (data && typeof data === "object") {
            const dataObj = data as Record<string, unknown>;
            if (dataObj.user && typeof dataObj.user === "object") {
              const userObj = dataObj.user as Record<string, unknown>;
              userId = (userObj.id as string) ?? null;
            }
          }
        } else if (method === "POST" && path === "/auth/register/consumer") {
          action = "registro_usuario";
          if (data && typeof data === "object") {
            const dataObj = data as Record<string, unknown>;
            userId = (dataObj.id as string) ?? null;
          }
        } else if (method === "POST" && path === "/reservas") {
          action = "reserva_creada";
        } else if (method === "PATCH" && path.startsWith("/reservas/") && path.endsWith("/confirmar")) {
          action = "reserva_confirmada";
        } else if (method === "POST" && path === "/reviews") {
          action = "calificacion_creada";
        }

        const req = request as Record<string, unknown>;
        const user = req.user as Record<string, unknown> | undefined;
        if (!userId && user) {
          userId = (user.sub as string) ?? null;
        }

        if (action) {
          const ip =
            request.headers["x-forwarded-for"] ||
            request.socket.remoteAddress ||
            request.ip;

          const statusCode = response.statusCode;
          const ahora = new Date();

          const logEntry = {
            timestamp: ahora.toISOString(),
            userId,
            accion: action,
            ipCliente: ip,
            codigoHttp: statusCode,
            metadata: this.sanitize({
              query: request.query,
              params: request.params,
              // Never log sensitive info in request body
              body: action === "login_exitoso" ? undefined : request.body,
              response: data,
            }),
          };

          console.log(JSON.stringify(logEntry));

          this.prisma.logAuditoria
            .create({
              data: {
                usuarioId: userId,
                accion: action,
                ipCliente: typeof ip === "string" ? ip : "unknown",
                codigoHttp: statusCode,
                metadata: logEntry.metadata as Prisma.InputJsonValue,
              },
            })
            .catch((err) =>
              console.error("Error saving successful audit log:", err)
            );
        }
      })
    );
  }

  private sanitize(val: unknown): unknown {
    if (val === null || val === undefined) return val;
    if (Array.isArray(val)) {
      return val.map((item: unknown) => this.sanitize(item));
    }
    if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      const cleaned: Record<string, unknown> = {};
      for (const key of Object.keys(obj)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes("password") ||
          lowerKey.includes("contrasena") ||
          lowerKey.includes("hash") ||
          lowerKey.includes("token") ||
          lowerKey.includes("correo") ||
          lowerKey.includes("email") ||
          lowerKey.includes("tarjeta") ||
          lowerKey.includes("card") ||
          lowerKey.includes("jwt")
        ) {
          continue;
        }
        cleaned[key] = this.sanitize(obj[key]);
      }
      return cleaned;
    }
    return val;
  }
}
