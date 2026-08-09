import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // rampa a 100 usuarios en 30s
    { duration: '1m', target: 300 },  // subir a 300 usuarios y mantener por 1 minuto
    { duration: '30s', target: 0 },   // rampa de enfriamiento
  ],
  thresholds: {
    // La prueba de estrés busca el límite o validar el bloqueo por Rate Limit (HTTP 429).
    // No establecemos umbral de fallo estricto en http_req_failed porque esperamos respuestas 429.
  },
};

export default function () {
  const url = 'https://rescata-backend.fly.dev/auth/login';
  const payload = JSON.stringify({
    correo: 'consumidor@rescata.com',
    contrasena: 'Password123!',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  
  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  sleep(0.5); // peticiones frecuentes para forzar el rate limit
}
