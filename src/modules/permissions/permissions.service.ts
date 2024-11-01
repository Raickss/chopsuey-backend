import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/role.entity';
import { Permission } from './permission.entity';
import { PermissionDto } from '../dtos/permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>
  ) { }

  async findAll(): Promise<Permission[]> {
    return await this.permissionsRepository.find();
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({ where: { id } });
    if (!permission) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado.`);
    }
    return permission;
  }

  async create(data: PermissionDto): Promise<Permission> {
    const newPermission = this.permissionsRepository.create(data);
    return await this.permissionsRepository.save(newPermission);
  }

  async update(id: number, data: PermissionDto): Promise<void> {
    const result = await this.permissionsRepository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado.`);
    }
  }

  async remove(id: number): Promise<void> {
    const deleteResult = await this.permissionsRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado.`);
    }
  }
  
}
