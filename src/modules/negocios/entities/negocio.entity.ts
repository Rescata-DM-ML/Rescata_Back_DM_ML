import { ApiProperty } from '@nestjs/swagger';

export class NegocioEntity {
  @ApiProperty({
    example: 'a3b4c5d6-e7f8-9012-3456-7890abcdef12',
    description: 'ID único del negocio',
  })
  id: string;

  @ApiProperty({
    example: 'Panadería La Central',
    description: 'Nombre comercial del negocio',
  })
  nombre: string;

  @ApiProperty({
    example: 'Av. Juárez 123, Centro, León',
    description: 'Dirección física del local',
  })
  direccion: string;

  @ApiProperty({
    example: 'panaderia',
    description: 'Categoría del tipo de negocio',
  })
  categoria: string;

  @ApiProperty({
    example: 21.1219,
    description: 'Latitud geográfica',
  })
  latitud: number;

  @ApiProperty({
    example: -101.6692,
    description: 'Longitud geográfica',
  })
  longitud: number;

  @ApiProperty({
    example: '2026-06-30T10:00:00.000Z',
    description: 'Fecha de registro del negocio',
  })
  creadoEn: Date;

  constructor(partial: Partial<NegocioEntity>) {
    Object.assign(this, partial);
  }
}
