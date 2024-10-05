import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
@Module(
  {
    imports: [
      UsersModule,
      PermissionsModule,
      JwtModule.register(
        {
          secret: process.env.JWT_SECRET || 'secretKey',
          signOptions: { expiresIn: '60m' },
        }
      )
    ],
    controllers: [AuthController],
    providers: [AuthService],
  }
)
export class AuthModule { }
