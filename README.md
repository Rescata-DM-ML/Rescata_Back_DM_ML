# Rescata - API Backend 

Este repositorio contiene la API REST para la plataforma **RESCATA**, un sistema diseñado para reducir el desperdicio de alimentos conectando negocios con excedentes de comida y consumidores interesados en adquirirlos a precios reducidos. El backend está desarrollado sobre **NestJS**, usando **Prisma ORM**, **PostgreSQL** y **Redis**.

---
## 🏛️ Arquitectura y Estructura del Proyecto

El backend está construido bajo una **Arquitectura Modular y de Capas (N-Tier Architecture)** promovida por el framework NestJS. Esta estructura garantiza un código altamente escalable, desacoplado y fácil de mantener.

### Componentes Clave

- **NestJS Modules:** Encapsulación lógica por dominio (`auth`, `usuarios`, `productos`, `reservas`, `reviews`, `chat`, `estadisticas`).
- **Prisma Client:** Capa de abstracción de base de datos eficiente y segura con tipado fuerte.
- **PostgreSQL:** Motor relacional robusto para el resguardo de información de usuarios, negocios, productos y auditorías.
- **Redis:** Servidor en caché que sirve como almacenamiento rápido para el límite de peticiones (Rate Limiter).

### Estructura de Directorios Detallada

A continuación, se detalla cómo los componentes clave se integran en la estructura física del proyecto:

```text
Rescata_Back_DM_ML/
├── prisma/                    # (PostgreSQL & Prisma)
│   └── schema.prisma          # Esquema de DB relacional, modelos y conexión
│
├── src/
│   ├── core/                  # Lógica transversal e infraestructura
│   │   ├── prisma.service.ts  # (Prisma Client) Conexión a la DB instanciada
│   │   ├── adapters/          # Adaptadores para servicios externos
│   │   ├── decorators/        # Decoradores personalizados
│   │   ├── filters/           # Manejo global de excepciones (Ej. Prisma Errors)
│   │   ├── guards/            # Seguridad, Roles y JWT
│   │   └── interceptors/      # Formateo y estandarización de respuestas
│   │
│   ├── modules/               # (NestJS Modules) Dominio de Negocio
│   │   ├── auth/              # ↳ Controladores, Servicios y DTOs de Autenticación
│   │   ├── usuarios/          # ↳ Gestión de usuarios y perfiles
│   │   ├── productos/         # ↳ Manejo del catálogo de mermas
│   │   ├── reservas/          # ↳ Lógica de transacciones y recolecciones
│   │   ├── reviews/           # ↳ Reseñas de los negocios
│   │   ├── chat/              # ↳ Comunicación en tiempo real
│   │   ├── estadisticas/      # ↳ Métricas e impacto ambiental
│   │   └── negocios/          # ↳ Gestión de locales y comercios
│   │
│   ├── redis/                 # (Redis)
│   │   └── redis.module.ts    # Configuración e instancia del Rate Limiter en caché
│   │
│   ├── app.module.ts          # Raíz que orquesta la inyección global
│   └── main.ts                # Punto de entrada de la API
│
├── docker-compose.yml         # Contenedores para levantar PostgreSQL y Redis localmente
└── .env                       # Variables de entorno (Credenciales DB, JWT, Redis)

### 🧩 Patrones de Diseño Implementados

El proyecto hace uso extensivo de patrones de diseño de nivel empresarial integrados tanto por el framework como por nuestra estructura en el directorio `src/core/`:

1. **Inyección de Dependencias (Dependency Injection) e Inversión de Control (IoC):**
   - **Propósito:** Desacoplar la creación de objetos de su uso. 
   - **Aplicación:** Utilizado en todo el proyecto. Los Controladores no instancian los Servicios directamente (no se usa `new`), el contenedor de NestJS inyecta las dependencias a través del constructor. (Ej. inyectar `AuthService` en `AuthController`).

2. **Patrón Decorador (Decorator Pattern):**
   - **Propósito:** Añadir comportamiento y metadatos a clases, métodos o propiedades dinámicamente sin alterar su estructura base.
   - **Aplicación:** Es la base fundamental de la API. Se usan decoradores nativos como `@Controller()`, `@Injectable()`, `@Get()`, `@UseGuards()`, y decoradores a medida en `src/core/decorators/`.

3. **Patrón Singleton:**
   - **Propósito:** Garantizar que una clase tenga una única instancia en toda la aplicación para ahorrar recursos y compartir estado (como pools de conexiones).
   - **Aplicación:** Todos los servicios (providers) marcados con `@Injectable()`, destacando nuestra conexión a la base de datos `PrismaService` y el servicio de `Redis`, son Singletons por defecto.

4. **Patrón DTO (Data Transfer Object):**
   - **Propósito:** Encapsular y transportar datos entre el cliente y el servidor, garantizando la estructura de la información entrante.
   - **Aplicación:** Implementado en las carpetas `dtos/` de cada módulo (ej. `login.dto.ts`). Trabaja con `class-validator` para sanear peticiones HTTP antes de que toquen la lógica.

5. **Patrón Interceptor / Cadena de Responsabilidad:**
   - **Propósito:** Interceptar el flujo de una petición HTTP para mutarla o ejecutar lógica antes y después de que llegue al manejador de la ruta.
   - **Aplicación:** Utilizado en `src/core/interceptors/` (como el Response Interceptor) para estandarizar el JSON que devuelve toda la API de forma centralizada.

6. **Patrón Adaptador (Adapter Pattern):**
   - **Propósito:** Servir de puente entre herramientas externas incompatibles y nuestra lógica de negocio, creando una interfaz estándar.
   - **Aplicación:** Implementado en la carpeta `src/core/adapters/` para envolver librerías de terceros (encriptación, utilidades), aislando nuestro código de posibles cambios en dichas dependencias.

7. **Patrón Filtro de Excepciones (Exception Filter Pattern):**
   - **Propósito:** Centralizar el manejo de errores en una sola capa transversal.
   - **Aplicación:** Ubicado en `src/core/filters/`, atrapa excepciones (como errores de constraint de Prisma o errores 404) y las transforma en respuestas JSON estructuradas para el frontend.
```
<img width="1551" height="859" alt="Copy of Rescata_Diagrama drawio" src="https://github.com/user-attachments/assets/9d0186cc-78a5-4227-9770-c361cf3641eb" />



