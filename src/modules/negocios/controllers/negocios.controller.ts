import { Controller, Get, Post, Put, Delete, Param, UseGuards, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { NegociosService } from '../services/negocios.service';
import { CreateNegocioDto } from '../dtos/create-negocio.dto';
import { NegocioEntity } from '../entities/negocio.entity';

@ApiTags('Negocios')
@Controller('negocios')
export class NegociosController {
  constructor(private readonly negociosService: NegociosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener lista de todos los negocios (Público)' })
  @ApiResponse({ status: 200, type: [NegocioEntity] })
  async getNegocios(): Promise<NegocioEntity[]> {
    return this.negociosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un negocio por su ID (Público)' })
  @ApiResponse({ status: 200, type: NegocioEntity })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  async getNegocioById(@Param('id') id: string): Promise<NegocioEntity> {
    return this.negociosService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('negocio')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un nuevo negocio (Propietario del negocio)' })
  @ApiResponse({ status: 201, type: NegocioEntity })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Nombre de negocio duplicado' })
  @HttpCode(HttpStatus.CREATED)
  async crearNegocio(
    @Body() dto: CreateNegocioDto,
    @CurrentUser() user: { sub: string },
  ): Promise<NegocioEntity> {
    return this.negociosService.crear(user.sub, dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('negocio')
  async actualizarNegocio(@Param('id') id: string) {
    return { message: `PUT /negocios/${id} - negocio skeleton` };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('negocio')
  async eliminarNegocio(@Param('id') id: string) {
    return { message: `DELETE /negocios/${id} - negocio skeleton` };
  }
}
