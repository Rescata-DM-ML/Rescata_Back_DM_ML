/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProductoEntity } from "../entities/producto.entity";

export type ProductoCercanoRaw = {
  id: string;
  nombre: string;
  precioOriginal: number;
  precioOferta: number;
  fechaCaducidad: Date;
  distanciaKm: number;
  fotoUrl: string | null;
  negocioNombre: string;
  calificacionPromedio: number;
};

export type ResultadoCercanos = {
  data: ProductoCercanoRaw[];
  nextCursor: string | null;
  total: number;
};

export interface IProductosRepository {
  findCercanos(params: {
    lat: number;
    lng: number;
    radio: number;
    page: number;
    limit: number;
  }): Promise<ResultadoCercanos>;

  crear(data: {
    nombre: string;
    descripcion: string;
    precioOriginal: number;
    precioOferta: number;
    cantidadDisponible: number;
    fechaCaducidad: Date;
    negocioId: string;
  }): Promise<ProductoEntity>;
  
  findById(id: string): Promise<ProductoEntity | null>;
  findAll(): Promise<ProductoEntity[]>;
  findByNegocio(negocioId: string): Promise<ProductoEntity[]>;
  buscar(filtro: string): Promise<ProductoEntity[]>;
  actualizar(id: string, data: any): Promise<ProductoEntity>;
  eliminar(id: string): Promise<void>;
  contarImagenes(productoId: string): Promise<number>;
  agregarImagen(
    productoId: string,
    url: string,
    nombreUuid?: string,
    mimeType?: string,
    tamanioBytes?: number
  ): Promise<void>;
}

export const PRODUCTOS_REPOSITORY = "PRODUCTOS_REPOSITORY";
