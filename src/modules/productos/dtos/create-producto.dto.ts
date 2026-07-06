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
  IsDate,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { IsFutureDate } from "../validators/expiration-date.validator";

export class CreateProductoDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[^<>{}[\]]*$/, { message: "El nombre no puede contener HTML" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  descripcion?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  precioOriginal: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  precioOferta: number;

  @IsInt()
  @Min(1)
  @Max(9999)
  cantidadDisponible: number;

  @Type(() => Date)
  @IsDate()
  @IsFutureDate()
  fechaCaducidad: Date;
}
