import { Module } from "@nestjs/common";
import { NegociosController } from "./controllers/negocios.controller";
import { NegociosService } from "./services/negocios.service";

@Module({
  controllers: [NegociosController],
  providers: [NegociosService],
})
export class NegociosModule {}
