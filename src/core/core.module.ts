import { Module } from '@nestjs/common';
import { MAPA_ADAPTER } from './adapters/mapa.adapter.interface';
import { NominatimAdapter } from './adapters/nominatim.adapter';

@Module({
  providers: [
    {
      provide: MAPA_ADAPTER,
      useClass: NominatimAdapter,
    },
  ],
  exports: [MAPA_ADAPTER],
})
export class CoreModule {}
