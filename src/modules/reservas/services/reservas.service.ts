import { Inject, Injectable } from "@nestjs/common";
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
