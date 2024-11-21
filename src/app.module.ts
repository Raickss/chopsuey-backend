import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app/config.module';
import { PostgresProviderModule } from './providers/database/postgres/provider.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { RolesPermissionsModule } from './modules/roles-permissions/roles-permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { CacheConfigModule } from './config/caching/config.module';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    PostgresProviderModule,
    UsersModule,
    MailModule,
    RolesPermissionsModule,
    RolesModule,
    CacheConfigModule
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],
})
export class AppModule {}
