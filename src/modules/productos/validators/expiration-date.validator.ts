import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { Injectable } from "@nestjs/common";

@ValidatorConstraint({ name: "isFutureDate", async: false })
@Injectable()
export class ExpirationDateValidator implements ValidatorConstraintInterface {
  /**
   * Valida si el valor de la fecha es posterior a la fecha y hora actual.
   *
   * @param value El valor del campo a validar
   * @returns true si es una fecha futura válida, false de lo contrario
   */
  validate(value: unknown): boolean {
    if (!value || (typeof value !== "string" && !(value instanceof Date))) {
      return false;
    }
    const dateValue = new Date(value);
    return !isNaN(dateValue.getTime()) && dateValue.getTime() > Date.now();
  }

  /**
   * Devuelve el mensaje de error por defecto en caso de fallo.
   *
   * @returns Mensaje de error en español
   */
  defaultMessage(): string {
    return "La fecha de caducidad debe ser posterior a la fecha y hora actual";
  }
}

/**
 * Decorador personalizado para validar que una fecha esté en el futuro.
 *
 * @param validationOptions Opciones adicionales de validación
 */
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: "isFutureDate",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ExpirationDateValidator,
    });
  };
}
