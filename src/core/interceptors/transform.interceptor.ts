import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { classToPlain } from "class-transformer";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<unknown>>
{
  /**
   * Intercepta la respuesta exitosa de la API y la envuelve en el sobre estándar,
   * aplicando classToPlain para respetar los decoradores de class-transformer.
   *
   * @param context Contexto de ejecución de NestJS
   * @param next Manejador de la llamada entrante
   * @returns Un observable que emite la respuesta formateada
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<unknown>> {
    return next.handle().pipe(
      map((data: T): ApiResponse<unknown> => {
        const transformedData =
          data === null || data === undefined
            ? null
            : classToPlain(data, { excludeExtraneousValues: false });

        return {
          success: true,
          data: transformedData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
