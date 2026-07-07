import { Test, TestingModule } from "@nestjs/testing";
import { NegociosController } from "./negocios.controller";
import { NegociosService } from "../services/negocios.service";

describe("NegociosController", () => {
  let controller: NegociosController;

  const mockNegociosService = {
    crear: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NegociosController],
      providers: [
        {
          provide: NegociosService,
          useValue: mockNegociosService,
        },
      ],
    }).compile();

    controller = module.get<NegociosController>(NegociosController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
