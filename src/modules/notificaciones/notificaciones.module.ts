import { Module } from "@nestjs/common";
import { NotificacionesService } from "./services/notificaciones.service";
import { NotificacionesController } from "./controllers/notificaciones.controller";

@Module({
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
})
export class NotificacionesModule {}
