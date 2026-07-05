import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/prisma.service";
import { IReservasRepository, ReservaConRelaciones } from "./reservas.repository.interface";
import type { EstadoReserva } from "../../../../generated/prisma";

const includeRelaciones = {
  producto: {
    select: {
      id: true,
      nombre: true,
      estado: true,
      cantidadDisponible: true,
      negocioId: true,
      kgSalvados: true,
    },
  },
  consumidor: { select: { id: true, nombre: true } },
  negocio: { select: { id: true, nombre: true } },
};

type DbReservaResult = {
  id: string;
  productoId: string;
  consumidorId: string;
  negocioId: string;
  estado: EstadoReserva;
  cantidad: number;
  expiresAt: Date;
  fechaRecoleccion: Date | null;
  creadaEn: Date;
  actualizadoEn: Date;
  producto: {
    id: string;
    nombre: string;
    estado: string;
    cantidadDisponible: number;
    negocioId: string;
    kgSalvados: unknown; // Use unknown internally to handle Prisma Decimal type conversion safely
  };
  consumidor: { id: string; nombre: string };
  negocio: { id: string; nombre: string };
};

@Injectable()
export class PrismaReservasRepository implements IReservasRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(row: DbReservaResult): ReservaConRelaciones {
    return {
      id: row.id,
      productoId: row.productoId,
      consumidorId: row.consumidorId,
      negocioId: row.negocioId,
      estado: row.estado,
      cantidad: row.cantidad,
      expiresAt: row.expiresAt,
      fechaRecoleccion: row.fechaRecoleccion,
      creadaEn: row.creadaEn,
      actualizadoEn: row.actualizadoEn,
      producto: {
        id: row.producto.id,
        nombre: row.producto.nombre,
        estado: row.producto.estado,
        cantidadDisponible: row.producto.cantidadDisponible,
        negocioId: row.producto.negocioId,
        kgSalvados: row.producto.kgSalvados ? Number(row.producto.kgSalvados) : null,
      },
      consumidor: { id: row.consumidor.id, nombre: row.consumidor.nombre },
      negocio: { id: row.negocio.id, nombre: row.negocio.nombre },
    };
  }

  async findById(id: string): Promise<ReservaConRelaciones | null> {
    const result = (await this.prisma.reserva.findUnique({
      where: { id },
      include: includeRelaciones,
    })) as DbReservaResult | null;

    if (!result) return null;
    return this.mapRow(result);
  }

  async findActivaPorConsumidorYProducto(
    consumidorId: string,
    productoId: string,
  ): Promise<ReservaConRelaciones | null> {
    const result = (await this.prisma.reserva.findFirst({
      where: {
        consumidorId,
        productoId,
        estado: "pendiente",
      },
      include: includeRelaciones,
    })) as DbReservaResult | null;

    if (!result) return null;
    return this.mapRow(result);
  }

  async findMisReservas(consumidorId: string): Promise<ReservaConRelaciones[]> {
    const results = (await this.prisma.reserva.findMany({
      where: { consumidorId },
      orderBy: { creadaEn: 'desc' },
      include: includeRelaciones,
    })) as DbReservaResult[];

    return results.map(r => this.mapRow(r));
  }

  async findReservasPorNegocio(negocioId: string): Promise<ReservaConRelaciones[]> {
    const results = (await this.prisma.reserva.findMany({
      where: { negocioId },
      orderBy: { creadaEn: 'desc' },
      include: includeRelaciones,
    })) as DbReservaResult[];

    return results.map(r => this.mapRow(r));
  }

  async findExpiradas(): Promise<ReservaConRelaciones[]> {
    const results = (await this.prisma.reserva.findMany({
      where: {
        estado: "pendiente",
        expiresAt: { lt: new Date() },
      },
      include: includeRelaciones,
    })) as DbReservaResult[];

    return results.map(r => this.mapRow(r));
  }

  async create(data: {
    productoId: string;
    consumidorId: string;
    negocioId: string;
    cantidad: number;
    expiresAt: Date;
  }): Promise<ReservaConRelaciones> {
    const result = (await this.prisma.reserva.create({
      data: {
        productoId: data.productoId,
        consumidorId: data.consumidorId,
        negocioId: data.negocioId,
        cantidad: data.cantidad,
        expiresAt: data.expiresAt,
        estado: "pendiente",
      },
      include: includeRelaciones,
    })) as DbReservaResult;

    return this.mapRow(result);
  }

  async updateEstado(id: string, estado: string): Promise<ReservaConRelaciones> {
    const result = (await this.prisma.reserva.update({
      where: { id },
      data: { estado: estado as EstadoReserva },
      include: includeRelaciones,
    })) as DbReservaResult;

    return this.mapRow(result);
  }

  async updateConfirmar(id: string, fechaRecoleccion: Date): Promise<ReservaConRelaciones> {
    const result = (await this.prisma.reserva.update({
      where: { id },
      data: {
        estado: "confirmado" as EstadoReserva,
        fechaRecoleccion,
      },
      include: includeRelaciones,
    })) as DbReservaResult;

    return this.mapRow(result);
  }
}
