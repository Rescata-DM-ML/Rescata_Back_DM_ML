# Multi-stage Dockerfile para NestJS Backend + Prisma

# 1. Etapa de Construcción (Build)
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de dependencias y configuración de Prisma
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Instalar todas las dependencias (incluidas devDependencies)
RUN npm ci

# Copiar el código fuente
COPY . .

# Generar cliente de Prisma y compilar TypeScript a JavaScript (dist)
RUN npx prisma generate
RUN npm run build

# 2. Etapa de Producción (Runner)
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copiar package.json
COPY package*.json ./

# Instalar solo dependencias de producción (ignorando scripts dev como husky)
RUN npm ci --only=production --ignore-scripts

# Copiar artefactos construidos desde la etapa anterior
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/generated ./generated
COPY --from=builder /usr/src/app/prisma.config.ts ./prisma.config.ts

# Exponer el puerto del backend (por defecto 3000 o el configurado)
EXPOSE 3000

# Comando para ejecutar migraciones en Neon y luego iniciar la aplicación NestJS en producción
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
