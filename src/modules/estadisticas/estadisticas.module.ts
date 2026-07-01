import { Module } from "@nestjs/common";
import { EstadisticasService } from "./services/estadisticas.service";
import { EstadisticasController } from "./controllers/estadisticas.controller";

@Module({
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}
