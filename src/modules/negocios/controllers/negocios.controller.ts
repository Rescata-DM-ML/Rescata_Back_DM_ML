import { Controller, Get, Post, Put, Delete, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../../core/guards/auth.guard";
import { RolesGuard } from "../../../core/guards/roles.guard";
import { Roles } from "../../../core/decorators/roles.decorator.decorator";

@Controller("negocios")
export class NegociosController {
  @Get()
  async getNegocios() {
    return { message: "GET /negocios - public skeleton" };
  }

  @Get(":id")
  async getNegocioById(@Param("id") id: string) {
    return { message: `GET /negocios/${id} - public skeleton` };
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("consumidor")
  async crearNegocio() {
    return { message: "POST /negocios - consumidor skeleton" };
  }

  @Put(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("negocio")
  async actualizarNegocio(@Param("id") id: string) {
    return { message: `PUT /negocios/${id} - negocio skeleton` };
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("negocio")
  async eliminarNegocio(@Param("id") id: string) {
    return { message: `DELETE /negocios/${id} - negocio skeleton` };
  }
}
