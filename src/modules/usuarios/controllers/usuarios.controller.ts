import { Controller, Get, Put, Delete, Post, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthGuard } from "../../../core/guards/auth.guard";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { UsuariosService } from "../services/usuarios.service";
import { UpdateUsuarioDto } from "../dtos/update-usuario.dto";

@Controller("usuarios")
@UseGuards(AuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get("me")
  async getMe(@CurrentUser() user: { sub: string }) {
    return this.usuariosService.getMiPerfil(user.sub);
  }

  @Put("me")
  async updateMe(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.updateMiPerfil(user.sub, dto);
  }

  @Delete("me")
  @HttpCode(HttpStatus.OK)
  async deleteMe(@CurrentUser() user: { sub: string }) {
    return this.usuariosService.solicitarCancelacion(user.sub);
  }

  @Post("me/oposicion")
  @HttpCode(HttpStatus.OK)
  async solicitarOposicion(@CurrentUser() user: { sub: string }) {
    return this.usuariosService.solicitarOposicion(user.sub);
  }
}
