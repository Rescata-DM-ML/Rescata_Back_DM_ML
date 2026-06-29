import { Test, TestingModule } from "@nestjs/testing";
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { CrearReservaUseCase } from "./crear-reserva.use-case";
import { PrismaService } from "../../../core/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { Prisma } from "../../../../generated/prisma";
import { ReservaEntity } from "../entities/reserva.entity";

describe("CrearReservaUseCase", () => {
  let useCase: CrearReservaUseCase;
  let redisService: typeof mockRedisService;

  const mockTransaction = {
    producto: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reserva: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn().mockImplementation((cb) => cb(mockTransaction)),
  };

  const mockRedisService = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrearReservaUseCase,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    useCase = module.get<CrearReservaUseCase>(CrearReservaUseCase);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  describe("execute", () => {
    const mockProduct = {
      id: "prod-1",
      nombre: "Producto Test",
      estado: "disponible",
      cantidadDisponible: 5,
      negocio: { id: "negocio-1" },
    };

    it("should throw NotFoundException if product does not exist", async () => {
      mockTransaction.producto.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute("prod-invalid", "usr-1", "negocio-2")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException if product state is not disponible", async () => {
      mockTransaction.producto.findUnique.mockResolvedValue({
        ...mockProduct,
        estado: "apartado",
      });

      await expect(
        useCase.execute("prod-1", "usr-1", "negocio-2")
      ).rejects.toThrow(ConflictException);
    });

    it("should throw ConflictException if product quantity is 0 or less", async () => {
      mockTransaction.producto.findUnique.mockResolvedValue({
        ...mockProduct,
        cantidadDisponible: 0,
      });

      await expect(
        useCase.execute("prod-1", "usr-1", "negocio-2")
      ).rejects.toThrow(ConflictException);
    });

    it("should throw ForbiddenException if user owns the negocio of the product (BOLA prevention)", async () => {
      mockTransaction.producto.findUnique.mockResolvedValue(mockProduct);

      await expect(
        useCase.execute("prod-1", "usr-1", "negocio-1")
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ConflictException if active reservation already exists", async () => {
      mockTransaction.producto.findUnique.mockResolvedValue(mockProduct);
      mockTransaction.reserva.findFirst.mockResolvedValue({ id: "res-exist" });

      await expect(
        useCase.execute("prod-1", "usr-1", "negocio-2")
      ).rejects.toThrow(ConflictException);
    });

    it("should successfully reserve product decrementing stock (stock > 1)", async () => {
      mockTransaction.producto.findUnique.mockResolvedValue(mockProduct);
      mockTransaction.reserva.findFirst.mockResolvedValue(null);
      mockTransaction.reserva.create.mockResolvedValue({
        id: "res-new",
        productoId: "prod-1",
        consumidorId: "usr-1",
        negocioId: "negocio-1",
        estado: "pendiente",
        expiresAt: new Date(),
        fechaRecoleccion: null,
        creadaEn: new Date(),
        actualizadoEn: new Date(),
      });

      const result = await useCase.execute("prod-1", "usr-1", "negocio-2");

      expect(mockTransaction.producto.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { cantidadDisponible: { decrement: 1 } },
      });
      expect(redisService.publish).toHaveBeenCalledWith(
        "reserva.creada",
        expect.any(Object)
      );
      expect(result).toBeInstanceOf(ReservaEntity);
      expect(result.id).toBe("res-new");
    });

    it("should successfully reserve product transition to 'apartado' when stock is 1", async () => {
      mockTransaction.producto.findUnique.mockResolvedValue({
        ...mockProduct,
        cantidadDisponible: 1,
      });
      mockTransaction.reserva.findFirst.mockResolvedValue(null);
      mockTransaction.reserva.create.mockResolvedValue({
        id: "res-new-apartado",
        productoId: "prod-1",
        consumidorId: "usr-1",
        negocioId: "negocio-1",
        estado: "pendiente",
        expiresAt: new Date(),
        fechaRecoleccion: null,
        creadaEn: new Date(),
        actualizadoEn: new Date(),
      });

      const result = await useCase.execute("prod-1", "usr-1", "negocio-2");

      expect(mockTransaction.producto.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { cantidadDisponible: { decrement: 1 }, estado: "apartado" },
      });
      expect(result.id).toBe("res-new-apartado");
    });

    it("should throw ConflictException on Prisma unique constraint error P2002", async () => {
      mockTransaction.producto.findUnique.mockResolvedValue(mockProduct);
      mockTransaction.reserva.findFirst.mockResolvedValue(null);
      mockTransaction.reserva.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Conflict", {
          code: "P2002",
          clientVersion: "7.8.0",
        })
      );

      await expect(
        useCase.execute("prod-1", "usr-1", "negocio-2")
      ).rejects.toThrow(ConflictException);
    });

    it("should gracefully handle Redis errors when publishing event", async () => {
      mockTransaction.producto.findUnique.mockResolvedValue(mockProduct);
      mockTransaction.reserva.findFirst.mockResolvedValue(null);
      mockTransaction.reserva.create.mockResolvedValue({
        id: "res-redis-fail",
        productoId: "prod-1",
        consumidorId: "usr-1",
        negocioId: "negocio-1",
        estado: "pendiente",
      });
      redisService.publish.mockRejectedValue(new Error("Redis offline"));

      const result = await useCase.execute("prod-1", "usr-1", "negocio-2");
      expect(result.id).toBe("res-redis-fail");
    });
  });
});
