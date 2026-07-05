/* eslint-disable @typescript-eslint/no-explicit-any */
import { NegocioEntity } from "../entities/negocio.entity";

export interface INegociosRepository {
  crear(data: {
    nombre: string;
    direccion: string;
    categoria: string;
    latitud: number;
    longitud: number;
    usuarioId: string;
  }): Promise<NegocioEntity>;

  existePorUsuarioYNombre(usuarioId: string, nombre: string): Promise<boolean>;
  findById(id: string): Promise<NegocioEntity | null>;
  findAll(): Promise<NegocioEntity[]>;
  buscar(filtro: string): Promise<NegocioEntity[]>;
  actualizar(id: string, data: any): Promise<NegocioEntity>;
  eliminar(id: string): Promise<void>;
}

export const NEGOCIOS_REPOSITORY = "NEGOCIOS_REPOSITORY";
