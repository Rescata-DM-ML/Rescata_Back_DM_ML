# Rescata - API Backend 🚀

Este repositorio contiene la API REST para la plataforma **RESCATA**, un sistema diseñado para reducir el desperdicio de alimentos conectando negocios con excedentes de comida y consumidores interesados en adquirirlos a precios reducidos. El backend está desarrollado sobre **NestJS**, usando **Prisma ORM**, **PostgreSQL** y **Redis**.

---

## 🗺️ Arquitectura de Software

El backend implementa una arquitectura modular con separación clara de responsabilidades, siguiendo principios de desarrollo limpio (Clean Architecture) y patrones de diseño robustos (Guards, DTOs, Services, Repositories).

```mermaid
graph TD
    subgraph Cliente [Frontend (React + Vite)]
        Browser[Navegador del Usuario] -->|Peticiones HTTP/REST| API_Client[Axios Client]
    end

    subgraph API_Gateway [Seguridad y API]
        API_Client -->|Solicitud| Throttle[Rate Limiter (ThrottlerGuard)]
        Throttle -->|Validación JWT| AuthG[AuthGuard & RolesGuard]
    end

    subgraph NestJS_App [Aplicación NestJS - Servidor API]
        AuthG -->|Enrutamiento| Controllers[Controladores REST]
        Controllers -->|Validación de Datos| DTOs[DTOs - class-validator]
        Controllers -->|Llamada| Services[Servicios de Dominio (Lógica de Negocio)]
        Services -->|Gestión de Eventos| Events[EventEmitter]
        Services -->|Acceso a Datos| Prisma[Prisma ORM / Prisma Client]
    end

    subgraph Data_Layer [Almacenamiento e Infraestructura]
        Prisma -->|Conexión TCP 5432| DB[(PostgreSQL Database)]
        Services -->|Conexión TCP 6379| Cache[(Redis Cache / Rate Limit Store)]
    end

    style Cliente fill:#e1f5fe,stroke:#039be5,stroke-width:2px
    style API_Gateway fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    style NestJS_App fill:#efebe9,stroke:#5d4037,stroke-width:2px
    style Data_Layer fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
```

### Componentes Clave:
- **NestJS Modules**: Encapsulación lógica por dominio (`auth`, `usuarios`, `productos`, `reservas`, `reviews`, `chat`, `estadisticas`).
- **Prisma Client**: Capa de abstracción de base de datos eficiente y segura con tipado fuerte.
- **PostgreSQL**: Motor relacional robusto para el resguardo de información de usuarios, negocios, productos y auditorías.
- **Redis**: Servidor en caché que sirve como almacenamiento rápido para el límite de peticiones (Rate Limiter).

---

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

## 🛡️ Seguridad y Cifrado en Reposo

El proyecto RESCATA implementa políticas de seguridad para el resguardo de información y secretos en reposo:

1. **Variables de Entorno Cifradas (`dotenv-vault`):**
   - Las variables sensibles se cifran dentro del archivo `.env.vault`, permitiendo un control seguro del repositorio.
   - Los archivos `.env` y `.env.keys` están excluidos del repositorio para evitar fugas involuntarias.
2. **Cifrado de Base de Datos:**
   - En entornos de producción (ej. Railway), el volumen de almacenamiento de PostgreSQL está protegido mediante cifrado de hardware y disco **AES-256**.
   - Consulta el documento de detalle técnico en [docs/cifrado-reposo.md](file:///c:/Users/natzl/Desktop/DIW/proyecto/Rescata_Back_DM_ML/docs/cifrado-reposo.md).

---

## ⚙️ Evidencia de Ejecuciones Exitosas de GitHub Actions

El repositorio cuenta con integración continua (CI) mediante GitHub Actions configurado en el archivo `.github/workflows/hello.yml`. Este flujo se encarga de ejecutar tareas básicas de verificación de entorno y logs para asegurar la salud operativa del código de manera automatizada.

A continuación se muestra la evidencia de la ejecución exitosa de la build automatizada:

![Ejecución Exitosa de GitHub Actions - Backend](docs/images/github-actions-backend.png)

> [!IMPORTANT]
> La captura de pantalla correspondiente se encuentra guardada en la ruta local: `docs/images/github-actions-backend.png`. Asegúrese de colocar su imagen en esa ruta para el correcto renderizado de esta documentación.
