import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

/**
 * DTO para la creación de una reserva.
 *
 * NOTA DE SEGURIDAD IMPORTANTE (OWASP):
 * No se debe incluir el campo `consumidorId` en este DTO. El `consumidorId`
 * se obtiene directamente del JWT del usuario autenticado en el controlador
 * o servicio (a través de un decorador como `@CurrentUser()`).
 * Si se expusiera este campo en el DTO, un atacante podría realizar un
 * ataque de asignación masiva (Mass Assignment), enviando el identificador
 * de cualquier otro usuario para hacer reservas no autorizadas a su nombre.
 */
export class CreateReservaDto {
  @ApiProperty({
    description: "Identificador único (UUID v4) del producto a reservar",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  @IsNotEmpty({ message: "El productoId es obligatorio" })
  @IsUUID("4", { message: "El productoId debe ser un UUID v4 válido" })
  productoId!: string;
}
