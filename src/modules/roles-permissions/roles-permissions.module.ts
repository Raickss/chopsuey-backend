import { Module } from '@nestjs/common';
import { RolesPermissionsService } from './roles-permissions.service';
import { RolesPermissionsController } from './roles-permissions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from './role-permission.entity';
import { Role } from '../roles/role.entity';
import { Permission } from '../permissions/permission.entity';
import { RolesModule } from '../roles/roles.module';


@Module({
  imports: [
    RolesModule,
    TypeOrmModule.forFeature(
      [
        RolePermission,
        Role,
        Permission
      ]
    )
  ],
  controllers: [RolesPermissionsController],
  providers: [RolesPermissionsService],
  exports: [RolesPermissionsService]
})
export class RolesPermissionsModule {}
