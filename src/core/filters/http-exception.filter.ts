import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { STATUS_CODES } from "http";

export interface ErrorResponse {
  success: boolean;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  private readonly logger: Logger = new Logger(HttpExceptionFilter.name);

  /**
   * Captura excepciones del tipo HttpException y las formatea en una respuesta JSON estandarizada,
   * además de registrar los detalles principales en la consola del servidor.
   *
   * @param exception Excepción HTTP capturada
   * @param host Objeto de host de argumentos de NestJS
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();
    const status: number = exception.getStatus();

    const exceptionResponse: string | object = exception.getResponse();

    let error: string = STATUS_CODES[status] || exception.name;
    let message: string | string[] = exception.message;

    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const resObj = exceptionResponse as Record<string, unknown>;
      if (typeof resObj.error === "string") {
        error = resObj.error;
      }
      if (typeof resObj.message === "string" || Array.isArray(resObj.message)) {
        message = resObj.message as string | string[];
      }
    }

    const errorPayload: ErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Loguear en consola: método HTTP, path, statusCode y el mensaje.
    // NUNCA loguear el body ni headers de autorización.
    const formattedMessage: string = Array.isArray(message)
      ? message.join(", ")
      : message;
    const logMessage = `[${request.method}] ${request.url} - Status: ${status} - Message: ${formattedMessage}`;
    this.logger.error(logMessage);

    response.status(status).json(errorPayload);
  }
}
