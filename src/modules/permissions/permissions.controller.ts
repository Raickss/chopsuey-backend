import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Permission } from './permission.entity';
import { PermissionDto } from '../dtos/permission.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Permission> {
    return this.permissionsService.findOne(id);
  }

  @Post()
  async create(@Body() data: PermissionDto) {
    return this.permissionsService.create(data);
  }

  @Put(':id')
  @HttpCode(200)
  async update(
    @Param('id') id: number,
    @Body() data: PermissionDto
  ): Promise<void>{
    return this.permissionsService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: number): Promise<void> {
    return this.permissionsService.remove(id);
  }

}
