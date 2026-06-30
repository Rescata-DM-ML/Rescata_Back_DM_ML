import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../../core/prisma.service";
import { UpdateUsuarioDto } from "../dtos/update-usuario.dto";

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async getMiPerfil(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException("Usuario no encontrado");
    }

    return {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      creadoEn: user.creadoEn,
      consentimientoPrivacidad: user.consentimientoPrivacidad,
      consentimientoTimestamp: user.consentimientoTimestamp,
    };
  }

  async updateMiPerfil(userId: string, dto: UpdateUsuarioDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException("Usuario no encontrado");
    }

    if (dto.correo && dto.correo !== user.correo) {
      const emailDup = await this.prisma.usuario.findUnique({
        where: { correo: dto.correo },
      });

      if (emailDup) {
        throw new ConflictException({
          error: "correo_duplicado",
          message: "El correo ya está registrado",
        });
      }
    }

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
      },
    });

    return {
      id: updated.id,
      nombre: updated.nombre,
      correo: updated.correo,
      rol: updated.rol,
      creadoEn: updated.creadoEn,
    };
  }

  async solicitarCancelacion(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException("Usuario no encontrado o ya marcado para eliminación");
    }

    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: "Tu cuenta ha sido marcada para eliminación. Tus datos serán eliminados en 30 días.",
    };
  }

  async solicitarOposicion(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException("Usuario no encontrado");
    }

    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        optOutAt: new Date(),
        consentimientoPrivacidad: false,
      },
    });

    return {
      message: "Has ejercido tu derecho de oposición. Dejaremos de tratar tus datos para finalidades no esenciales.",
    };
  }
}
