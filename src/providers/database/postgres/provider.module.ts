import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { UserResetPasswordCode } from "src/auth/entities/user-reset-password.entity";
import { PostgresConfigModule } from "src/config/database/postgres/config.module";
import { PostgresConfigService } from "src/config/database/postgres/config.service";
import { Permission } from "src/modules/permissions/permission.entity";
import { RolePermission } from "src/modules/roles-permissions/role-permission.entity";
import { Role } from "src/modules/roles/role.entity";
import { User } from "src/modules/users/user.entity";

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
        // entities: [__dirname + '/../../../../**/*.entity.{ts,js}'],
        // entities: [__dirname + '../../modules/**/*.entity.js'],
        entities: [User, Role, RolePermission, Permission, UserResetPasswordCode],
        synchronize: false,
        migrationsRun: true,

      }),
      inject: [PostgresConfigService],
    } as TypeOrmModuleAsyncOptions),
  ],
})

export class PostgresProviderModule { } 
