import { ValidatorConstraint, ValidatorConstraintInterface, ValidationOptions, ValidateBy } from "class-validator";

@ValidatorConstraint({ name: "isFutureDate", async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return value instanceof Date && value > new Date();
  }
  defaultMessage() {
    return "La fecha de caducidad debe ser posterior a la fecha y hora actual";
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return ValidateBy(
    { name: "isFutureDate", validator: new IsFutureDateConstraint() },
    validationOptions
  );
}
