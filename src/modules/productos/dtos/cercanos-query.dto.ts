import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CercanosQueryDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsNotEmpty()
  @ApiProperty({ example: 21.1511, description: "Latitud del usuario" })
  lat: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  @ApiProperty({ example: -100.9347, description: "Longitud del usuario" })
  lng: number;

  @Transform(({ value }) => (value !== undefined && value !== null ? parseInt(value, 10) : 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({ required: false, default: 10, description: "Radio de búsqueda en kilómetros" })
  radio?: number = 10;

  @Transform(({ value }) => (value !== undefined && value !== null ? parseInt(value, 10) : 1))
  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({ required: false, default: 1, description: "Número de página" })
  page?: number = 1;

  @Transform(({ value }) => (value !== undefined && value !== null ? parseInt(value, 10) : 20))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({ required: false, default: 20, description: "Límite de productos por página" })
  limit?: number = 20;
}
