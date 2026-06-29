import { Inject, Injectable } from "@nestjs/common";
import { PRODUCTOS_REPOSITORY } from "../repositories/productos.repository.interface";
import type { IProductosRepository } from "../repositories/productos.repository.interface";
import { CercanosQueryDto } from "../dtos/cercanos-query.dto";
import { ProductoEntity } from "../entities/producto.entity";

@Injectable()
export class ProductosService {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY)
    private readonly repository: IProductosRepository,
  ) {}

  async findCercanos(query: CercanosQueryDto): Promise<{
    data: ProductoEntity[];
    nextCursor: string | null;
    total: number;
  }> {
    const resultado = await this.repository.findCercanos({
      lat: query.lat,
      lng: query.lng,
      radio: query.radio ?? 10,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });

    const data = resultado.data.map(
      (item) =>
        new ProductoEntity({
          id: item.id,
          nombre: item.nombre,
          precioOferta: item.precioOferta,
          fechaCaducidad: item.fechaCaducidad,
          distanciaKm: item.distanciaKm,
          fotoUrl: item.fotoUrl,
          negocio: {
            nombre: item.negocioNombre,
            calificacionPromedio: item.calificacionPromedio,
          },
        }),
    );

    return {
      data,
      nextCursor: resultado.nextCursor,
      total: resultado.total,
    };
  }
}
