/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from "@nestjs/testing";
import { ProductosService } from "./productos.service";
import { PRODUCTOS_REPOSITORY } from "../repositories/productos.repository.interface";
import { CercanosQueryDto } from "../dtos/cercanos-query.dto";
import { RedisService } from "../../../redis/redis.service";
import { ALMACENAMIENTO_ADAPTER } from "../../../core/adapters/almacenamiento.adapter.interface";

describe("ProductosService", () => {
  let service: ProductosService;
  let repositoryMock: any;
  let redisServiceMock: { publish: jest.Mock };
  let almacenamientoAdapterMock: { subir: jest.Mock };

  beforeEach(async () => {
    repositoryMock = {
      findCercanos: jest.fn().mockResolvedValue({
        data: [
          {
            id: "prod-123",
            nombre: "Pan dulce",
            precioOferta: 35.0,
            fechaCaducidad: new Date("2026-07-15T20:00:00.000Z"),
            distanciaKm: 0.8,
            fotoUrl: "https://r2.dev/foto.jpg",
            negocioNombre: "Panadería El Sol",
            calificacionPromedio: 4.5,
          },
        ],
        nextCursor: "prod-123",
        total: 1,
      }),
      findById: jest.fn(),
      actualizar: jest.fn(),
      eliminar: jest.fn(),
      buscar: jest.fn(),
    };

    redisServiceMock = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    almacenamientoAdapterMock = {
      subir: jest.fn().mockResolvedValue("https://r2.dev/foto.jpg"),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        {
          provide: PRODUCTOS_REPOSITORY,
          useValue: repositoryMock,
        },
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
        {
          provide: ALMACENAMIENTO_ADAPTER,
          useValue: almacenamientoAdapterMock,
        },
      ],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should map raw repository rows into ProductoEntity instances", async () => {
    const query: CercanosQueryDto = {
      lat: 21.1511,
      lng: -100.9347,
      radio: 10,
      page: 1,
      limit: 20,
    };

    const result = await service.findCercanos(query);

    expect(repositoryMock.findCercanos).toHaveBeenCalledWith({
      lat: 21.1511,
      lng: -100.9347,
      radio: 10,
      page: 1,
      limit: 20,
    });

    expect(result.data).toHaveLength(1);
    const entity = result.data[0];
    expect(entity.id).toBe("prod-123");
    expect(entity.nombre).toBe("Pan dulce");
    expect(entity.precioOferta).toBe(35.0);
    expect(entity.distanciaKm).toBe(0.8);
    expect(entity.fotoUrl).toBe("https://r2.dev/foto.jpg");
    expect(entity.negocio).toEqual({
      nombre: "Panadería El Sol",
      calificacionPromedio: 4.5,
    });
    expect(result.nextCursor).toBe("prod-123");
    expect(result.total).toBe(1);
  });

  describe("crear", () => {
    it("should successfully create a product and publish to Redis", async () => {
      const dto = {
        nombre: "Pastel de Chocolate",
        descripcion: "Delicioso pastel tres leches",
        precioOriginal: 100,
        precioOferta: 50,
        cantidadDisponible: 5,
        fechaCaducidad: new Date("2026-07-20T20:00:00.000Z"),
      };

      const mockCreatedProduct = {
        id: "prod-abc",
        negocioId: "negocio-123",
        ...dto,
        estado: "disponible",
        creadoEn: new Date(),
      };

      repositoryMock["crear"] = jest.fn().mockResolvedValue(mockCreatedProduct);

      const result = await service.crear("negocio-123", dto);

      expect(repositoryMock["crear"]).toHaveBeenCalledWith({
        ...dto,
        descripcion: dto.descripcion,
        negocioId: "negocio-123",
      });
      expect(redisServiceMock.publish).toHaveBeenCalledWith("producto.publicado", {
        productoId: "prod-abc",
        negocioId: "negocio-123",
        cantidadDisponible: 5,
        fechaCaducidad: mockCreatedProduct.fechaCaducidad,
      });
      expect(result.id).toBe("prod-abc");
    });

    it("should throw BadRequestException if precioOferta is not less than precioOriginal", async () => {
      const dto = {
        nombre: "Pastel de Chocolate",
        descripcion: "Delicioso pastel tres leches",
        precioOriginal: 100,
        precioOferta: 120, // Invalid! Offer must be < original
        cantidadDisponible: 5,
        fechaCaducidad: new Date("2026-07-20T20:00:00.000Z"),
      };

      await expect(service.crear("negocio-123", dto)).rejects.toThrow(
        expect.objectContaining({
          response: {
            error: "precio_invalido",
            message: "El precio de oferta debe ser menor al precio original",
          },
        }),
      );
    });
  });

  describe("findById con BOLA", () => {
    it("debe retornar el producto si no se requiere validacion de negocioId", async () => {
      const mockProduct = { id: "p1", negocioId: "n1", nombre: "Prod 1" };
      repositoryMock.findById.mockResolvedValue(mockProduct);

      const result = await service.findById("p1");
      expect(result).toEqual(mockProduct);
    });

    it("debe retornar el producto si el negocioId coincide con el del JWT", async () => {
      const mockProduct = { id: "p1", negocioId: "n1", nombre: "Prod 1" };
      repositoryMock.findById.mockResolvedValue(mockProduct);

      const result = await service.findById("p1", "n1");
      expect(result).toEqual(mockProduct);
    });

    it("debe lanzar NotFoundException si el producto no existe", async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.findById("p1", "n1")).rejects.toThrow(
        expect.objectContaining({
          response: {
            error: "producto_no_encontrado",
            message: "El producto con ID p1 no existe",
          },
        }),
      );
    });

    it("debe lanzar ForbiddenException si el producto no pertenece al negocio del JWT", async () => {
      const mockProduct = { id: "p1", negocioId: "n2", nombre: "Prod 1" };
      repositoryMock.findById.mockResolvedValue(mockProduct);

      await expect(service.findById("p1", "n1")).rejects.toThrow(
        expect.objectContaining({
          response: {
            error: "acceso_denegado",
          },
        }),
      );
    });
  });

  describe("actualizar y eliminar con BOLA", () => {
    it("actualizar debe lanzar ForbiddenException si no pertenece al negocio", async () => {
      const mockProduct = { id: "p1", negocioId: "n2", nombre: "Prod 1" };
      repositoryMock.findById.mockResolvedValue(mockProduct);

      await expect(service.actualizar("p1", "n1", {})).rejects.toThrow(
        expect.objectContaining({
          response: {
            error: "acceso_denegado",
          },
        }),
      );
    });

    it("eliminar debe lanzar ForbiddenException si no pertenece al negocio", async () => {
      const mockProduct = { id: "p1", negocioId: "n2", nombre: "Prod 1" };
      repositoryMock.findById.mockResolvedValue(mockProduct);

      await expect(service.eliminar("p1", "n1")).rejects.toThrow(
        expect.objectContaining({
          response: {
            error: "acceso_denegado",
          },
        }),
      );
    });
  });
});
