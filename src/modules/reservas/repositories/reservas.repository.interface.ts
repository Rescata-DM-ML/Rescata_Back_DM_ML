export type ReservaConRelaciones = {
  id: string;
  productoId: string;
  consumidorId: string;
  negocioId: string;
  estado: string;
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
    kgSalvados: number | null;
  };
  consumidor: { id: string };
  negocio: { id: string };
};

export interface IReservasRepository {
  findById(id: string): Promise<ReservaConRelaciones | null>;

  findActivaPorConsumidorYProducto(
    consumidorId: string,
    productoId: string
  ): Promise<ReservaConRelaciones | null>;

  create(data: {
    productoId: string;
    consumidorId: string;
    negocioId: string;
    expiresAt: Date;
  }): Promise<ReservaConRelaciones>;

  updateEstado(id: string, estado: string): Promise<ReservaConRelaciones>;

  findExpiradas(): Promise<ReservaConRelaciones[]>;

  updateConfirmar(
    id: string,
    fechaRecoleccion: Date
  ): Promise<ReservaConRelaciones>;
}

export const RESERVAS_REPOSITORY = Symbol("RESERVAS_REPOSITORY");
