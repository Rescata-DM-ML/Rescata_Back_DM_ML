import { Module } from "@nestjs/common";
import { NotificacionesService } from "./services/notificaciones.service";

@Module({
  providers: [NotificacionesService],
})
export class NotificacionesModule {}
