import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../../core/prisma.service";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let prisma: typeof mockPrismaService;
  let jwtService: typeof mockJwtService;

  const mockPrismaService = {
    usuario: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("mocked-token"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    const loginDto = {
      correo: "test@example.com",
      contrasena: "password123",
    };

    it("should throw UnauthorizedException if user does not exist", async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { correo: loginDto.correo },
        include: { negocio: true },
      });
    });

    it("should throw UnauthorizedException if user is soft-deleted", async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: "user-1",
        deletedAt: new Date(),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: "user-1",
        correo: "test@example.com",
        passwordHash: "hash-123",
        deletedAt: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should successfully log in and return a token and user details", async () => {
      const mockUser = {
        id: "user-1",
        nombre: "John Doe",
        correo: "test@example.com",
        passwordHash: "hash-123",
        rol: "consumidor",
        deletedAt: null,
        negocio: { id: "negocio-1" },
      };
      prisma.usuario.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({
        token: "mocked-token",
        user: {
          id: mockUser.id,
          nombre: mockUser.nombre,
          correo: mockUser.correo,
          rol: mockUser.rol,
        },
      });
    });

    it("should handle login when user has no negocio associated", async () => {
      const mockUser = {
        id: "user-2",
        nombre: "Jane Doe",
        correo: "jane@example.com",
        passwordHash: "hash-456",
        rol: "negocio",
        deletedAt: null,
        negocio: null,
      };
      prisma.usuario.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        correo: "jane@example.com",
        contrasena: "pass456",
      });

      expect(result.token).toBe("mocked-token");
      expect(result.user.id).toBe("user-2");
    });
  });
});
