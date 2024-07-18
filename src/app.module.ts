/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app/config.module';
import { PostgresProviderModule } from './providers/database/postgres/provider.module';

@Module({
  imports: [
    AppConfigModule,
    PostgresProviderModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
