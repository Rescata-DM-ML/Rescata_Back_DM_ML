import { Controller, Post, Body, Res, HttpCode } from "@nestjs/common";
import * as express from "express";
import { AuthService } from "../services/auth.service";
import { LoginDto } from "../dtos/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const { token, user } = await this.authService.login(loginDto);

    response.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return { message: "Login exitoso", user };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) response: express.Response) {
    response.cookie("token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return { message: "Sesión cerrada" };
  }
}
