import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Cron } from "@nestjs/schedule";
import * as bcrypt from "bcrypt";
import Redis from "ioredis";
import { PrismaService } from "../../../core/prisma.service";
import { LoginDto } from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";
import { RegisterBusinessDto } from "../dtos/register-business.dto";
import { MAPA_ADAPTER } from "../../../core/adapters/mapa.adapter.interface";
import type { IMapaAdapter } from "../../../core/adapters/mapa.adapter.interface";

@Injectable()
export class AuthService {
  private redisClient: Redis;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(MAPA_ADAPTER)
    private readonly mapaAdapter: IMapaAdapter,
  ) {
    this.redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    this.redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: { id: string; nombre: string; correo: string; rol: string } }> {
    // Nota: Las excepciones lanzadas aquí son interceptadas por el HttpExceptionFilter global
    // para registrar un log de auditoría genérico como "autenticacion_fallida" sin exponer detalles
    // sobre si el correo existe o no en la base de datos (mitigando enumeración de cuentas).
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: loginDto.correo },
      include: { negocio: true },
    });

    if (!usuario) {
      throw new UnauthorizedException({ error: "credenciales_invalidas" });
    }

    if (usuario.deletedAt) {
      throw new UnauthorizedException({ error: "cuenta_cancelada" });
    }

    const contrasenaValida = await bcrypt.compare(
      loginDto.contrasena,
      usuario.passwordHash,
    );

    if (!contrasenaValida) {
      throw new UnauthorizedException({ error: "credenciales_invalidas" });
    }

    const payload = {
      sub: usuario.id,
      email: usuario.correo,
      rol: usuario.rol,
      negocioId: usuario.negocio?.id ?? null,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { nombre, correo, contrasena, confirmacionContrasena } = registerDto;

    if (contrasena !== confirmacionContrasena) {
      throw new BadRequestException({ error: "contrasenas_no_coinciden" });
    }

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { correo },
    });

    if (usuarioExistente) {
      throw new ConflictException({
        error: "correo_duplicado",
        message: "El correo ya está registrado",
      });
    }

    const passwordHash = await bcrypt.hash(contrasena, 12);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre,
        correo,
        passwordHash,
        rol: "consumidor",
        consentimientoPrivacidad: true,
        consentimientoTimestamp: new Date(),
      },
    });

    // Publish registration event to Redis Pub/Sub asynchronously (non-blocking)
    this.redisClient.publish(
      "user.registered",
      JSON.stringify({
        userId: usuario.id,
        correo: usuario.correo,
        timestamp: new Date().toISOString(),
      }),
    ).catch((redisError) => {
      console.error("Failed to publish user.registered event to Redis:", redisError);
    });

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      creadoEn: usuario.creadoEn,
    };
  }

  async registerBusiness(registerBusinessDto: RegisterBusinessDto) {
    const {
      nombre,
      correo,
      contrasena,
      confirmacionContrasena,
      nombreNegocio,
      direccionNegocio,
      categoriaNegocio,
    } = registerBusinessDto;

    if (contrasena !== confirmacionContrasena) {
      throw new BadRequestException({ error: "contrasenas_no_coinciden" });
    }

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { correo },
    });

    if (usuarioExistente) {
      throw new ConflictException({
        error: "correo_duplicado",
        message: "El correo ya está registrado",
      });
    }

    // 1. Geocodificar la dirección del negocio usando mapaAdapter
    let coordenadas;
    try {
      coordenadas = await this.mapaAdapter.geocodificar(direccionNegocio);
    } catch {
      throw new BadRequestException({
        error: "direccion_invalida",
        message: "No se pudieron obtener las coordenadas para la dirección proporcionada",
      });
    }

    const passwordHash = await bcrypt.hash(contrasena, 12);

    // 2. Transacción atómica
    const { usuario, negocio } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          nombre,
          correo,
          passwordHash,
          rol: "negocio",
          consentimientoPrivacidad: true,
          consentimientoTimestamp: new Date(),
        },
      });

      const biz = await tx.negocio.create({
        data: {
          nombre: nombreNegocio,
          direccion: direccionNegocio,
          categoria: categoriaNegocio,
          latitud: coordenadas.lat,
          longitud: coordenadas.lng,
          usuarioId: user.id,
        },
      });

      return { usuario: user, negocio: biz };
    });

    // 3. Publicar eventos a Redis
    this.redisClient.publish(
      "user.registered",
      JSON.stringify({
        userId: usuario.id,
        correo: usuario.correo,
        timestamp: new Date().toISOString(),
      }),
    ).catch((redisError) => {
      console.error("Failed to publish user.registered event to Redis:", redisError);
    });

    this.redisClient.publish(
      "negocio.creado",
      JSON.stringify({
        negocioId: negocio.id,
        userId: usuario.id,
        nombre: negocio.nombre,
        categoria: negocio.categoria,
      }),
    ).catch((redisError) => {
      console.error("Failed to publish negocio.creado event to Redis:", redisError);
    });

    // 4. Iniciar sesión automáticamente (firmar JWT) y retornar token + user info
    const payload = {
      sub: usuario.id,
      email: usuario.correo,
      rol: usuario.rol,
      negocioId: negocio.id,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }

  @Cron("0 2 * * *") // Ejecutar limpieza automática todos los días a las 2:00 AM
  async ejecutarLimpiezaCicloVida(): Promise<void> {
    const ahora = new Date();

    // 1. Conservar logs de auditoría por 3 años únicamente
    const limiteLogs = new Date();
    limiteLogs.setFullYear(ahora.getFullYear() - 3);
    await this.prisma.logAuditoria.deleteMany({
      where: { creadoEn: { lt: limiteLogs } },
    });

    // 2. Anonimizar usuarios que solicitaron cancelación (deletedAt no nulo) hace más de 30 días
    const limiteCancelacion = new Date();
    limiteCancelacion.setDate(ahora.getDate() - 30);

    const candidatosCancelacion = await this.prisma.usuario.findMany({
      where: {
        deletedAt: { lte: limiteCancelacion },
        NOT: {
          correo: { endsWith: "@rescata.invalid" },
        },
      },
    });

    for (const usuario of candidatosCancelacion) {
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          nombre: "Usuario Eliminado",
          correo: `eliminado_${usuario.id}@rescata.invalid`,
          passwordHash: "ANONIMIZADO",
        },
      });
    }

    // 3. Anonimizar usuarios inactivos por más de 2 años
    const limiteInactividad = new Date();
    limiteInactividad.setFullYear(ahora.getFullYear() - 2);

    const candidatosInactividad = await this.prisma.usuario.findMany({
      where: {
        deletedAt: null,
        creadoEn: { lt: limiteInactividad },
      },
    });

    for (const usuario of candidatosInactividad) {
      // Validar si el usuario posee registros de logs de auditoría en los últimos 2 años
      const actividadReciente = await this.prisma.logAuditoria.findFirst({
        where: {
          usuarioId: usuario.id,
          creadoEn: { gte: limiteInactividad },
        },
      });

      if (!actividadReciente) {
        // Anonimizar por inactividad
        await this.prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            deletedAt: ahora,
            nombre: "Usuario Eliminado",
            correo: `eliminado_${usuario.id}@rescata.invalid`,
            passwordHash: "ANONIMIZADO",
          },
        });
      }
    }
  }
}
