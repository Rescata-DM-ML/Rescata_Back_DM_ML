import { Test, TestingModule } from "@nestjs/testing";
import { Response } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "../services/auth.service";
import { LoginDto } from "../dtos/login.dto";

describe("AuthController", () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      token: "mocked-jwt",
      user: {
        id: "user-123",
        nombre: "John Doe",
        correo: "john@example.com",
        rol: "consumidor",
      },
    }),
  };

  const mockResponse = {
    cookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    it("should authenticate the user, set a cookie and return success message", async () => {
      const loginDto: LoginDto = {
        correo: "john@example.com",
        contrasena: "password123",
      };

      const result = await controller.login(loginDto, mockResponse);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith("token", "mocked-jwt", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      expect(result).toEqual({
        message: "Login exitoso",
        user: {
          id: "user-123",
          nombre: "John Doe",
          correo: "john@example.com",
          rol: "consumidor",
        },
      });
    });
  });

  describe("logout", () => {
    it("should clear the authentication cookie and return success message", async () => {
      const result = await controller.logout(mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith("token", "", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 0,
        path: "/",
      });
      expect(result).toEqual({
        message: "Sesión cerrada",
      });
    });
  });
});
