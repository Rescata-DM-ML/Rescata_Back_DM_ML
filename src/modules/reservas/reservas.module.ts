import { Module } from "@nestjs/common";
import { ReservasController } from "./controllers/reservas.controller";
import { ReservasService } from "./services/reservas.service";

@Module({
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
