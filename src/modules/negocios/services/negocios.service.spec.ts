import { Test, TestingModule } from "@nestjs/testing";
import { NegociosService } from "./negocios.service";
import { NEGOCIOS_REPOSITORY } from "../repositories/negocios.repository.interface";
import { MAPA_ADAPTER } from "../../../core/adapters/mapa.adapter.interface";
import { RedisService } from "../../../redis/redis.service";
import { ConflictException } from "@nestjs/common";
import { CategoriaNegocios } from "../../../../generated/prisma";

describe("NegociosService", () => {
  let service: NegociosService;

  const mockNegociosRepository = {
    crear: jest.fn(),
    existePorUsuarioYNombre: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  const mockMapaAdapter = {
    geocodificar: jest.fn().mockResolvedValue({ lat: 21.1219, lng: -101.6692 }),
    calcularDistancia: jest.fn(),
  };

  const mockRedisService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NegociosService,
        {
          provide: NEGOCIOS_REPOSITORY,
          useValue: mockNegociosRepository,
        },
        {
          provide: MAPA_ADAPTER,
          useValue: mockMapaAdapter,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<NegociosService>(NegociosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("crear", () => {
    const dto = {
      nombre: "Mi Negocio",
      direccion: "Av. Centro 123",
      categoria: CategoriaNegocios.panaderia,
    };
    const userId = "user-123";

    it("should create a business, geocode the address, and publish a Redis event", async () => {
      mockNegociosRepository.existePorUsuarioYNombre.mockResolvedValue(false);
      mockNegociosRepository.crear.mockResolvedValue({
        id: "neg-123",
        nombre: dto.nombre,
        direccion: dto.direccion,
        categoria: dto.categoria,
        latitud: 21.1219,
        longitud: -101.6692,
        creadoEn: new Date(),
      });

      const result = await service.crear(userId, dto);

      expect(mockNegociosRepository.existePorUsuarioYNombre).toHaveBeenCalledWith(userId, dto.nombre);
      expect(mockMapaAdapter.geocodificar).toHaveBeenCalledWith(dto.direccion);
      expect(mockNegociosRepository.crear).toHaveBeenCalledWith({
        nombre: dto.nombre,
        direccion: dto.direccion,
        categoria: dto.categoria,
        latitud: 21.1219,
        longitud: -101.6692,
        usuarioId: userId,
      });
      expect(mockRedisService.publish).toHaveBeenCalledWith("negocio.creado", {
        negocioId: "neg-123",
        userId,
        nombre: dto.nombre,
        categoria: dto.categoria,
      });
      expect(result.id).toBe("neg-123");
    });

    it("should throw ConflictException if business name already exists for user", async () => {
      mockNegociosRepository.existePorUsuarioYNombre.mockResolvedValue(true);

      await expect(service.crear(userId, dto)).rejects.toThrow(ConflictException);
      expect(mockNegociosRepository.crear).not.toHaveBeenCalled();
    });

    it("should succeed even if Redis publishing throws an error", async () => {
      mockNegociosRepository.existePorUsuarioYNombre.mockResolvedValue(false);
      mockNegociosRepository.crear.mockResolvedValue({
        id: "neg-123",
        nombre: dto.nombre,
        direccion: dto.direccion,
        categoria: dto.categoria,
        latitud: 21.1219,
        longitud: -101.6692,
        creadoEn: new Date(),
      });
      mockRedisService.publish.mockRejectedValue(new Error("Redis offline"));

      const result = await service.crear(userId, dto);
      expect(result.id).toBe("neg-123");
      expect(mockRedisService.publish).toHaveBeenCalled();
    });
  });
});
