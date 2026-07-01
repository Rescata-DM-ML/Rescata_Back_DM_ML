import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../../core/guards/auth.guard";
import { RolesGuard } from "../../../core/guards/roles.guard";
import { Roles } from "../../../core/decorators/roles.decorator.decorator";

@Controller("notificaciones")
export class NotificacionesController {
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("consumidor", "negocio")
  async getNotificaciones() {
    return { message: "GET /notificaciones - consumidor/negocio skeleton" };
  }
}
