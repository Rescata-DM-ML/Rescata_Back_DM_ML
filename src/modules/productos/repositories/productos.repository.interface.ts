export type ProductoCercanoRaw = {
  id: string;
  nombre: string;
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
}

export const PRODUCTOS_REPOSITORY = Symbol("PRODUCTOS_REPOSITORY");
