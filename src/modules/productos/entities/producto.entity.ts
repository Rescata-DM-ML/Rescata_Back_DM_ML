import { Exclude, Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { EstadoProducto } from "../../../../generated/prisma";

export class NegocioInfoEntity {
  @ApiProperty({ example: "Panadería El Sol", description: "Nombre del negocio" })
  nombre: string;

  @ApiProperty({ example: 4.5, description: "Calificación promedio del negocio" })
  calificacionPromedio: number;
}

@Exclude()
export class ProductoEntity {
  @Expose()
  @ApiProperty({ example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", description: "ID único del producto" })
  id: string;

  @Expose()
  @ApiProperty({ example: "Pan dulce surtido", description: "Nombre del producto" })
  nombre: string;

  @Expose()
  @ApiProperty({ example: 35.00, description: "Precio de oferta del producto" })
  precioOferta: number;

  @Expose()
  @ApiProperty({ example: "2026-07-15T20:00:00.000Z", description: "Fecha de caducidad del producto" })
  fechaCaducidad: Date;

  @Expose()
  @ApiProperty({ example: EstadoProducto.disponible, enum: EstadoProducto, description: "Estado actual del producto" })
  estado: EstadoProducto;

  @Expose()
  @ApiProperty({ example: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", description: "ID del negocio que ofrece el producto" })
  negocioId: string;

  @Expose()
  @ApiProperty({ example: "2026-06-28T21:00:00.000Z", description: "Fecha de creación del registro" })
  creadoEn: Date;

  @Expose()
  @ApiProperty({ example: 0.8, description: "Distancia en kilómetros al usuario" })
  distanciaKm: number;

  @Expose()
  @ApiProperty({ example: "https://r2.dev/imagen.jpg", description: "URL de la foto del producto", nullable: true })
  fotoUrl: string | null;

  @Expose()
  @Type(() => NegocioInfoEntity)
  @ApiProperty({ type: NegocioInfoEntity, description: "Información resumida del negocio" })
  negocio: NegocioInfoEntity;

  constructor(partial: Partial<ProductoEntity>) {
    Object.assign(this, partial);
  }
}
