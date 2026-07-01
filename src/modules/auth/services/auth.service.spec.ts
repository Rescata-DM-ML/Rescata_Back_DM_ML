/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException, BadRequestException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../../core/prisma.service";
import { MAPA_ADAPTER } from "../../../core/adapters/mapa.adapter.interface";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let prisma: typeof mockPrismaService;
  let jwtService: typeof mockJwtService;
  let mapaAdapter: typeof mockMapaAdapter;

  const mockPrismaService = {
    usuario: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    negocio: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("mocked-token"),
  };

  const mockMapaAdapter = {
    geocodificar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MAPA_ADAPTER, useValue: mockMapaAdapter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService) as any;
    jwtService = module.get<JwtService>(JwtService) as any;
    mapaAdapter = module.get<any>(MAPA_ADAPTER);
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

  describe("registerBusiness", () => {
    const registerBusinessDto = {
      nombre: "Owner Name",
      correo: "owner@example.com",
      contrasena: "Password123!",
      confirmacionContrasena: "Password123!",
      consentimientoPrivacidad: true,
      nombreNegocio: "Panadería Central",
      direccionNegocio: "Av. Juárez 123, León",
      categoriaNegocio: "panaderia" as any,
    };

    it("should throw BadRequestException if passwords do not match", async () => {
      const badDto = {
        ...registerBusinessDto,
        confirmacionContrasena: "different",
      };

      await expect(service.registerBusiness(badDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it("should throw ConflictException if email is already registered", async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: "existing-id" });

      await expect(service.registerBusiness(registerBusinessDto)).rejects.toThrow(
        ConflictException
      );
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { correo: registerBusinessDto.correo },
      });
    });

    it("should throw BadRequestException if geocoding fails", async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      mapaAdapter.geocodificar.mockRejectedValue(new Error("Geocoding failed"));

      await expect(service.registerBusiness(registerBusinessDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it("should successfully register business and return token and user details", async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      mapaAdapter.geocodificar.mockResolvedValue({ lat: 21.12, lng: -101.68 });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");

      const createdUser = {
        id: "new-user-id",
        nombre: registerBusinessDto.nombre,
        correo: registerBusinessDto.correo,
        rol: "negocio",
        creadoEn: new Date(),
      };

      const createdNegocio = {
        id: "new-negocio-id",
        nombre: registerBusinessDto.nombreNegocio,
        categoria: registerBusinessDto.categoriaNegocio,
      };

      prisma.usuario.create.mockResolvedValue(createdUser);
      prisma.negocio.create.mockResolvedValue(createdNegocio);

      const result = await service.registerBusiness(registerBusinessDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.usuario.create).toHaveBeenCalled();
      expect(prisma.negocio.create).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: createdUser.id,
        email: createdUser.correo,
        rol: createdUser.rol,
        negocioId: createdNegocio.id,
      });

      expect(result).toEqual({
        token: "mocked-token",
        user: {
          id: createdUser.id,
          nombre: createdUser.nombre,
          correo: createdUser.correo,
          rol: createdUser.rol,
        },
      });
    });
  });
});
