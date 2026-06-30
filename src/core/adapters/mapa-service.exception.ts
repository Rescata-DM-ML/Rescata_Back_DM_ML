// Excepción Tipada (Patrón): MapaServiceException encapsula cualquier
// fallo del servicio externo de mapas. El service que consuma el adapter la
// captura y traduce a HTTP 503 sin conocer detalles internos.
//
// IMPORTANTE: Esta excepción NUNCA debe incluir información sensible (como
// headers de la request o API keys) en su mensaje de error, para evitar
// exponer detalles internos o de seguridad al cliente final.

export class MapaServiceException extends Error {
  constructor(
    message: string,
    public readonly proveedor: string,
    public readonly causaOriginal?: unknown
  ) {
    super(message);
    this.name = 'MapaServiceException';
  }
}
