import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsBoolean,
  Equals,
  IsEnum,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { CategoriaNegocios } from "../../../../generated/prisma";

export class RegisterBusinessDto {
  // --- Datos del Usuario ---
  @ApiProperty({
    example: "Juan Pérez",
    description: "Nombre del propietario del negocio",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[A-Za-záéíóúÁÉÍÓÚñÑ ]{2,80}$/, {
    message: "Solo se permiten letras y espacios",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  nombre: string;

  @ApiProperty({
    example: "juan.perez@example.com",
    description: "Correo electrónico del propietario",
  })
  @IsEmail({}, { message: "Ingresa un correo válido" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  correo: string;

  @ApiProperty({
    example: "Contrasena1!",
    description: "Contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número, 1 símbolo)",
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: "La contraseña no cumple los requisitos",
  })
  contrasena: string;

  @ApiProperty({
    example: "Contrasena1!",
    description: "Confirmación de la contraseña",
  })
  @IsString()
  @MinLength(1)
  confirmacionContrasena: string;

  @ApiProperty({
    example: true,
    description: "Debe ser true para aceptar los términos y el aviso de privacidad",
  })
  @IsBoolean()
  @Equals(true, { message: "Debes aceptar el aviso de privacidad" })
  consentimientoPrivacidad: boolean;

  // --- Datos del Negocio ---
  @ApiProperty({
    example: "Panadería La Central",
    description: "Nombre comercial del negocio",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[^<>{}[\]]*$/, { message: "El nombre no puede contener HTML" })
  @Transform(({ value }) => value?.trim())
  nombreNegocio: string;

  @ApiProperty({
    example: "Av. Juárez 123, Centro, León",
    description: "Dirección física del local que será geocodificada",
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  direccionNegocio: string;

  @ApiProperty({
    enum: CategoriaNegocios,
    example: "panaderia",
    description: "Categoría del tipo de negocio",
  })
  @IsEnum(CategoriaNegocios)
  categoriaNegocio: CategoriaNegocios;
}
