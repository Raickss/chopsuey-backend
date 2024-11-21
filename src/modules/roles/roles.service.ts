import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) { }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
  }  

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado.`);
    }

    return role;
  }
  async findByRoleName(roleName: string): Promise<Role | null> {
    return await this.rolesRepository.findOne({
        where: { roleName },
        relations: ['rolePermissions', 'rolePermissions.permission'], // Incluir relaciones necesarias
    });
}


  async create(data: CreateRoleDto): Promise<Role> {
    const newRole = this.rolesRepository.create(data);
    return await this.rolesRepository.save(newRole);
  }

  async update(id: number, data: UpdateRoleDto): Promise<void> {
    const result = await this.rolesRepository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado.`);
    }
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.rolesRepository.remove(role);
  }

}
