/* eslint-disable prettier/prettier */
import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { PostgresConfigModule } from "src/config/database/postgres/config.module";
import { PostgresConfigService } from "src/config/database/postgres/config.service";

@Module({
    imports: [
      TypeOrmModule.forRootAsync({
        imports: [PostgresConfigModule],
        useFactory: async (PostgresConfigService: PostgresConfigService) => ({
          type: 'postgres',
          host: PostgresConfigService.host,
          port: PostgresConfigService.port,
          username: PostgresConfigService.username,
          password: PostgresConfigService.password,
          database: PostgresConfigService.database,
          entities: [__dirname + '/../../../../entities/*.entity{.ts,.js}'],
          synchronize: true,
        }),
        inject: [PostgresConfigService],
      } as TypeOrmModuleAsyncOptions),
    ],
  })

export class PostgresProviderModule {}
