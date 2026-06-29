import { Test, TestingModule } from "@nestjs/testing";
import { ProductosService } from "./productos.service";
import { PRODUCTOS_REPOSITORY } from "../repositories/productos.repository.interface";
import { CercanosQueryDto } from "../dtos/cercanos-query.dto";
describe("ProductosService", () => {
  let service: ProductosService;
  let repositoryMock: { findCercanos: jest.Mock };

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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        {
          provide: PRODUCTOS_REPOSITORY,
          useValue: repositoryMock,
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
});
