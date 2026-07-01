import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../../core/guards/auth.guard";
import { RolesGuard } from "../../../core/guards/roles.guard";
import { Roles } from "../../../core/decorators/roles.decorator.decorator";

@Controller("estadisticas")
export class EstadisticasController {
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("negocio")
  async getEstadisticas() {
    return { message: "GET /estadisticas - negocio skeleton" };
  }
}
