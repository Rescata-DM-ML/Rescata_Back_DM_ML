import { Controller, Get, Post, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../../core/guards/auth.guard";
import { RolesGuard } from "../../../core/guards/roles.guard";
import { Roles } from "../../../core/decorators/roles.decorator.decorator";

@Controller("chat")
export class ChatController {
  @Get(":reservaId")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("consumidor", "negocio")
  async getChat(@Param("reservaId") reservaId: string) {
    return { message: `GET /chat/${reservaId} - consumidor/negocio skeleton` };
  }

  @Post(":reservaId/mensaje")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("consumidor", "negocio")
  async enviarMensaje(@Param("reservaId") reservaId: string) {
    return { message: `POST /chat/${reservaId}/mensaje - consumidor/negocio skeleton` };
  }
}
