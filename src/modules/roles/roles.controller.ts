import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './role.entity';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { RequiredPermissions } from 'src/common/decorators/permission.decorator';
import { Permissions } from 'src/common/guards/enums/permissions.enum';

@Controller('roles')
@UseGuards(AccessTokenGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequiredPermissions(Permissions.role.fetchAllRoles)
  async findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }
  
  @Get(':id')
  @RequiredPermissions(Permissions.role.findRoleById)
  async findOne(@Param('id') id: number): Promise<Role> {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequiredPermissions(Permissions.role.createRole)
  async create(@Body() data: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(data);
  }

  @Put(':id')
  @RequiredPermissions(Permissions.role.updateRole)
  async update(
    @Param('id') id: number,
    @Body() data: UpdateRoleDto 
  ): Promise<void> {
    return this.rolesService.update(id, data);
  }

  @Delete(':id')
  @RequiredPermissions(Permissions.role.removeRole)
  async remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(+id);
  }
}
