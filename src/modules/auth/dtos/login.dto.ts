import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "El correo debe ser un correo electrónico válido" })
  correo: string;

  @IsString({ message: "La contraseña debe ser un texto" })
  @MinLength(1, { message: "La contraseña es requerida" })
  contrasena: string;
}
