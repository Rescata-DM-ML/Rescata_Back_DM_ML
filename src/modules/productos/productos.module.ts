import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ProductosController } from "./controllers/productos.controller";
import { ProductosService } from "./services/productos.service";
import { IsFutureDateConstraint } from "./validators/expiration-date.validator";
import { PRODUCTOS_REPOSITORY } from "./repositories/productos.repository.interface";
import { PrismaProductosRepository } from "./repositories/prisma-productos.repository";
import { ALMACENAMIENTO_ADAPTER } from "../../core/adapters/almacenamiento.adapter.interface";
import { R2AlmacenamientoAdapter } from "../../core/adapters/r2-almacenamiento.adapter";

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [ProductosController],
  providers: [
    ProductosService,
    IsFutureDateConstraint,
    {
      provide: PRODUCTOS_REPOSITORY,
      useClass: PrismaProductosRepository,
    },
    {
      provide: ALMACENAMIENTO_ADAPTER,
      useClass: R2AlmacenamientoAdapter,
    },
  ],
  exports: [ProductosService],
})
export class ProductosModule {}
