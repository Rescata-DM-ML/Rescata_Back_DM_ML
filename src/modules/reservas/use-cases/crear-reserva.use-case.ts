import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../core/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { ReservaEntity } from "../entities/reserva.entity";
import { Prisma } from "../../../../generated/prisma";

@Injectable()
export class CrearReservaUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService
  ) {}

  async execute(
    productoId: string,
    consumidorId: string,
    negocioIdDelConsumidor?: string
  ): Promise<ReservaEntity> {
    try {
      const reserva = await this.prisma.$transaction(async (tx) => {
        // PASO 1 — Verificar que producto existe
        const producto = await tx.producto.findUnique({
          where: { id: productoId },
          include: {
            negocio: { select: { id: true } },
          },
        });

        if (!producto) {
          throw new NotFoundException({
            error: "producto_no_encontrado",
            message: "El producto no existe",
          });
        }

        // PASO 2 — Verificar estado disponible
        if (producto.estado !== "disponible") {
          throw new ConflictException({
            error: "producto_no_disponible",
            message: "El producto no está disponible para apartar",
          });
        }

        // PASO 3 — Verificar stock
        if (producto.cantidadDisponible <= 0) {
          throw new ConflictException({
            error: "sin_stock",
            message: "No hay unidades disponibles",
          });
        }

        // PASO 4 — Verificar que consumidor no es dueño
        if (producto.negocio.id === negocioIdDelConsumidor) {
          throw new ForbiddenException({
            error: "operacion_no_permitida",
            message: "No puedes apartar productos de tu propio negocio",
          });
        }

        // PASO 5 — Verificar reserva duplicada
        const duplicada = await tx.reserva.findFirst({
          where: {
            consumidorId,
            productoId,
            estado: "pendiente",
          },
        });

        if (duplicada) {
          throw new ConflictException({
            error: "reserva_duplicada",
            message: "Ya tienes un apartado activo para este producto",
          });
        }

        // PASO 6 — Reducción atómica de inventario
        if (producto.cantidadDisponible > 1) {
          await tx.producto.update({
            where: { id: productoId },
            data: { cantidadDisponible: { decrement: 1 } },
          });
        } else {
          await tx.producto.update({
            where: { id: productoId },
            data: {
              cantidadDisponible: { decrement: 1 },
              estado: "apartado",
            },
          });
        }

        // PASO 7 — Crear la reserva dentro de tx
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        return tx.reserva.create({
          data: {
            productoId,
            consumidorId,
            negocioId: producto.negocio.id,
            estado: "pendiente",
            expiresAt,
          },
        });
      });

      // PASO 8 — Publicar en Redis (fuera del bloque de transacción)
      try {
        await this.redisService.publish("reserva.creada", {
          reservaId: reserva.id,
          productoId,
          consumidorId,
          negocioId: reserva.negocioId,
        });
      } catch (error) {
        console.error(
          "Error publicando reserva.creada en Redis:",
          error instanceof Error ? error.message : String(error)
        );
      }

      // PASO 9 — Retornar
      return new ReservaEntity(reserva);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException({
          error: "reserva_duplicada",
          message: "Conflicto al crear la reserva",
        });
      }
      throw error;
    }
  }
}
