import { Module } from '@nestjs/common';
import { RolesPermissionesService } from './roles-permissiones.service';
import { RolesPermissionesController } from './roles-permissiones.controller';

@Module({
  controllers: [RolesPermissionesController],
  providers: [RolesPermissionesService],
})
export class RolesPermissionesModule {}
