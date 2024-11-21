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
        entities: [__dirname + '/../../../../**/*.entity.{ts,js}'], // Soporta tanto .ts como .js
        synchronize: false, // Desactivado para producción
        migrations: [__dirname + '/../../../../migrations/*.{ts,js}'], // Opcional: usa migraciones
        migrationsRun: true, // Ejecuta migraciones automáticamente al iniciar
      }),
      inject: [PostgresConfigService],
    } as TypeOrmModuleAsyncOptions),
  ],
})

export class PostgresProviderModule { } 
