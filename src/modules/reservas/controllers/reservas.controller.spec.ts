import { Test, TestingModule } from "@nestjs/testing";
import { ReservasController } from "./reservas.controller";
import { ReservasService, JwtPayload } from "../services/reservas.service";
import { CreateReservaDto } from "../dtos/create-reserva.dto";
import { ReservaEntity } from "../entities/reserva.entity";

describe("ReservasController", () => {
  let controller: ReservasController;
  let service: ReservasService;

  const mockReservasService = {
    crearReserva: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservasController],
      providers: [
        { provide: ReservasService, useValue: mockReservasService },
      ],
    }).compile();

    controller = module.get<ReservasController>(ReservasController);
    service = module.get<ReservasService>(ReservasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("crearReserva", () => {
    it("should call ReservasService.crearReserva with dto and user information", async () => {
      const dto: CreateReservaDto = {
        productoId: "prod-1",
      };
      const user: JwtPayload = {
        sub: "usr-1",
        email: "test@example.com",
        rol: "consumidor",
        negocioId: "neg-1",
      };
      const mockReserva = new ReservaEntity({ id: "res-1" });
      mockReservasService.crearReserva.mockResolvedValue(mockReserva);

      const result = await controller.crearReserva(dto, user);

      expect(service.crearReserva).toHaveBeenCalledWith("prod-1", user);
      expect(result).toBe(mockReserva);
    });
  });
});
