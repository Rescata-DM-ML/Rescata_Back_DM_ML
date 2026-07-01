# Estrategia de Cifrado en Reposo — RESCATA

Este documento técnico detalla las medidas de seguridad implementadas en la plataforma RESCATA para proteger los datos y secretos en reposo (almacenamiento físico), cumpliendo con el criterio **SEG-BE-06**.

---

## 1. Variables de Entorno (Secretos de Configuración)
Para evitar almacenar secretos y contraseñas en texto plano dentro del repositorio, la plataforma implementa **`dotenv-vault`**:

* **Funcionamiento:** Las variables de desarrollo del archivo `.env` se compilan y cifran en un archivo llamado `.env.vault` mediante el comando `npx dotenv-vault local build`.
* **Seguridad en Git:** 
  - El archivo `.env.vault` (cifrado) **SÍ** se versiona en Git.
  - El archivo `.env` (texto plano) y el archivo `.env.keys` (claves locales de descifrado) están excluidos en el archivo `.gitignore` y **NUNCA** se suben al repositorio.
* **Descifrado en Producción:** Durante el arranque en producción, `dotenv-vault/config` lee la variable de entorno **`DOTENV_KEY`** para descifrar el contenido del vault en memoria antes de instanciar la aplicación.
* **Gestión de Claves:** La `DOTENV_KEY` se almacena de forma segura en las variables de entorno de tu proveedor de la nube (Railway/Render) y como secreto del repositorio en GitHub, nunca en el código.

---

## 2. Base de Datos en Reposo (PostgreSQL)
Para proteger la base de datos contra accesos físicos no autorizados al almacenamiento, todo el volumen de datos de PostgreSQL en producción debe estar cifrado:

### Configuración en Desarrollo (docker-compose)
En el archivo `docker-compose.yml`, el volumen `postgres_data` está etiquetado para advertir sobre el cifrado obligatorio y el contenedor se inicializa con checksums activos para garantizar la integridad en reposo:
```yaml
command: >
  postgres
  -c ssl=off
  -c data_checksums=on
  -c log_connections=off
  -c log_disconnections=off
```

### Configuración en Producción (ej. Railway)
En Railway, el cifrado de volúmenes persistentes se realiza mediante **AES-256** administrado directamente a nivel de infraestructura física. Pasos exactos para asegurar que tu volumen PostgreSQL está cifrado en Railway:

1. Inicia sesión en el panel de control de **Railway**.
2. Selecciona tu proyecto **RESCATA** y entra al servicio de la base de datos **PostgreSQL**.
3. Haz clic en la pestaña **Settings** (Configuración) del servicio.
4. Desplázate hasta la sección **Volumes** (Volúmenes).
5. Crea un nuevo volumen asignándolo al path `/var/lib/postgresql/data`. 
6. *Nota de Infraestructura:* Todos los volúmenes persistentes creados en Railway están encriptados automáticamente en reposo mediante el estándar de cifrado robusto **AES-256** utilizando llaves administradas por Railway.

---

## 3. Archivos de Configuración Versionados
Para evitar fugas de información accidental, la estructura de archivos es la siguiente:

| Archivo | Contenido | ¿Se sube al repo? | Propósito |
| :--- | :--- | :--- | :--- |
| `.env` | Credenciales reales de desarrollo (texto plano) | **NO** (excluido en `.gitignore`) | Desarrollo local. |
| `.env.keys` | Claves de cifrado/descifrado de las vaults | **NO** (excluido en `.gitignore`) | Gestión de llaves locales. |
| `.env.example` | Plantilla vacía de variables requeridas | **SÍ** | Guía de configuración. |
| `.env.vault` | Credenciales de desarrollo e integración cifradas | **SÍ** | Carga de variables en CI/CD y nubes. |

---

## 4. Integración en GitHub Actions (CI/CD)
Durante la ejecución de pipelines de integración y despliegue continuo:
1. La clave de descifrado se añade en GitHub en **Settings > Secrets and variables > Actions** con el nombre `DOTENV_KEY`.
2. En el archivo del workflow (`.github/workflows/ci.yml`), la clave se inyecta como variable de entorno para los jobs de testing o despliegue:
   ```yaml
   env:
     DOTENV_KEY: ${{ secrets.DOTENV_KEY }}
   ```
3. La aplicación NestJS leerá automáticamente la variable `DOTENV_KEY` del entorno y cargará las configuraciones correctas para correr las pruebas unitarias y de integración sin necesidad de crear archivos `.env` físicos en el runner.
