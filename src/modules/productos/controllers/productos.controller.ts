/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  UseGuards,
  Body,
  UploadedFiles,
  UseInterceptors,
  HttpCode,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductosService } from "../services/productos.service";
import { CercanosQueryDto } from "../dtos/cercanos-query.dto";
import { ProductoEntity } from "../entities/producto.entity";
import { CreateProductoDto } from "../dtos/create-producto.dto";
import { AuthGuard } from "../../../core/guards/auth.guard";
import { RolesGuard } from "../../../core/guards/roles.guard";
import { Roles } from "../../../core/decorators/roles.decorator.decorator";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { FilesInterceptor } from "@nestjs/platform-express";

interface JwtPayload {
  sub: string;
  email: string;
  rol: "consumidor" | "negocio";
  negocioId?: string;
}

@ApiTags("Productos")
@Controller("productos")
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get("cercanos")
  @ApiOperation({
    summary: "Feed de productos cercanos al usuario",
    description:
      "Devuelve productos disponibles ordenados por distancia usando fórmula Haversine. No requiere autenticación. Paginación cursor-based.",
  })
  @ApiQuery({ name: "lat", required: true, type: Number, example: 21.1511 })
  @ApiQuery({ name: "lng", required: true, type: Number, example: -100.9347 })
  @ApiQuery({ name: "radio", required: false, type: Number, example: 10 })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: "Lista paginada de productos cercanos",
  })
  @ApiResponse({
    status: 400,
    description: "lat o lng inválidos o faltantes",
  })
  async getCercanos(
    @Query() query: CercanosQueryDto
  ): Promise<{
    data: ProductoEntity[];
    nextCursor: string | null;
    total: number;
  }> {
    return this.productosService.findCercanos(query);
  }

  @Get()
  @ApiOperation({ summary: "Obtener todos los productos u obtener por negocio (público)" })
  @ApiResponse({ status: 200, type: [ProductoEntity] })
  async getProductos(
    @Query("negocioId") negocioId?: string
  ): Promise<ProductoEntity[]> {
    if (negocioId) {
      return this.productosService.findByNegocio(negocioId);
    }
    return this.productosService.findAll();
  }

  @Get("buscar")
  async buscar(@Query("q") q: string) {
    if (!q || q.trim().length < 2) {
      throw new BadRequestException({ error: "query_muy_corta" });
    }
    return this.productosService.buscar(q.trim());
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Obtener un producto por ID (protegido)" })
  @ApiResponse({ status: 200, type: ProductoEntity })
  @ApiResponse({ status: 404, description: "Producto no encontrado" })
  @ApiResponse({ status: 403, description: "Acceso denegado" })
  async getProductoById(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<ProductoEntity> {
    const negocioId = user.rol === "negocio" ? user.negocioId : undefined;
    return this.productosService.findById(id, negocioId);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("negocio")
  @HttpCode(201)
  @ApiOperation({ summary: "Crear un producto (negocio)" })
  @ApiResponse({ status: 201, type: ProductoEntity })
  @ApiResponse({ status: 403, description: "Acceso denegado o rol incorrecto" })
  async crearProducto(
    @Body() dto: CreateProductoDto,
    @CurrentUser() user: JwtPayload
  ): Promise<ProductoEntity> {
    if (!user.negocioId) {
      throw new ForbiddenException({
        error: "acceso_denegado",
        message: "El usuario no tiene un negocio registrado",
      });
    }
    return this.productosService.crear(user.negocioId, dto);
  }

  @Post(":id/images")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("negocio")
  @HttpCode(200)
  @UseInterceptors(FilesInterceptor("images", 3))
  @ApiOperation({ summary: "Subir imágenes de un producto (negocio)" })
  @ApiResponse({ status: 200, description: "Imágenes subidas correctamente" })
  @ApiResponse({ status: 400, description: "Formato inválido o límite de imágenes excedido" })
  @ApiResponse({ status: 403, description: "Acceso denegado" })
  async subirImagenes(
    @Param("id") id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtPayload
  ): Promise<{ message: string; total: number }> {
    if (!user.negocioId) {
      throw new ForbiddenException({
        error: "acceso_denegado",
        message: "El usuario no tiene un negocio registrado",
      });
    }
    return this.productosService.subirImagenes(id, user.negocioId, files);
  }

  @Put(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("negocio")
  async actualizarProducto(
    @Param("id") id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload
  ) {
    if (!user.negocioId) {
      throw new ForbiddenException({
        error: "acceso_denegado",
        message: "El usuario no tiene un negocio registrado",
      });
    }
    return this.productosService.actualizar(id, user.negocioId, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("negocio")
  async eliminarProducto(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload
  ) {
    if (!user.negocioId) {
      throw new ForbiddenException({
        error: "acceso_denegado",
        message: "El usuario no tiene un negocio registrado",
      });
    }
    await this.productosService.eliminar(id, user.negocioId);
    return { success: true };
  }
}
