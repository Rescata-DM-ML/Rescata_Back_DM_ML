import { Controller, Post, Body, Res, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import * as express from "express";
import { AuthService } from "../services/auth.service";
import { LoginDto } from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";
import { RegisterBusinessDto } from "../dtos/register-business.dto";

@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: express.Response) {
    const { token, user } = await this.authService.login(loginDto);

    response.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return { message: "Login exitoso", user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: express.Response) {
    response.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return { message: "Sesión cerrada" };
  }

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post("register/consumer")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post("register/business")
  @HttpCode(HttpStatus.CREATED)
  async registerBusiness(
    @Body() registerBusinessDto: RegisterBusinessDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const { token, user } = await this.authService.registerBusiness(registerBusinessDto);

    response.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return { message: "Registro de negocio exitoso", user };
  }
}
