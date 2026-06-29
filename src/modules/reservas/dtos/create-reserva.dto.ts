import { IsNotEmpty, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateReservaDto {
  @ApiProperty({
    example: "a3b4c5d6-e7f8-9012-3456-7890abcdef12",
    description: "ID del producto a apartar",
  })
  @IsUUID("4")
  @IsNotEmpty()
  productoId: string;

  // El consumidorId no va en el DTO para prevenir Mass Assignment. Se extrae del JWT en el service.
}
