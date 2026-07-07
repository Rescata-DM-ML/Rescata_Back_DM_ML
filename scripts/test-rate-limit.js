/* eslint-disable */
async function testRateLimiting() {
  console.log(" Iniciando script de prueba de penetración (Rate Limiting)...");

  // Soporte para probar en localhost o en Railway usando variables de entorno
  const baseUrl = process.env.API_URL || "http://localhost:3000";
  const url = `${baseUrl}/productos/cercanos?lat=21.1511&lng=-100.9347`;

  console.log(`Objetivo: GET ${url} (Límite: 60 peticiones por minuto)\n`);

  let peticionesBloqueadas = 0;
  let peticionesExitosas = 0;

  // Vamos a lanzar 65 peticiones seguidas para superar el límite de 60
  const totalPeticiones = 65;
  const promesas = [];

  for (let i = 1; i <= totalPeticiones; i++) {
    promesas.push(
      fetch(url)
        .then(async (response) => {
          if (response.status === 429) {
            peticionesBloqueadas++;
            console.log(` Petición ${i}: BLOQUEADA (HTTP 429 Too Many Requests)`);
          } else {
            peticionesExitosas++;
            console.log(` Petición ${i}: EXITOSA (HTTP ${response.status})`);
          }
        })
        .catch((err) => {
          console.log(` Petición ${i}: FALLÓ LA CONEXIÓN`);
        })
    );
  }

  // Esperar a que terminen todas las peticiones (ataque en paralelo)
  await Promise.all(promesas);

  console.log("\n --- REPORTE DE EVALUACIÓN ---");
  console.log(`Peticiones Exitosas: ${peticionesExitosas}`);
  console.log(`Peticiones Bloqueadas (429): ${peticionesBloqueadas}`);

  if (peticionesBloqueadas > 0) {
    console.log("\n RESULTADO: PRUEBA EXITOSA. El servidor está blindado contra descargas masivas de datos y bloquea correctamente la IP atacante.");
  } else {
    console.log("\n RESULTADO: El servidor no bloqueó las peticiones. Revisa la configuración.");
  }
}

testRateLimiting();
