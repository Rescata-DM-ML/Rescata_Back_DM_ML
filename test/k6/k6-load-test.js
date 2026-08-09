import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20, // 20 usuarios virtuales concurrentes
  duration: '1m', // durante 1 minuto
  thresholds: {
    http_req_failed: ['rate<0.01'], // menos del 1% de errores
    http_req_duration: ['p(95)<150'], // 95% de las peticiones deben ser menores a 150ms
  },
};

export default function () {
  // Petición al endpoint de consulta usando la URL de Fly.io en producción
  const res = http.get('https://rescata-backend.fly.dev/productos');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1); // Espera 1 segundo entre peticiones por usuario virtual
}
