import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { RolesPermissionsService } from './roles-permissions.service';
import { RolePermission } from './role-permission.entity';
import { RolePermissionDto } from './dtos/role-permission.dto';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { RequiredPermissions } from 'src/common/decorators/permission.decorator';
import { Permissions } from 'src/common/guards/enums/permissions.enum';

@Controller('roles-permissions')
@UseGuards(AccessTokenGuard)
export class RolesPermissionsController {
  constructor(private readonly rolesPermissionsService: RolesPermissionsService) { }

  @Get()
  @RequiredPermissions(Permissions.rolePermission.viewAllRolesPermissions)
  async findAll(): Promise<RolePermission[]> {
    return this.rolesPermissionsService.findAll();
  }

  @Get(':roleId')
  @RequiredPermissions(Permissions.rolePermission.viewPermissionsByRole)
  async getPermissionsByRole(@Param('roleId') roleId: number): Promise<string[]> {
    return await this.rolesPermissionsService.getPermissionsByRole(roleId);
  }

  @Post()
  @RequiredPermissions(Permissions.rolePermission.assignPermissionsToRole)
  async assignPermissionsToRole(@Body() data: RolePermissionDto): Promise<void> {
    await this.rolesPermissionsService.assignPermissionsToRole(data);
  }

  @Put()
  @RequiredPermissions(Permissions.rolePermission.updatePermissionsForRole)
  async updatePermissionsForRole(@Body() rolePermissionDto: RolePermissionDto): Promise<void> {
    await this.rolesPermissionsService.updatePermissionsForRole(rolePermissionDto);
  }

  @Delete()
  @RequiredPermissions(Permissions.rolePermission.removePermissionsFromRole)
  async removeSpecificPermissionsFromRole(@Body() rolePermissionDto: RolePermissionDto): Promise<void> {
    await this.rolesPermissionsService.removeSpecificPermissionsFromRole(rolePermissionDto);
  }

  @Delete(':roleId/clear')
  @RequiredPermissions(Permissions.rolePermission.clearPermissionsForRole)
  async removeAllPermissionsFromRole(@Param('roleId') roleId: number): Promise<void> {
    await this.rolesPermissionsService.removeAllPermissionsFromRole(roleId);
  }
}
