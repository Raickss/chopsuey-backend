import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { HttpAdapterHost } from '@nestjs/core';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let errorCode = null;

    if (exception.driverError) {
      errorCode = (exception.driverError as any).code;

      switch (errorCode) {
        // Violación de restricciones únicas
        case '23505':
          httpStatus = HttpStatus.CONFLICT;
          const detail = (exception.driverError as any).detail;
          const fieldMatch = detail.match(/\((.*?)\)=\((.*?)\)/);

          if (fieldMatch && fieldMatch.length === 3) {
            const field = fieldMatch[1];
            const value = fieldMatch[2];
            message = `El valor '${value}' para el campo '${field}' ya está en uso.`;
          } else {
            message = 'El recurso ya existe.';
          }
          break;

        // Violación de restricciones de longitud de datos
        case '22001':
          httpStatus = HttpStatus.BAD_REQUEST;
          message = 'El valor ingresado es demasiado largo para un campo.';
          break;

        // Clave externa violada
        case '23503':
          httpStatus = HttpStatus.BAD_REQUEST;
          message = 'Violación de clave externa, el registro relacionado no existe.';
          break;

        // Otros errores personalizados pueden agregarse aquí
        default:
          message = exception.driverError.message || exception.message;
          break;
      }
    } else {
      // Si no existe un driverError, usamos el mensaje de la excepción base
      message = exception.message;
    }

    const responseBody = {
      statusCode: httpStatus,
      errorType: exception.constructor.name,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
