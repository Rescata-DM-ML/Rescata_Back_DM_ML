export type ReservaConRelaciones = {
  id: string;
  productoId: string;
  consumidorId: string;
  negocioId: string;
  estado: string;
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
    kgSalvados: number | null;
  };
  consumidor: { id: string; nombre?: string };
  negocio: { id: string; nombre?: string };
};

export interface IReservasRepository {
  findById(id: string): Promise<ReservaConRelaciones | null>;

  findActivaPorConsumidorYProducto(
    consumidorId: string,
    productoId: string
  ): Promise<ReservaConRelaciones | null>;

  findMisReservas(consumidorId: string): Promise<ReservaConRelaciones[]>;

  findReservasPorNegocio(negocioId: string): Promise<ReservaConRelaciones[]>;


  create(data: {
    productoId: string;
    consumidorId: string;
    negocioId: string;
    cantidad: number;
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