## 🐳 Instrucciones de Ejecución Local con Docker-Compose

Sigue estos pasos para levantar el entorno de desarrollo local:

### Requisitos Previos:
- [Node.js v22](https://nodejs.org/) instalado.
- [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/) instalados y en ejecución.

### Paso 1: Configurar Variables de Entorno
Copia el archivo de plantilla `.env.example` y crea tu archivo `.env` en la raíz del backend:
```bash
cp .env.example .env
```
Asegúrate de configurar los valores locales. Ejemplo por defecto para desarrollo:
```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=rescatadb

# Database connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rescatadb

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=supersecreto
JWT_EXPIRES_IN=7d

# App
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Paso 2: Levantar Contenedores de Base de Datos y Cache
Levanta PostgreSQL y Redis en segundo plano a través de Docker Compose:
```bash
docker compose up -d
```
> [!NOTE]
> Este comando levantará un contenedor de PostgreSQL en el puerto `5432` y un contenedor de Redis en el puerto `6379`. Puedes verificar su estado usando `docker compose ps`.

### Paso 3: Instalar Dependencias del Proyecto
Instala los paquetes necesarios utilizando npm:
```bash
npm install
```

### Paso 4: Generar el Cliente de Prisma y Sincronizar la Base de Datos
Ejecuta la generación del cliente ORM de Prisma y aplica las migraciones SQL a tu base de datos PostgreSQL:
```bash
npx prisma generate
npx prisma migrate dev
```

### Paso 5: Iniciar el Servidor de Desarrollo
Corre el servidor local NestJS en modo "watch" para recarga automática en cambios:
```bash
npm run start:dev
```
La API estará lista y escuchando en `http://localhost:3000`.

---

## 🔑 Credenciales de Prueba para Evaluación

Para facilitar la evaluación de la plataforma con diferentes vistas y flujos según el rol, se sugieren los siguientes usuarios de prueba:

| Rol | Correo Electrónico | Contraseña | Permisos y Flujos Asociados |
| :--- | :--- | :--- | :--- |
| **Consumidor** | `consumidor@rescata.com` | `Password123!` | Visualizar productos excedentes de negocios cercanos, realizar reservas/apartados de comida, gestionar sus apartados activos, escribir reseñas (reviews) a los negocios y chatear con el negocio. |
| **Negocio** | `negocio@rescata.com` | `Password123!` | Registrar y gestionar información de la tienda, publicar nuevos productos (precio original, precio oferta, cantidad y caducidad), administrar y confirmar reservas de clientes, y chatear con los consumidores. |

---
## ALOJAMIENTO EN RAILWAY
<img width="766" height="427" alt="image" src="https://github.com/user-attachments/assets/16c82598-0706-4c23-9f94-76afa217211a" />


## 🛡️ Seguridad y Cifrado en Reposo

El proyecto RESCATA implementa políticas de seguridad para el resguardo de información y secretos en reposo:

1. **Variables de Entorno Cifradas (`dotenv-vault`):**
   - Las variables sensibles se cifran dentro del archivo `.env.vault`, permitiendo un control seguro del repositorio.
   - Los archivos `.env` y `.env.keys` están excluidos del repositorio para evitar fugas involuntarias.
2. **Cifrado de Base de Datos:**
   - En entornos de producción (ej. Railway), el volumen de almacenamiento de PostgreSQL está protegido mediante cifrado de hardware y disco **AES-256**.
   - Consulta el documento de detalle técnico en [docs/cifrado-reposo.md](file:///c:/Users/natzl/Desktop/DIW/proyecto/Rescata_Back_DM_ML/docs/cifrado-reposo.md).

---
