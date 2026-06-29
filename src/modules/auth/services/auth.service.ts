import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../core/prisma.service";
import { LoginDto } from "../dtos/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ token: string; user: { id: string; nombre: string; correo: string; rol: string } }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: loginDto.correo },
      include: { negocio: true },
    });

    if (!usuario || usuario.deletedAt) {
      throw new UnauthorizedException({ error: "credenciales_invalidas" });
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
}
