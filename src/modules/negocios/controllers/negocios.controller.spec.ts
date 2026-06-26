import { Test, TestingModule } from "@nestjs/testing";
import { NegociosController } from "./negocios.controller";

describe("NegociosController", () => {
  let controller: NegociosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NegociosController],
    }).compile();

    controller = module.get<NegociosController>(NegociosController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
