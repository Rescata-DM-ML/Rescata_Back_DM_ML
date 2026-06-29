import { Module } from "@nestjs/common";
import { ProductosController } from "./controllers/productos.controller";
import { ProductosService } from "./services/productos.service";
import { ExpirationDateValidator } from "./validators/expiration-date.validator";
import { PRODUCTOS_REPOSITORY } from "./repositories/productos.repository.interface";
import { PrismaProductosRepository } from "./repositories/prisma-productos.repository";

@Module({
  controllers: [ProductosController],
  providers: [
    ProductosService,
    ExpirationDateValidator,
    {
      provide: PRODUCTOS_REPOSITORY,
      useClass: PrismaProductosRepository,
    },
  ],
  exports: [ProductosService],
})
export class ProductosModule {}
