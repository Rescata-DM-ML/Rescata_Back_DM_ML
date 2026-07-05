import { IsEnum, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CategoriaNegocios } from '../../../../generated/prisma';

export class CreateNegocioDto {
  @ApiProperty({
    example: 'Panadería La Central',
    description: 'Nombre comercial del negocio',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[^<>{}[\]]*$/, { message: 'El nombre no puede contener HTML' })
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @ApiProperty({
    example: 'Av. Juárez 123, Centro, León',
    description: 'Dirección física del local que será geocodificada',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  direccion: string;

  @ApiProperty({
    enum: CategoriaNegocios,
    example: 'panaderia',
    description: 'Categoría del tipo de negocio',
  })
  @IsEnum(CategoriaNegocios)
  categoria: CategoriaNegocios;
}
