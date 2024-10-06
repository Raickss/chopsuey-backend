import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
<<<<<<< HEAD
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
=======
>>>>>>> f23a56b1357c66889ca06a33ca880625bb55cfd9
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
@Module(
  {
    imports: [
      UsersModule,
      PermissionsModule,
<<<<<<< HEAD
      JwtModule.register({})
=======
      JwtModule.register(
        {
          secret: process.env.JWT_SECRET || 'secretKey',
          signOptions: { expiresIn: '60m' },
        }
      )
>>>>>>> f23a56b1357c66889ca06a33ca880625bb55cfd9
    ],
    controllers: [AuthController],
    providers: [
      AuthService,
      AccessTokenStrategy,
      RefreshTokenStrategy
    ],
  }
)
export class AuthModule { }
