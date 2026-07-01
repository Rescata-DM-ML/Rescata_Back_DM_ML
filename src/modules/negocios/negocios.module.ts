import { Module } from '@nestjs/common';
import { NegociosController } from './controllers/negocios.controller';
import { NegociosService } from './services/negocios.service';
import { PrismaNegociosRepository } from './repositories/prisma-negocios.repository';
import { NEGOCIOS_REPOSITORY } from './repositories/negocios.repository.interface';

@Module({
  controllers: [NegociosController],
  providers: [
    NegociosService,
    {
      provide: NEGOCIOS_REPOSITORY,
      useClass: PrismaNegociosRepository,
    },
  ],
})
export class NegociosModule {}
