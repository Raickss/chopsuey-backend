import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];

    console.log(token);
    // 1. Validar si existe el refresh token en la solicitud
    if (!token) {
      throw new UnauthorizedException({
        errorCode: 'REFRESH_TOKEN_MISSING',
        message: 'Acceso denegado.',
      });
    }

    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        errorCode: 'REFRESH_TOKEN_EXPIRED',
        message: 'Token expirado.',
      });
    }

    if (err || !user) {
      throw new UnauthorizedException({
        errorCode: 'REFRESH_TOKEN_INVALID',
        message: 'Token invalido.',
      });
    }

    return user;
  }
}
