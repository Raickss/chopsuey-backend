import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { RolesPermissionsService } from './roles-permissions.service';
import { RolePermission } from './role-permission.entity';
import { RolePermissionDto } from './dtos/role-permission.dto';

@Controller('roles-permissions')
export class RolesPermissionsController {
  constructor(private readonly rolesPermissionsService: RolesPermissionsService) { }

  @Get()
  async findAll(): Promise<RolePermission[]> {
    return this.rolesPermissionsService.findAll();
  }

  @Get(':roleId/permissions')
  async getPermissionsByRole(@Param('roleId') roleId: number): Promise<string[]> {
    return await this.rolesPermissionsService.getPermissionsByRole(roleId);
  }

  @Post()
  async assignPermissionsToRole(@Body() data: RolePermissionDto): Promise<void> {
    await this.rolesPermissionsService.assignPermissionsToRole(data);
  }

  @Put('permissions')
  async updatePermissionsForRole(
    @Body() rolePermissionDto: RolePermissionDto,
  ): Promise<void> {
    await this.rolesPermissionsService.updatePermissionsForRole(rolePermissionDto);
  }

  @Delete('permissions')
  async removePermissionsFromRole(
    @Body() rolePermissionDto: RolePermissionDto,
  ): Promise<void> {
    await this.rolesPermissionsService.removePermissionsFromRole(rolePermissionDto);
  }

  @Delete(':roleId/permissions/clear')
  async clearPermissionsForRole(@Param('roleId') roleId: number): Promise<void> {
    await this.rolesPermissionsService.clearPermissionsForRole(roleId);
  }
}
