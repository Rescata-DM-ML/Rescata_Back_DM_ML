import { Module } from "@nestjs/common";
import { ProductosController } from "./controllers/productos.controller";
import { ProductosService } from "./services/productos.service";
import { ExpirationDateValidator } from "./validators/expiration-date.validator";

@Module({
  controllers: [ProductosController],
  providers: [ProductosService, ExpirationDateValidator],
})
export class ProductosModule {}

