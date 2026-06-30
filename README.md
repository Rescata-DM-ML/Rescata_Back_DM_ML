# Rescata_Back_DM_ML

<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">
A progressive Node.js framework for building efficient and scalable server-side applications.
</p>

---

##  Instalación del proyecto

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd Rescata_Back_DM_ML
```
### 2. Instalar dependencias
```bash
npm install
```
### 3. Levantar contenedores
```bash
docker compose up -d
```

### 4. Crear archivo .env

### 5. Generar Prisma Client
```bash
npx prisma generate
```

### 6. Ejecutar migraciones
```bash
npx prisma migrate dev
```

### 7. Ejecutar el proyecto
```bash
npm run start:dev
```

## 🔒 Seguridad y Cifrado en Reposo

El proyecto RESCATA implementa políticas de seguridad avanzadas para el resguardo de información y secretos en reposo:

1. **Variables de Entorno Cifradas (`dotenv-vault`):**
   - Las variables sensibles del archivo `.env` se encuentran cifradas dentro del archivo `.env.vault`, el cual se sube de forma segura al repositorio.
   - Los archivos `.env` y `.env.keys` están excluidos del repositorio para evitar fugas.
2. **Cifrado de la Base de Datos:**
   - En entornos de producción (ej. Railway), el volumen de almacenamiento de PostgreSQL está protegido mediante cifrado de hardware y disco **AES-256**.
   - Consulta el documento de detalle técnico en [docs/cifrado-reposo.md](file:///c:/Users/natzl/Desktop/DIW/proyecto/Rescata_Back_DM_ML/docs/cifrado-reposo.md).

### Ejecución con la Vault de Variables
Para descifrar las variables en producción o entornos de integración, se requiere la clave de descifrado `DOTENV_KEY` expuesta en el entorno:
```bash
DOTENV_KEY="dotenv://:key_value@dotenv.org?registration_key=..." npm run start:prod
```
