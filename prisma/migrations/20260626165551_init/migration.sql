-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('consumidor', 'negocio');

-- CreateEnum
CREATE TYPE "CategoriaNegocios" AS ENUM ('fruteria', 'panaderia', 'cafeteria', 'restaurante', 'supermercado', 'tienda');

-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('disponible', 'apartado', 'expirado', 'agotado');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('pendiente', 'confirmado', 'expirado', 'cancelado');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "correo" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "consentimientoPrivacidad" BOOLEAN NOT NULL DEFAULT false,
    "consentimientoTimestamp" TIMESTAMP(3),
    "consentimientoVersion" VARCHAR(20),
    "optOutAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "direccion" VARCHAR(200) NOT NULL,
    "categoria" "CategoriaNegocios" NOT NULL,
    "latitud" DECIMAL(10,7) NOT NULL,
    "longitud" DECIMAL(10,7) NOT NULL,
    "calificacionPromedio" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negocios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(500),
    "precioOriginal" DECIMAL(10,2) NOT NULL,
    "precioOferta" DECIMAL(10,2) NOT NULL,
    "cantidadDisponible" INTEGER NOT NULL,
    "cantidadOriginal" INTEGER NOT NULL,
    "kgSalvados" DECIMAL(8,2) DEFAULT 0,
    "fechaCaducidad" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoProducto" NOT NULL DEFAULT 'disponible',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_imagenes" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "nombreUuid" VARCHAR(100) NOT NULL,
    "mimeType" VARCHAR(20) NOT NULL,
    "tamanioBytes" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "consumidorId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'pendiente',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "fechaRecoleccion" TIMESTAMP(3),
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversaciones" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes" (
    "id" TEXT NOT NULL,
    "conversacionId" TEXT NOT NULL,
    "remitenteId" TEXT NOT NULL,
    "contenido" VARCHAR(500) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "consumidorId" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" VARCHAR(300),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" VARCHAR(60) NOT NULL,
    "ipCliente" VARCHAR(45) NOT NULL,
    "codigoHttp" INTEGER NOT NULL,
    "metadata" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "negocios_usuarioId_key" ON "negocios"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "negocios_usuarioId_nombre_key" ON "negocios"("usuarioId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_productoId_consumidorId_estado_key" ON "reservas"("productoId", "consumidorId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "conversaciones_reservaId_key" ON "conversaciones"("reservaId");

-- CreateIndex
CREATE INDEX "mensajes_conversacionId_creadoEn_idx" ON "mensajes"("conversacionId", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_reservaId_key" ON "reviews"("reservaId");

-- CreateIndex
CREATE INDEX "logs_auditoria_usuarioId_creadoEn_idx" ON "logs_auditoria"("usuarioId", "creadoEn");

-- CreateIndex
CREATE INDEX "logs_auditoria_accion_creadoEn_idx" ON "logs_auditoria"("accion", "creadoEn");

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_consumidorId_fkey" FOREIGN KEY ("consumidorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "conversaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_remitenteId_fkey" FOREIGN KEY ("remitenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_consumidorId_fkey" FOREIGN KEY ("consumidorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
