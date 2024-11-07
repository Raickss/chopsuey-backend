import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
import { RolesPermissionsModule } from 'src/modules/roles-permissions/roles-permissions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'src/mail/mail.module';
import { UserResetPasswordCode } from './entities/user-reset-password.entity';
@Module(
  {
    imports: [
      UsersModule,
      PermissionsModule,
      RolesPermissionsModule,
      MailModule,
      TypeOrmModule.forFeature(
        [
          UserResetPasswordCode
        ]
      ),
      JwtModule.register({})
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
