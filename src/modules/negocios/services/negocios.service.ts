import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateNegocioDto } from '../dtos/create-negocio.dto';
import { NegocioEntity } from '../entities/negocio.entity';
import { NEGOCIOS_REPOSITORY } from '../repositories/negocios.repository.interface';
import type { INegociosRepository } from '../repositories/negocios.repository.interface';
import { MAPA_ADAPTER } from '../../../core/adapters/mapa.adapter.interface';
import type { IMapaAdapter } from '../../../core/adapters/mapa.adapter.interface';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class NegociosService {
  constructor(
    @Inject(NEGOCIOS_REPOSITORY)
    private readonly negociosRepository: INegociosRepository,
    @Inject(MAPA_ADAPTER)
    private readonly mapaAdapter: IMapaAdapter,
    private readonly redisService: RedisService,
  ) {}

  async crear(userId: string, dto: CreateNegocioDto): Promise<NegocioEntity> {
    // 1. Validar unicidad del nombre de negocio por usuario
    const existe = await this.negociosRepository.existePorUsuarioYNombre(userId, dto.nombre);
    if (existe) {
      throw new ConflictException({
        error: 'nombre_duplicado',
        message: 'Ya tienes un negocio con ese nombre',
      });
    }

    // 2. Obtener coordenadas mediante la API de Mapas
    const coordenadas = await this.mapaAdapter.geocodificar(dto.direccion);

    // 3. Crear negocio en la base de datos
    const negocio = await this.negociosRepository.crear({
      nombre: dto.nombre,
      direccion: dto.direccion,
      categoria: dto.categoria,
      latitud: coordenadas.lat,
      longitud: coordenadas.lng,
      usuarioId: userId,
    });

    // 4. Emitir evento a Redis canal negocio.creado (Graceful Failure)
    try {
      await this.redisService.publish('negocio.creado', {
        negocioId: negocio.id,
        userId,
        nombre: negocio.nombre,
        categoria: negocio.categoria,
      });
    } catch (error) {
      console.error('Error publicando evento en Redis (negocio.creado):', error);
    }

    return negocio;
  }

  async findAll(): Promise<NegocioEntity[]> {
    return this.negociosRepository.findAll();
  }

  async findById(id: string): Promise<NegocioEntity> {
    const negocio = await this.negociosRepository.findById(id);
    if (!negocio) {
      throw new NotFoundException({
        error: 'negocio_no_encontrado',
        message: 'El negocio no existe',
      });
    }
    return negocio;
  }
}
