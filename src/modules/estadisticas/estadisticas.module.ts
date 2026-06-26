import { Module } from "@nestjs/common";
import { EstadisticasService } from "./services/estadisticas.service";

@Module({
  providers: [EstadisticasService],
})
export class EstadisticasModule {}
