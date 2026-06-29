import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "supersecreto",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
