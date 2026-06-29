import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthGuard } from "../../../core/guards/auth.guard";
import { RolesGuard } from "../../../core/guards/roles.guard";
import { Roles } from "../../../core/decorators/roles.decorator.decorator";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { CreateReservaDto } from "../dtos/create-reserva.dto";
import { ReservaEntity } from "../entities/reserva.entity";
import { ReservasService } from "../services/reservas.service";
import type { JwtPayload } from "../services/reservas.service";

@ApiTags("Reservas")
@Controller("reservas")
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("consumidor")
  @ApiOperation({
    summary: "Apartar un producto disponible",
    description:
      "Crea una reserva con expiración de 2 horas. Solo consumidores pueden apartar. La reducción de inventario es atómica via $transaction de Prisma.",
  })
  @ApiBody({ type: CreateReservaDto })
  @ApiResponse({
    status: 201,
    type: ReservaEntity,
    description: "Reserva creada exitosamente",
  })
  @ApiResponse({ status: 404, description: "Producto no encontrado" })
  @ApiResponse({
    status: 409,
    description:
      "Producto no disponible, sin stock o reserva duplicada",
  })
  @ApiResponse({
    status: 403,
    description:
      "No puedes apartar tu propio producto o rol incorrecto",
  })
  async crearReserva(
    @Body() dto: CreateReservaDto,
    @CurrentUser() user: JwtPayload
  ): Promise<ReservaEntity> {
    // Nota: El negocioId del consumidor se extrae de forma segura a través del JWT payload (user.negocioId)
    // para prevenir problemas de propiedad y evitar vulnerabilidades de Mass Assignment (no viene en el Body).
    return this.reservasService.crearReserva(dto.productoId, user);
  }

  @Get("mis-reservas")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("consumidor")
  async getMisReservas() {
    return { message: "GET /reservas/mis-reservas - consumidor skeleton" };
  }

  @Get("negocio")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("negocio")
  async getReservasNegocio() {
    return { message: "GET /reservas/negocio - negocio skeleton" };
  }

  @Put(":id/confirmar")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("negocio")
  async confirmarReserva(@Param("id") id: string) {
    return { message: `PUT /reservas/${id}/confirmar - negocio skeleton` };
  }

  @Put(":id/cancelar")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("consumidor", "negocio")
  async cancelarReserva(@Param("id") id: string) {
    return { message: `PUT /reservas/${id}/cancelar - consumidor/negocio skeleton` };
  }
}

// PRUEBA DOCUMENTADA
//
// PREREQUISITO: Tener usuario consumidor con JWT.
// Usar los datos insertados en RF-BE-06 o crear nuevos con estos SQLs:
//
// -- Usuario consumidor
// INSERT INTO usuarios (id, nombre, correo, "passwordHash", rol, "consentimientoPrivacidad", "creadoEn", "actualizadoEn")
// VALUES ('usr-con-001', 'Juan Consumidor', 'juan@test.com', '$2b$12$placeholder', 'consumidor', true, NOW(), NOW());
//
// CASO 1 — Apartado exitoso (HTTP 201):
// POST /reservas
// Header: Authorization: Bearer <token-consumidor>
// Body: { "productoId": "prod-001" }
// Respuesta esperada:
// {
//   "success": true,
//   "data": {
//     "id": "uuid",
//     "productoId": "prod-001",
//     "consumidorId": "usr-con-001",
//     "estado": "pendiente",
//     "expiresAt": "...+2h"
//   }
// }
// En redis-cli SUBSCRIBE reserva.creada debe aparecer el evento.
//
// CASO 2 — Producto no existe (HTTP 404):
// POST /reservas
// Body: { "productoId": "uuid-inexistente" }
// Respuesta: { "error": "producto_no_encontrado" }
//
// CASO 3 — Reserva duplicada (HTTP 409):
// Hacer POST /reservas dos veces con el mismo productoId. Segunda llamada debe dar:
// { "error": "reserva_duplicada" }
//
// CASO 4 — Verificar evento en Redis:
// docker exec -it rescata_redis redis-cli
// > SUBSCRIBE reserva.creada
// Luego hacer POST /reservas exitoso.
// Debe aparecer el mensaje JSON en redis-cli.
