import { Exclude, Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class NegocioInfoEntity {
  @Expose()
  @ApiProperty({
    example: "a3b4c5d6-e7f8-9012-3456-7890abcdef12",
    description: "ID del negocio",
    required: false,
  })
  id?: string;

  @Expose()
  @ApiProperty({ example: "Panadería El Sol", description: "Nombre del negocio" })
  nombre: string;

  @Expose()
  @ApiProperty({ example: "Av. Juárez 123", description: "Dirección del negocio", required: false })
  direccion?: string;

  @Expose()
  @ApiProperty({ example: 4.5, description: "Calificación promedio del negocio" })
  calificacionPromedio: number;
}

@Exclude()
export class ProductoEntity {
  @Expose()
  @ApiProperty({
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    description: "ID único del producto",
  })
  id: string;

  @Expose()
  @ApiProperty({ example: "Pan dulce surtido", description: "Nombre del producto" })
  nombre: string;

  @Expose()
  @ApiProperty({
    example: "Delicioso pan dulce recién horneado",
    description: "Descripción del producto",
    required: false,
  })
  descripcion: string;

  @Expose()
  @ApiProperty({ example: 50.0, description: "Precio original del producto" })
  precioOriginal: number;

  @Expose()
  @ApiProperty({ example: 35.0, description: "Precio de oferta del producto" })
  precioOferta: number;

  @Expose()
  @ApiProperty({ example: 10, description: "Cantidad disponible en stock" })
  cantidadDisponible: number;

  @Expose()
  @ApiProperty({
    example: "2026-07-15T20:00:00.000Z",
    description: "Fecha de caducidad del producto",
  })
  fechaCaducidad: Date;

  @Expose()
  @ApiProperty({
    example: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    description: "ID del negocio que ofrece el producto",
  })
  negocioId: string;

  @Expose()
  @ApiProperty({ example: "disponible", description: "Estado actual del producto" })
  estado: string;

  @Expose()
  @ApiProperty({
    example: "2026-06-28T21:00:00.000Z",
    description: "Fecha de creación del registro",
  })
  creadoEn: Date;

  // Additional fields for local listings and search feeds
  @Expose()
  @ApiProperty({ example: 0.8, description: "Distancia en kilómetros al usuario", required: false })
  distanciaKm?: number;

  @Expose()
  @ApiProperty({
    example: "https://r2.dev/imagen.jpg",
    description: "URL de la foto del producto",
    nullable: true,
    required: false,
  })
  fotoUrl?: string | null;

  @Expose()
  @Type(() => NegocioInfoEntity)
  @ApiProperty({
    type: NegocioInfoEntity,
    description: "Información resumida del negocio",
    required: false,
  })
  negocio?: NegocioInfoEntity;

  @Expose()
  @ApiProperty({
    example: [{ url: "https://r2.dev/imagen.jpg" }],
    description: "Galería de imágenes del producto",
    required: false,
  })
  imagenes?: { url: string }[];

  constructor(partial: Partial<ProductoEntity>) {
    Object.assign(this, partial);
  }
}
