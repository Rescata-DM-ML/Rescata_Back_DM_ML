import { Test, TestingModule } from "@nestjs/testing";
import { ProductosController } from "./productos.controller";
import { ProductosService } from "../services/productos.service";
import { CercanosQueryDto } from "../dtos/cercanos-query.dto";

describe("ProductosController", () => {
  let controller: ProductosController;
  let service: ProductosService;

  const mockProductosService = {
    findCercanos: jest.fn().mockResolvedValue({
      data: [],
      nextCursor: null,
      total: 0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductosController],
      providers: [
        {
          provide: ProductosService,
          useValue: mockProductosService,
        },
      ],
    }).compile();

    controller = module.get<ProductosController>(ProductosController);
    service = module.get<ProductosService>(ProductosService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should call productosService.findCercanos with the query dto", async () => {
    const query: CercanosQueryDto = {
      lat: 21.1511,
      lng: -100.9347,
      radio: 10,
      page: 1,
      limit: 20,
    };

    const result = await controller.getCercanos(query);

    expect(service.findCercanos).toHaveBeenCalledWith(query);
    expect(result).toEqual({
      data: [],
      nextCursor: null,
      total: 0,
    });
  });
});
