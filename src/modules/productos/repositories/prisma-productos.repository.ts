import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/prisma.service";
import { IProductosRepository, ProductoCercanoRaw, ResultadoCercanos } from "./productos.repository.interface";

@Injectable()
export class PrismaProductosRepository implements IProductosRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      offset
    );

    const rawCount = await this.prisma.$queryRawUnsafe<RawCountRow[]>(
      countSql,
      lat,
      lng,
      radio
    );

    const total = rawCount[0]?.count ? parseInt(String(rawCount[0].count), 10) : 0;

    const data: ProductoCercanoRaw[] = rawData.map((row) => ({
      id: row.id,
      nombre: row.nombre,
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
