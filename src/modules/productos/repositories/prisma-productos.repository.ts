/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/prisma.service";
import {
  IProductosRepository,
  ProductoCercanoRaw,
  ResultadoCercanos,
} from "./productos.repository.interface";
import { ProductoEntity } from "../entities/producto.entity";
import { EstadoProducto } from "../../../../generated/prisma";

@Injectable()
export class PrismaProductosRepository implements IProductosRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(row: any): ProductoEntity {
    return new ProductoEntity({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion || "",
      precioOriginal: Number(row.precioOriginal),
      precioOferta: Number(row.precioOferta),
      cantidadDisponible: row.cantidadDisponible,
      fechaCaducidad: row.fechaCaducidad,
      negocioId: row.negocioId,
      estado: row.estado,
      creadoEn: row.creadoEn,
      negocio: row.negocio
        ? {
            id: row.negocio.id,
            nombre: row.negocio.nombre,
            direccion: row.negocio.direccion,
            calificacionPromedio: Number(row.negocio.calificacionPromedio),
          }
        : undefined,
      imagenes: row.imagenes
        ? row.imagenes.map((img: any) => ({
            url: img.url,
          }))
        : undefined,
      fotoUrl: row.imagenes && row.imagenes.length > 0 ? row.imagenes[0].url : row.fotoUrl || null,
    });
  }

  async crear(data: {
    nombre: string;
    descripcion: string;
    precioOriginal: number;
    precioOferta: number;
    cantidadDisponible: number;
    fechaCaducidad: Date;
    negocioId: string;
  }): Promise<ProductoEntity> {
    const created = await this.prisma.producto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precioOriginal: data.precioOriginal,
        precioOferta: data.precioOferta,
        cantidadDisponible: data.cantidadDisponible,
        cantidadOriginal: data.cantidadDisponible,
        fechaCaducidad: data.fechaCaducidad,
        negocioId: data.negocioId,
        estado: EstadoProducto.disponible,
      },
    });

    return this.mapRow(created);
  }

  async findById(id: string): Promise<ProductoEntity | null> {
    const row = await this.prisma.producto.findUnique({
      where: { id },
      include: { negocio: true, imagenes: { orderBy: { orden: "asc" } } },
    });
    if (!row) return null;

    return this.mapRow(row);
  }

  async findAll(): Promise<ProductoEntity[]> {
    const rows = await this.prisma.producto.findMany();
    return rows.map(row => this.mapRow(row));
  }

  async buscar(filtro: string): Promise<ProductoEntity[]> {
    const rows = await this.prisma.producto.findMany({
      where: {
        nombre: {
          contains: filtro,
          mode: "insensitive",
        },
      },
    });
    return rows.map(row => this.mapRow(row));
  }

  async actualizar(id: string, data: any): Promise<ProductoEntity> {
    const row = await this.prisma.producto.update({
      where: { id },
      data,
    });
    return this.mapRow(row);
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.producto.delete({
      where: { id },
    });
  }

  async findByNegocio(negocioId: string): Promise<ProductoEntity[]> {
    const rows = await this.prisma.producto.findMany({
      where: { negocioId },
      include: { imagenes: { orderBy: { orden: "asc" } } },
    });
    return rows.map(row => this.mapRow(row));
  }

  async contarImagenes(productoId: string): Promise<number> {
    return this.prisma.productoImagen.count({
      where: { productoId },
    });
  }

  async agregarImagen(
    productoId: string,
    url: string,
    nombreUuid?: string,
    mimeType?: string,
    tamanioBytes?: number,
  ): Promise<void> {
    const filename = url.split("/").pop() || "image.jpg";
    const uuidPart = filename.split(".")[0] || "uuid-placeholder";
    const ext = filename.split(".").pop() || "jpg";
    const inferredMime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    await this.prisma.productoImagen.create({
      data: {
        productoId,
        url,
        nombreUuid: nombreUuid || uuidPart,
        mimeType: mimeType || inferredMime,
        tamanioBytes: tamanioBytes || 1024,
      },
    });
  }

  async findCercanos(params: {
    lat: number;
    lng: number;
    radio: number;
    page: number;
    limit: number;
  }): Promise<ResultadoCercanos> {
    const { lat, lng, radio, page, limit } = params;
    const offset = (page - 1) * limit;

    const dataSql = `
      SELECT
        p.id,
        p.nombre,
        CAST(p."precioOriginal" AS float) AS "precioOriginal",
        CAST(p."precioOferta" AS float) AS "precioOferta",
        p."fechaCaducidad",
        n.nombre AS "negocioNombre",
        CAST(n."calificacionPromedio" AS float) AS "calificacionPromedio",
        ROUND(
          CAST(
            6371 * acos(
              LEAST(1.0,
                cos(radians($1::float)) *
                cos(radians(CAST(n.latitud AS float))) *
                cos(
                  radians(CAST(n.longitud AS float))
                  - radians($2::float)
                ) +
                sin(radians($1::float)) *
                sin(radians(CAST(n.latitud AS float)))
              )
            )
          AS numeric), 1
        ) AS "distanciaKm",
        (
          SELECT pi2.url
          FROM producto_imagenes pi2
          WHERE pi2."productoId" = p.id
          ORDER BY pi2.orden ASC
          LIMIT 1
        ) AS "fotoUrl"
      FROM productos p
      INNER JOIN negocios n ON p."negocioId" = n.id
      WHERE
        p.estado = 'disponible'
        AND p."fechaCaducidad" > NOW()
        AND (
          6371 * acos(
            LEAST(1.0,
              cos(radians($1::float)) *
              cos(radians(CAST(n.latitud AS float))) *
              cos(
                radians(CAST(n.longitud AS float))
                - radians($2::float)
              ) +
              sin(radians($1::float)) *
              sin(radians(CAST(n.latitud AS float)))
            )
          )
        ) <= $3::float
      ORDER BY "distanciaKm" ASC
      LIMIT $4::int
      OFFSET $5::int
    `;

    const countSql = `
      SELECT
        COUNT(*)::int AS count
      FROM productos p
      INNER JOIN negocios n ON p."negocioId" = n.id
      WHERE
        p.estado = 'disponible'
        AND p."fechaCaducidad" > NOW()
        AND (
          6371 * acos(
            LEAST(1.0,
              cos(radians($1::float)) *
              cos(radians(CAST(n.latitud AS float))) *
              cos(
                radians(CAST(n.longitud AS float))
                - radians($2::float)
              ) +
              sin(radians($1::float)) *
              sin(radians(CAST(n.latitud AS float)))
            )
          )
        ) <= $3::float
    `;

    interface RawDataRow {
      id: string;
      nombre: string;
      precioOriginal: number | string;
      precioOferta: number | string;
      fechaCaducidad: Date;
      distanciaKm: number | string;
      fotoUrl: string | null;
      negocioNombre: string;
      calificacionPromedio: number | string;
    }

    interface RawCountRow {
      count: number | string;
    }

    const rawData = await this.prisma.$queryRawUnsafe<RawDataRow[]>(
      dataSql,
      lat,
      lng,
      radio,
      limit,
      offset,
    );

    const rawCount = await this.prisma.$queryRawUnsafe<RawCountRow[]>(countSql, lat, lng, radio);

    const total = rawCount[0]?.count ? parseInt(String(rawCount[0].count), 10) : 0;

    const data: ProductoCercanoRaw[] = rawData.map(row => ({
      id: row.id,
      nombre: row.nombre,
      precioOriginal: parseFloat(String(row.precioOriginal)),
      precioOferta: parseFloat(String(row.precioOferta)),
      fechaCaducidad: row.fechaCaducidad,
      distanciaKm: parseFloat(String(row.distanciaKm)),
      fotoUrl: row.fotoUrl,
      negocioNombre: row.negocioNombre,
      calificacionPromedio: parseFloat(String(row.calificacionPromedio)),
    }));

    const nextCursor = data.length === limit ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      total,
    };
  }
}
