import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ReservasController } from "./controllers/reservas.controller";
import { ReservasService } from "./services/reservas.service";
import { CrearReservaUseCase } from "./use-cases/crear-reserva.use-case";
import { RESERVAS_REPOSITORY } from "./repositories/reservas.repository.interface";
import { PrismaReservasRepository } from "./repositories/prisma-reservas.repository";

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ReservasController],
  providers: [
    ReservasService,
    CrearReservaUseCase,
    {
      provide: RESERVAS_REPOSITORY,
      useClass: PrismaReservasRepository,
    },
  ],
  exports: [ReservasService],
})
export class ReservasModule {}
