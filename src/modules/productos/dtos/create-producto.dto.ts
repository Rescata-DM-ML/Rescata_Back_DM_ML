import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsNumber,
  Min,
  IsInt,
  Max,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";
import { IsFutureDate } from "../validators/expiration-date.validator";

export class CreateProductoDto {
  @ApiProperty({
    description: "Nombre del producto para mostrar en la plataforma",
    example: "Pan dulce surtido",
    minLength: 3,
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString({ message: "El nombre debe ser una cadena de texto" })
  @MinLength(3, { message: "El nombre debe tener al menos 3 caracteres" })
  @MaxLength(100, { message: "El nombre no puede exceder 100 caracteres" })
  @Matches(/^[^<>{}()"';]*$/, {
    message: "El nombre no puede contener caracteres HTML ni scripts",
  })
  nombre!: string;

  @ApiProperty({
    description: "Descripción detallada del producto o contenido del lote",
    required: false,
    example: "Panes del día...",
    maxLength: 500,
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsOptional()
  @IsString({ message: "La descripción debe ser una cadena de texto" })
  @MaxLength(500, {
    message: "La descripción no puede exceder 500 caracteres",
  })
  @Matches(/^[^<>{}]*$/, {
    message: "La descripción no puede contener etiquetas HTML",
  })
  descripcion?: string;

  @ApiProperty({
    description: "Precio original del producto antes del descuento",
    example: 150.0,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        "El precio original debe ser un número con máximo 2 decimales",
    },
  )
  @Min(0.01, { message: "El precio original debe ser mayor a 0" })
  precioOriginal!: number;

  @ApiProperty({
    description: "Precio de oferta con descuento para consumo responsable",
    example: 75.0,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        "El precio de oferta debe ser un número con máximo 2 decimales",
    },
  )
  @Min(0.01, { message: "El precio de oferta debe ser mayor a 0" })
  precioOferta!: number;

  @ApiProperty({
    description: "Cantidad física de productos actualmente disponibles para reserva",
    example: 10,
    minimum: 1,
    maximum: 9999,
  })
  @IsInt({ message: "La cantidad debe ser un número entero" })
  @Min(1, { message: "La cantidad mínima es 1" })
  @Max(9999, { message: "La cantidad máxima es 9999" })
  cantidadDisponible!: number;

  @ApiProperty({
    description: "Cantidad inicial del producto para calcular kgSalvados al confirmar reserva",
    example: 10,
    minimum: 1,
    maximum: 9999,
  })
  @IsInt({ message: "La cantidad debe ser un número entero" })
  @Min(1, { message: "La cantidad mínima es 1" })
  @Max(9999, { message: "La cantidad máxima es 9999" })
  cantidadOriginal!: number;

  @ApiProperty({
    description: "Fecha y hora de expiración en formato ISO 8601",
    example: "2024-12-31T23:59:00.000Z",
  })
  @IsDateString(
    {},
    {
      message:
        "La fecha debe estar en formato ISO 8601 (ej. 2024-12-31T23:59:00.000Z)",
    },
  )
  @IsFutureDate({
    message:
      "La fecha de caducidad debe ser posterior a la fecha y hora actual",
  })
  fechaCaducidad!: string;
}

/*
===================================================================
PRUEBAS DE VALIDACIÓN (OWASP-FE-04)
===================================================================

CASO 1 — Fecha pasada (debe fallar con HTTP 400):
POST /productos
{
  "nombre": "Pan",
  "precioOriginal": 100,
  "precioOferta": 50,
  "cantidadDisponible": 5,
  "cantidadOriginal": 5,
  "fechaCaducidad": "2020-01-01T00:00:00.000Z"
}
Respuesta esperada:
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "La fecha de caducidad debe ser posterior a la fecha y hora actual"
  ],
  "timestamp": "2026-06-27T00:20:00.000Z",
  "path": "/productos"
}

CASO 2 — Payload con XSS (debe fallar con HTTP 400):
POST /productos
{
  "nombre": "<script>alert(1)</script>",
  "precioOriginal": 100,
  "precioOferta": 50,
  "cantidadDisponible": 5,
  "cantidadOriginal": 5,
  "fechaCaducidad": "2026-12-31T23:59:00.000Z"
}
Respuesta esperada:
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "El nombre no puede contener caracteres HTML ni scripts"
  ],
  "timestamp": "2026-06-27T00:20:00.000Z",
  "path": "/productos"
}

CASO 3 — precioOferta mayor al original (falla en el service, no en DTO):
POST /productos
{
  "nombre": "Pan dulce surtido",
  "precioOriginal": 50,
  "precioOferta": 100,
  "cantidadDisponible": 5,
  "cantidadOriginal": 5,
  "fechaCaducidad": "2026-12-31T23:59:00.000Z"
}
Respuesta esperada: HTTP 400 desde el service con:
{
  "success": false,
  "statusCode": 400,
  "error": "precio_oferta_invalido",
  "message": "El precio de oferta debe ser menor al precio original",
  "timestamp": "2026-06-27T00:20:00.000Z",
  "path": "/productos"
}
*/
