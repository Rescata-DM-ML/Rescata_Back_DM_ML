import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./core/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { NegociosModule } from "./modules/negocios/negocios.module";
import { ProductosModule } from "./modules/productos/productos.module";
import { ReservasModule } from "./modules/reservas/reservas.module";
import { ChatModule } from "./modules/chat/chat.module";
import { NotificacionesModule } from "./modules/notificaciones/notificaciones.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { EstadisticasModule } from "./modules/estadisticas/estadisticas.module";

@Module({
  imports: [
    PrismaModule,
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
  providers: [AppService],
})
export class AppModule {}
