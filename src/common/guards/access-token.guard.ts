import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];
    if (!token) {
      throw new UnauthorizedException({
        errorCode: 'ACCESS_TOKEN_MISSING',
        message: 'Acceso denegado.',
      });
    }

    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        errorCode: 'ACCESS_TOKEN_EXPIRED',
        message: 'Token expirado.',
      });
    }

    if (err || !user) {
      throw new UnauthorizedException({
        errorCode: 'ACCESS_TOKEN_INVALID',
        message: 'Token invalido.',
      });
    }
    return user;
  }
}
