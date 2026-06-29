import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          return req?.cookies?.token ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "supersecreto",
    });
  }

  async validate(payload: unknown) {
    // payload contains: { sub: userId, email, rol, negocioId }
    return payload;
  }
}
