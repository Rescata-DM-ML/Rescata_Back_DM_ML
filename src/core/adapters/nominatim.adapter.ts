import { Injectable } from '@nestjs/common';
import { IMapaAdapter, Coordenadas } from './mapa.adapter.interface';
import { MapaServiceException } from './mapa-service.exception';

@Injectable()
export class NominatimAdapter implements IMapaAdapter {
  private readonly BASE_URL = 'https://nominatim.openstreetmap.org';
  
  // El User-Agent es OBLIGATORIO según la política de uso de Nominatim.
  // Sin este header las requests son bloqueadas.
  private readonly USER_AGENT = 'RESCATA-App/1.0 (contacto@rescata.mx)';
  private readonly TIMEOUT_MS = 5000;

  // Rate Limiting: Nominatim limita a 1 request/segundo.
  // Este método garantiza cumplir esa política esperando si es necesario antes de cada llamada.
  private ultimaRequest = 0;
  private readonly INTERVALO_MIN_MS = 1000;

  private async esperarRateLimit(): Promise<void> {
    const ahora = Date.now();
    const tiempoDesdeUltima = ahora - this.ultimaRequest;
    if (tiempoDesdeUltima < this.INTERVALO_MIN_MS) {
      const espera = this.INTERVALO_MIN_MS - tiempoDesdeUltima;
      await new Promise<void>((resolve) => setTimeout(resolve, espera));
    }
    this.ultimaRequest = Date.now();
  }

  async geocodificar(direccion: string): Promise<Coordenadas> {
    // PASO 1 — Aplicar rate limiting:
    await this.esperarRateLimit();

    // PASO 2 — Construir URL con parámetros:
    const url = new URL(`${this.BASE_URL}/search`);
    url.searchParams.set('q', direccion);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'mx'); // limita resultados a México para RESCATA

    // PASO 3 — Hacer fetch con timeout:
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.USER_AGENT,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new MapaServiceException(
          'Nominatim respondió con error',
          'nominatim',
          { status: response.status },
        );
      }

      const data = (await response.json()) as Array<{ lat: string; lon: string }>;

      if (!Array.isArray(data) || data.length === 0) {
        throw new MapaServiceException(
          'No se encontraron coordenadas para la dirección proporcionada',
          'nominatim',
        );
      }

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof MapaServiceException) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new MapaServiceException(
          'Tiempo de espera agotado consultando servicio de geocodificación',
          'nominatim',
          error,
        );
      }
      throw new MapaServiceException(
        'Error consultando servicio de geocodificación',
        'nominatim',
        error,
      );
    }
  }

  async calcularDistancia(
    origen: Coordenadas,
    destino: Coordenadas,
  ): Promise<number> {
    // LÓGICA (Haversine local, sin llamada externa)
    // Nominatim no ofrece endpoint de distancia/ruta gratuito sin API key adicional (OSRM).
    // Para el MVP se usa Haversine matemático local.
    const R = 6371; // radio de la Tierra en km
    const dLat = this.gradosARadianes(destino.lat - origen.lat);
    const dLng = this.gradosARadianes(destino.lng - origen.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.gradosARadianes(origen.lat)) *
        Math.cos(this.gradosARadianes(destino.lat)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanciaKm = R * c;
    return Math.round(distanciaKm * 10) / 10;
  }

  private gradosARadianes(grados: number): number {
    return grados * (Math.PI / 180);
  }
}

/*
═══════════════════════════════════════════════
PRUEBAS DE VERIFICACIÓN MANUAL:
═══════════════════════════════════════════════

CASO 1 — Geocodificación exitosa:
const coords = await adapter.geocodificar(
  'Zócalo, Dolores Hidalgo, Guanajuato'
)
console.log(coords)
// Esperado: { lat: 21.15..., lng: -100.93... }

CASO 2 — Dirección inexistente:
const coords = await adapter.geocodificar(
  'asdfasdfasdf calle inventada 99999'
)
// Debe lanzar MapaServiceException:
// "No se encontraron coordenadas..."

CASO 3 — Cálculo de distancia:
const distancia = await adapter.calcularDistancia(
  { lat: 21.1527, lng: -100.9347 }, // Dolores Hidalgo
  { lat: 21.1219, lng: -101.6692 }  // León
)
console.log(distancia)
// Esperado: aproximadamente 70-75 km

CASO 4 — Rate limiting:
Hacer 3 llamadas seguidas a geocodificar()
y verificar con console.time/timeEnd que
hay al menos 1 segundo entre cada una.
*/
