import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsBoolean,
  Equals,
} from "class-validator";
import { Transform } from "class-transformer";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[A-Za-záéíóúÁÉÍÓÚñÑ ]{2,80}$/, {
    message: "Solo se permiten letras y espacios",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  nombre: string;

  @IsEmail({}, { message: "Ingresa un correo válido" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  correo: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: "La contraseña no cumple los requisitos",
  })
  contrasena: string;

  @IsString()
  @MinLength(1)
  confirmacionContrasena: string;

  @IsBoolean()
  @Equals(true, { message: "Debes aceptar el aviso de privacidad" })
  consentimientoPrivacidad: boolean;
}
