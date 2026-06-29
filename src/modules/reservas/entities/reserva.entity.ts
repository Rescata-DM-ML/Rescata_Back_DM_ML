import { Exclude, Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

@Exclude()
export class ReservaEntity {
  @ApiProperty({
    example: "res-12345678-90ab-cdef-1234-567890abcdef",
    description: "ID único de la reserva",
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: "prod-12345678-90ab-cdef-1234-567890abcdef",
    description: "ID del producto reservado",
  })
  @Expose()
  productoId: string;

  @ApiProperty({
    example: "usr-12345678-90ab-cdef-1234-567890abcdef",
    description: "ID del consumidor que realizó el apartado",
  })
  @Expose()
  consumidorId: string;

  @ApiProperty({
    example: "neg-12345678-90ab-cdef-1234-567890abcdef",
    description: "ID del negocio dueño del producto",
  })
  @Expose()
  negocioId: string;

  @ApiProperty({
    example: "pendiente",
    description: "Estado de la reserva (pendiente, confirmado, expirado, cancelado)",
  })
  @Expose()
  estado: string;

  @ApiProperty({
    example: "2026-06-29T10:00:00.000Z",
    description: "Fecha y hora límite para recoger el producto (2 horas desde creación)",
  })
  @Expose()
  expiresAt: Date;

  @ApiProperty({
    example: null,
    description: "Fecha y hora en que se recolectó el producto (si ya fue entregado)",
    nullable: true,
  })
  @Expose()
  fechaRecoleccion: Date | null;

  @ApiProperty({
    example: "2026-06-29T08:00:00.000Z",
    description: "Fecha de creación del apartado",
  })
  @Expose()
  creadaEn: Date;

  @Exclude()
  actualizadoEn: Date;

  constructor(partial: Partial<ReservaEntity>) {
    Object.assign(this, partial);
  }
}
