import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 150 }, // rampa rápida de 0 a 150 usuarios virtuales en 30s
    { duration: '1m', target: 150 },  // mantener 150 usuarios por 1 minuto
    { duration: '10s', target: 0 },   // rampa de bajada rápida a 0 usuarios
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // toleramos menos de 5% de fallos en picos
    http_req_duration: ['p(95)<300'], // en picos el p95 debe ser menor a 300ms
  },
};

export default function () {
  const res = http.get('https://rescata-backend.fly.dev/productos');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
