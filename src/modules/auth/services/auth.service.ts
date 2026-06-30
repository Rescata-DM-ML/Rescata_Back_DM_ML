import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import Redis from "ioredis";
import { PrismaService } from "../../../core/prisma.service";
import { LoginDto } from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";

@Injectable()
export class AuthService {
  private redisClient: Redis;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    this.redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: { id: string; nombre: string; correo: string; rol: string } }> {
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
}
