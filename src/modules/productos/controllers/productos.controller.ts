import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductosService } from "../services/productos.service";
import { CercanosQueryDto } from "../dtos/cercanos-query.dto";
import { ProductoEntity } from "../entities/producto.entity";

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
    @Query() query: CercanosQueryDto,
  ): Promise<{
    data: ProductoEntity[];
    nextCursor: string | null;
    total: number;
  }> {
    return this.productosService.findCercanos(query);
  }
}

/*
DOCUMENTACIÓN DE PRUEBAS:

CASO 1 — Feed exitoso (HTTP 200):
GET /productos/cercanos?lat=21.1511&lng=-100.9347&radio=10
Respuesta esperada:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "Pan dulce surtido",
      "precioOferta": 35.00,
      "distanciaKm": 0.8,
      "fotoUrl": "https://r2.../imagen.jpg",
      "fechaCaducidad": "2024-01-15T20:00:00.000Z",
      "negocio": {
        "nombre": "Panadería El Sol",
        "calificacionPromedio": 4.5
      }
    }
  ],
  "nextCursor": "uuid-ultimo-producto",
  "total": 45,
  "timestamp": "..."
}

CASO 2 — Sin lat (HTTP 400):
GET /productos/cercanos?lng=-100.9347
Respuesta esperada:
{
  "success": false,
  "statusCode": 400,
  "message": [
    "lat should not be empty",
    "lat must be a number..."
  ]
}

CASO 3 — Radio fuera de rango (HTTP 400):
GET /productos/cercanos?lat=21.15&lng=-100.93&radio=100
Respuesta esperada:
{
  "success": false,
  "statusCode": 400,
  "message": ["radio must not be greater than 50"]
}
*/
