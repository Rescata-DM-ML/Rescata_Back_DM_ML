// Patrón Adapter: Esta interfaz es definida por
// el SISTEMA, no por el proveedor externo.
// NominatimAdapter implementa este contrato.
// Cambiar de proveedor (a Mapbox, Google Maps,
// etc.) solo requiere una nueva clase que
// implemente IMapaAdapter, sin tocar ningún
// módulo de negocio que la consuma.

export type Coordenadas = {
  lat: number;
  lng: number;
};

export interface IMapaAdapter {
  geocodificar(direccion: string): Promise<Coordenadas>;

  calcularDistancia(
    origen: Coordenadas,
    destino: Coordenadas,
  ): Promise<number>;
  // retorna distancia en kilómetros
}

export const MAPA_ADAPTER = Symbol('MAPA_ADAPTER');
