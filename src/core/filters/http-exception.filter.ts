import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { PrismaService } from "../prisma.service";
import { Prisma } from "../../../generated/prisma";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly prisma: PrismaService) { }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    // Determine if it is a critical operation
    let action: string | null = null;
    let userId: string | null = null;

    if (request.method === "POST" && request.path === "/auth/login") {
      action = "autenticacion_fallida";
    } else if (
      request.method === "POST" &&
      request.path === "/auth/register/consumer"
    ) {
      action = "registro_usuario_fallido";
    } else if (request.method === "POST" && request.path === "/reservas") {
      action = "reserva_creada_fallido";
    } else if (
      request.method === "PATCH" &&
      request.path.startsWith("/reservas/") &&
      request.path.endsWith("/confirmar")
    ) {
      action = "reserva_confirmada_fallido";
    } else if (request.method === "POST" && request.path === "/reviews") {
      action = "calificacion_creada_fallido";
    }

    const req = request as unknown as Record<string, unknown>;
    const user = req.user as Record<string, unknown> | undefined;
    if (user) {
      userId = (user.sub as string) ?? null;
    }

    const ip =
      (request.headers["x-forwarded-for"] as string) ||
      request.socket.remoteAddress ||
      request.ip;

    if (action) {
      const ahora = new Date();
      const logEntry = {
        timestamp: ahora.toISOString(),
        userId,
        accion: action,
        ipCliente: ip,
        codigoHttp: status,
        metadata: this.sanitize({
          query: request.query,
          params: request.params,
          // If it's authentication fail, do NOT log the body because it contains passwords/emails
          body: action === "autenticacion_fallida" ? undefined : request.body,
          error: message,
        }),
      };

      console.log(JSON.stringify(logEntry));

      this.prisma.logAuditoria
        .create({
          data: {
            usuarioId: userId,
            accion: action,
            ipCliente: typeof ip === "string" ? ip : "unknown",
            codigoHttp: status,
            metadata: logEntry.metadata as Prisma.InputJsonValue,
          },
        })
        .catch((err) => console.error("Error saving failed audit log:", err));
    }

    // Send response back
    response.status(status).json(
      exception instanceof HttpException
        ? exception.getResponse()
        : {
          statusCode: status,
          message: "Internal server error",
        }
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
