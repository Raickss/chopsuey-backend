import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Error interno del servidor';
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const { message: responseMessage, error, errorCode: customErrorCode } =
          response as Record<string, any>;

        if (customErrorCode) {
          console.log("El error es:",customErrorCode)
          errorCode = customErrorCode;
        }

        if (typeof responseMessage === 'string') {
          message = responseMessage;
        } else if (Array.isArray(responseMessage)) {
          message = responseMessage.join(', ');
        } else {
          message = error ?? 'Error interno del servidor';
        }
      }
    }

    const responseBody: Record<string, any> = {
      statusCode: httpStatus,
      errorType: exception.constructor.name,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message,
    };

    if (errorCode) {
      responseBody.errorCode = errorCode; // Agrega el errorCode solo si está definido
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
