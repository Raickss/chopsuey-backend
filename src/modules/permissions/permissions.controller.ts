import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Permission } from './permission.entity';
import { PermissionDto } from './dtos/permission.dto';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { RequiredPermissions } from 'src/common/decorators/permission.decorator';
import { Permissions } from 'src/common/guards/enums/permissions.enum';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) { }

  @Get()
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionsService.findAll();
  }

  @Get(':permissionId')
  async getPermissionById(
    @Param('permissionId', ParseIntPipe) permissionId: number
  ): Promise<Permission> {
    return this.permissionsService.findOne(permissionId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPermission(
    @Body() data: PermissionDto | PermissionDto[]
  ): Promise<Permission | Permission[]> {
    return this.permissionsService.create(data);
  }

  @Put(':permissionId')
  @HttpCode(HttpStatus.OK)
  async updatePermission(
    @Param('permissionId', ParseIntPipe) permissionId: number,
    @Body() data: PermissionDto
  ): Promise<void> {
    return this.permissionsService.update(permissionId, data);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async deletePermissions(
    @Body('permissionIds') permissionIds: number | number[]
  ): Promise<void> {
    return this.permissionsService.remove(permissionIds);
  }
}
