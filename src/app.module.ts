import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { NegociosModule } from "./modules/negocios/negocios.module";
import { ProductosModule } from "./modules/productos/productos.module";
import { ReservasModule } from "./modules/reservas/reservas.module";
import { ChatModule } from "./modules/chat/chat.module";
import { NotificacionesModule } from "./modules/notificaciones/notificaciones.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { EstadisticasModule } from "./modules/estadisticas/estadisticas.module";
import { TransformInterceptor } from "./core/interceptors/transform.interceptor";
import { HttpExceptionFilter } from "./core/filters/http-exception.filter";

@Module({
  imports: [
    AuthModule,
    NegociosModule,
    ProductosModule,
    ReservasModule,
    ChatModule,
    NotificacionesModule,
    ReviewsModule,
    EstadisticasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

