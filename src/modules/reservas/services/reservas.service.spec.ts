import { Test, TestingModule } from "@nestjs/testing";
import { ReservasService, JwtPayload } from "./reservas.service";
import {
  RESERVAS_REPOSITORY,
  ReservaConRelaciones,
} from "../repositories/reservas.repository.interface";
import { PrismaService } from "../../../core/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { CrearReservaUseCase } from "../use-cases/crear-reserva.use-case";
import { ReservaEntity } from "../entities/reserva.entity";

describe("ReservasService", () => {
  let service: ReservasService;
  let prisma: typeof mockPrismaService;
  let redisService: typeof mockRedisService;
  let crearReservaUseCase: typeof mockCrearReservaUseCase;

  const mockRepository = {
    findExpiradas: jest.fn(),
    updateEstado: jest.fn(),
  };

  const mockPrismaService = {
    producto: {
      update: jest.fn(),
    },
  };

  const mockRedisService = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  const mockCrearReservaUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: RESERVAS_REPOSITORY, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CrearReservaUseCase, useValue: mockCrearReservaUseCase },
      ],
    }).compile();

    service = module.get<ReservasService>(ReservasService);
    prisma = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    crearReservaUseCase = module.get<CrearReservaUseCase>(CrearReservaUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("crearReserva", () => {
    it("should delegate execution to CrearReservaUseCase", async () => {
      const user: JwtPayload = {
        sub: "usr-1",
        email: "test@example.com",
        rol: "consumidor",
        negocioId: "neg-1",
      };
      const mockReserva = new ReservaEntity({ id: "res-123" });
      crearReservaUseCase.execute.mockResolvedValue(mockReserva);

      const result = await service.crearReserva("prod-123", user);

      expect(crearReservaUseCase.execute).toHaveBeenCalledWith(
        "prod-123",
        "usr-1",
        "neg-1"
      );
      expect(result).toBe(mockReserva);
    });
  });

  describe("cancelarReservasExpiradas", () => {
    const mockExpiradas: ReservaConRelaciones[] = [
      {
        id: "res-1",
        productoId: "prod-1",
        consumidorId: "usr-1",
        negocioId: "negocio-1",
        estado: "pendiente",
        expiresAt: new Date(),
        fechaRecoleccion: null,
        creadaEn: new Date(),
        actualizadoEn: new Date(),
        producto: {
          id: "prod-1",
          nombre: "Pan",
          estado: "apartado",
          cantidadDisponible: 0,
          negocioId: "negocio-1",
          kgSalvados: null,
        },
        consumidor: { id: "usr-1" },
        negocio: { id: "negocio-1" },
      },
      {
        id: "res-2",
        productoId: "prod-2",
        consumidorId: "usr-2",
        negocioId: "negocio-1",
        estado: "pendiente",
        expiresAt: new Date(),
        fechaRecoleccion: null,
        creadaEn: new Date(),
        actualizadoEn: new Date(),
        producto: {
          id: "prod-2",
          nombre: "Pastel",
          estado: "disponible",
          cantidadDisponible: 2,
          negocioId: "negocio-1",
          kgSalvados: 1.5,
        },
        consumidor: { id: "usr-2" },
        negocio: { id: "negocio-1" },
      },
    ];

    it("should process all expired reservations and restore product state correctly", async () => {
      mockRepository.findExpiradas.mockResolvedValue(mockExpiradas);

      await service.cancelarReservasExpiradas();

      expect(mockRepository.updateEstado).toHaveBeenCalledWith("res-1", "expirado");
      expect(mockRepository.updateEstado).toHaveBeenCalledWith("res-2", "expirado");

      // Product 1 had status "apartado" -> restores to "disponible" and increments stock
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { cantidadDisponible: { increment: 1 }, estado: "disponible" },
      });

      // Product 2 was still "disponible" -> only increments stock
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: "prod-2" },
        data: { cantidadDisponible: { increment: 1 } },
      });

      // Redis event published for both
      expect(redisService.publish).toHaveBeenCalledTimes(2);
      expect(redisService.publish).toHaveBeenNthCalledWith(
        1,
        "reserva.expirada",
        {
          reservaId: "res-1",
          productoId: "prod-1",
          consumidorId: "usr-1",
        }
      );
    });

    it("should handle cron task execute handleCronReservasExpiradas", async () => {
      mockRepository.findExpiradas.mockResolvedValue([]);

      await service.handleCronReservasExpiradas();

      expect(mockRepository.findExpiradas).toHaveBeenCalled();
    });
  });
});
