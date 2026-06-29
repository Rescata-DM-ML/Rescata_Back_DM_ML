import { Injectable } from "@nestjs/common";
import { ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: "ExpirationDate", async: false })
@Injectable()
export class ExpirationDateValidator implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!value) return false;
    const date = new Date(value as string | number | Date);
    return date.getTime() > Date.now();
  }

  defaultMessage() {
    return "La fecha de caducidad debe ser posterior a la fecha actual";
  }
}
