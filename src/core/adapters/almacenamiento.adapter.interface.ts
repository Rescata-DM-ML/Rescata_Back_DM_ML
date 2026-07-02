export interface IAlmacenamientoAdapter {
  subir(archivo: Express.Multer.File, nombreUnico: string): Promise<string>;
}

export const ALMACENAMIENTO_ADAPTER = "ALMACENAMIENTO_ADAPTER";
