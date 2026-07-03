/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma.service';
import { INegociosRepository } from './negocios.repository.interface';
import { NegocioEntity } from '../entities/negocio.entity';
import { CategoriaNegocios } from '../../../../generated/prisma';

@Injectable()
export class PrismaNegociosRepository implements INegociosRepository {
  constructor(private readonly prisma: PrismaService) {}

   
  private mapRow(row: any): NegocioEntity {
    return {
      id: row.id,
      nombre: row.nombre,
      direccion: row.direccion,
      categoria: row.categoria,
      latitud: Number(row.latitud),
      longitud: Number(row.longitud),
      calificacionPromedio: row.calificacionPromedio !== undefined ? Number(row.calificacionPromedio) : 0,
      creadoEn: row.creadoEn,
      usuarioId: row.usuarioId,
    };
  }

  async crear(data: {
    nombre: string;
    direccion: string;
    categoria: string;
    latitud: number;
    longitud: number;
    usuarioId: string;
  }): Promise<NegocioEntity> {
    const row = await this.prisma.negocio.create({
      data: {
        nombre: data.nombre,
        direccion: data.direccion,
        categoria: data.categoria as CategoriaNegocios,
        latitud: data.latitud,
        longitud: data.longitud,
        usuarioId: data.usuarioId,
      },
    });
    return this.mapRow(row);
  }

  async existePorUsuarioYNombre(usuarioId: string, nombre: string): Promise<boolean> {
    const count = await this.prisma.negocio.count({
      where: {
        usuarioId,
        nombre,
      },
    });
    return count > 0;
  }

  async findById(id: string): Promise<NegocioEntity | null> {
    const row = await this.prisma.negocio.findUnique({
      where: { id },
    });
    if (!row) return null;
    return this.mapRow(row);
  }

  async findAll(): Promise<NegocioEntity[]> {
    const rows = await this.prisma.negocio.findMany();
    return rows.map((row) => this.mapRow(row));
  }

  async buscar(filtro: string): Promise<NegocioEntity[]> {
    const rows = await this.prisma.negocio.findMany({
      where: {
        nombre: {
          contains: filtro,
          mode: 'insensitive'
        }
      }
    });
    return rows.map(row => this.mapRow(row));
  }

  async actualizar(id: string, data: any): Promise<NegocioEntity> {
    const row = await this.prisma.negocio.update({
      where: { id },
      data,
    });
    return this.mapRow(row);
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.negocio.delete({
      where: { id },
    });
  }
}
