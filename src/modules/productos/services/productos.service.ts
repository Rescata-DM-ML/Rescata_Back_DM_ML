/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PRODUCTOS_REPOSITORY } from "../repositories/productos.repository.interface";
import type { IProductosRepository } from "../repositories/productos.repository.interface";
import { CercanosQueryDto } from "../dtos/cercanos-query.dto";
import { ProductoEntity } from "../entities/producto.entity";
import { CreateProductoDto } from "../dtos/create-producto.dto";
import { RedisService } from "../../../redis/redis.service";
import { ALMACENAMIENTO_ADAPTER } from "../../../core/adapters/almacenamiento.adapter.interface";
import type { IAlmacenamientoAdapter } from "../../../core/adapters/almacenamiento.adapter.interface";
import { randomUUID } from "crypto";

@Injectable()
export class ProductosService {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY)
    private readonly repository: IProductosRepository,
    private readonly redisService: RedisService,
    @Inject(ALMACENAMIENTO_ADAPTER)
    private readonly almacenamientoAdapter: IAlmacenamientoAdapter
  ) {}

  async crear(negocioId: string, dto: CreateProductoDto): Promise<ProductoEntity> {
    if (dto.precioOferta >= dto.precioOriginal) {
      throw new BadRequestException({
        error: "precio_invalido",
        message: "El precio de oferta debe ser menor al precio original",
      });
    }

    const producto = await this.repository.crear({
      ...dto,
      descripcion: dto.descripcion || "",
      negocioId,
    });

    try {
      await this.redisService.publish("producto.publicado", {
        productoId: producto.id,
        negocioId: producto.negocioId,
        cantidadDisponible: producto.cantidadDisponible,
        fechaCaducidad: producto.fechaCaducidad,
      });
    } catch (error) {
      console.error("Error al publicar en Redis:", error);
    }

    return producto;
  }

  async subirImagenes(
    productoId: string,
    negocioId: string,
    files: Express.Multer.File[]
  ): Promise<{ message: string; total: number }> {
    const producto = await this.repository.findById(productoId);
    if (!producto) {
      throw new NotFoundException({
        error: "producto_no_encontrado",
        message: "El producto no existe",
      });
    }

    if (producto.negocioId !== negocioId) {
      throw new ForbiddenException({ error: "acceso_denegado" });
    }

    const contarActuales = await this.repository.contarImagenes(productoId);
    if (contarActuales >= 3) {
      throw new BadRequestException({ error: "limite_imagenes_alcanzado" });
    }

    if (contarActuales + files.length > 3) {
      throw new BadRequestException({ error: "limite_imagenes_alcanzado" });
    }

    const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!validMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException({ error: "formato_invalido" });
      }
      if (file.size > maxSizeBytes) {
        throw new BadRequestException({
          error: "archivo_demasiado_grande",
          maxBytes: maxSizeBytes,
        });
      }
    }

    for (const file of files) {
      const extension = file.originalname.split(".").pop() || "jpg";
      const nombreUuid = randomUUID();
      const nombreUnico = `${nombreUuid}.${extension}`;

      const urlPublica = await this.almacenamientoAdapter.subir(file, nombreUnico);

      await this.repository.agregarImagen(
        productoId,
        urlPublica,
        nombreUuid,
        file.mimetype,
        file.size
      );
    }

    return {
      message: "Imágenes subidas correctamente",
      total: contarActuales + files.length,
    };
  }

  async findAll(): Promise<ProductoEntity[]> {
    return this.repository.findAll();
  }

  async findById(id: string, negocioId?: string): Promise<ProductoEntity> {
    const producto = await this.repository.findById(id);
    if (!producto) {
      throw new NotFoundException({
        error: "producto_no_encontrado",
        message: `El producto con ID ${id} no existe`,
      });
    }
    if (negocioId && producto.negocioId !== negocioId) {
      throw new ForbiddenException({
        error: "acceso_denegado",
      });
    }
    return producto;
  }

  async actualizar(id: string, negocioId: string, dto: any): Promise<ProductoEntity> {
    const producto = await this.repository.findById(id);
    if (!producto) {
      throw new NotFoundException({
        error: "producto_no_encontrado",
      });
    }
    if (producto.negocioId !== negocioId) {
      throw new ForbiddenException({
        error: "acceso_denegado",
      });
    }
    return this.repository.actualizar(id, dto);
  }

  async eliminar(id: string, negocioId: string): Promise<void> {
    const producto = await this.repository.findById(id);
    if (!producto) {
      throw new NotFoundException({
        error: "producto_no_encontrado",
      });
    }
    if (producto.negocioId !== negocioId) {
      throw new ForbiddenException({
        error: "acceso_denegado",
      });
    }
    await this.repository.eliminar(id);
  }

  async buscar(filtro: string): Promise<ProductoEntity[]> {
    return this.repository.buscar(filtro);
  }

  async findCercanos(query: CercanosQueryDto): Promise<{
    data: ProductoEntity[];
    nextCursor: string | null;
    total: number;
  }> {
    const resultado = await this.repository.findCercanos({
      lat: query.lat,
      lng: query.lng,
      radio: query.radio ?? 10,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });

    const data = resultado.data.map(
      (item) =>
        new ProductoEntity({
          id: item.id,
          nombre: item.nombre,
          precioOriginal: item.precioOriginal,
          precioOferta: item.precioOferta,
          fechaCaducidad: item.fechaCaducidad,
          distanciaKm: item.distanciaKm,
          fotoUrl: item.fotoUrl,
          negocio: {
            nombre: item.negocioNombre,
            calificacionPromedio: item.calificacionPromedio,
          },
        })
    );

    return {
      data,
      nextCursor: resultado.nextCursor,
      total: resultado.total,
    };
  }

  async findByNegocio(negocioId: string): Promise<ProductoEntity[]> {
    return this.repository.findByNegocio(negocioId);
  }
}
