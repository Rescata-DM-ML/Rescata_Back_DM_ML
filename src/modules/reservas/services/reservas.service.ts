import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../core/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { RESERVAS_REPOSITORY } from "../repositories/reservas.repository.interface";
import type { IReservasRepository } from "../repositories/reservas.repository.interface";
import { CrearReservaUseCase } from "../use-cases/crear-reserva.use-case";
import { ReservaEntity } from "../entities/reserva.entity";

export interface JwtPayload {
  sub: string;
  email: string;
  rol: "consumidor" | "negocio";
  negocioId?: string;
}

@Injectable()
export class ReservasService {
  constructor(
    @Inject(RESERVAS_REPOSITORY)
    private readonly repository: IReservasRepository,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly crearReservaUseCase: CrearReservaUseCase
  ) {}

  async crearReserva(
    productoId: string,
    user: JwtPayload
  ): Promise<ReservaEntity> {
    return this.crearReservaUseCase.execute(
      productoId,
      user.sub,
      user.negocioId
    );
  }

  async confirmarRecoleccion(
    reservaId: string,
    negocioId: string | undefined
  ): Promise<ReservaEntity> {
    // PASO 1 — Verificar negocioId existe en JWT
    if (!negocioId) {
      throw new ForbiddenException({
        error: "negocio_no_registrado",
        message:
          "Tu cuenta no tiene un negocio asociado. Completa el registro de negocio.",
      });
    }

    // PASO 2 — Buscar la reserva
    const reserva = await this.repository.findById(reservaId);
    if (!reserva) {
      throw new NotFoundException({
        error: "reserva_no_encontrada",
        message: "La reserva no existe",
      });
    }

    // PASO 3 — Verificar propiedad BOLA
    if (reserva.negocioId !== negocioId) {
      throw new ForbiddenException({
        error: "acceso_denegado",
        message: "Esta reserva no pertenece a tu negocio",
      });
    }

    // PASO 4 — Verificar estado confirmable
    if (reserva.estado !== "pendiente") {
      throw new BadRequestException({
        error: "reserva_no_confirmable",
        estado_actual: reserva.estado,
        message: `La reserva no puede confirmarse. Estado actual: ${reserva.estado}`,
      });
    }

    // PASO 5 — Confirmar en BD
    const fechaRecoleccion = new Date();
    const confirmada = await this.repository.updateConfirmar(
      reservaId,
      fechaRecoleccion
    );

    // PASO 6 — Publicar en Redis (Observer/EDA)
    try {
      await this.redisService.publish("reserva.confirmada", {
        reservaId: confirmada.id,
        consumidorId: confirmada.consumidorId,
        negocioId: confirmada.negocioId,
        productoId: confirmada.productoId,
        kgSalvados: Number(confirmada.producto.kgSalvados ?? 0),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        "Error publicando reserva.confirmada:",
        message
      );
      // NO relanzar. La reserva ya está confirmada en BD. Redis falla gracefully.
    }

    // PASO 7 — Retornar
    return new ReservaEntity(confirmada);
  }

  async cancelarReservasExpiradas(): Promise<void> {
    const expiradas = await this.repository.findExpiradas();

    await Promise.all(
      expiradas.map(async (reserva) => {
        await this.repository.updateEstado(reserva.id, "expirado");

        if (reserva.producto.estado === "apartado") {
          await this.prisma.producto.update({
            where: { id: reserva.producto.id },
            data: {
              cantidadDisponible: { increment: 1 },
              estado: "disponible",
            },
          });
        } else {
          await this.prisma.producto.update({
            where: { id: reserva.producto.id },
            data: {
              cantidadDisponible: { increment: 1 },
            },
          });
        }

        try {
          await this.redisService.publish("reserva.expirada", {
            reservaId: reserva.id,
            productoId: reserva.productoId,
            consumidorId: reserva.consumidorId,
          });
        } catch {
          console.error("Error publicando reserva.expirada");
        }
      })
    );

    if (expiradas.length > 0) {
      console.log(`Cron: ${expiradas.length} reservas expiradas canceladas`);
    }
  }

  @Cron("*/5 * * * *")
  async handleCronReservasExpiradas(): Promise<void> {
    await this.cancelarReservasExpiradas();
  }
}
