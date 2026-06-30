import { IsOptional, IsString, MinLength, MaxLength, Matches, IsEmail } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[A-Za-záéíóúÁÉÍÓÚñÑ ]{2,80}$/, {
    message: "Solo se permiten letras y espacios",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  nombre?: string;

  @IsOptional()
  @IsEmail({}, { message: "Ingresa un correo válido" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  correo?: string;
}
