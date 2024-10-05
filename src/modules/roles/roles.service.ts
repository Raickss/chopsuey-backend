import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
    constructor (
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {}
    async getPermissionsByRole(roleId: number): Promise<string[]> {
        const role = await this.roleRepository.findOne({
          where: { id: roleId },
          relations: ['rolePermissions', 'rolePermissions.permission'],
        });
    
        if (!role) {
          throw new Error(`Role with ID ${roleId} not found`);
        }
    
        return role.rolePermissions.map(rp => rp.permission.permissionName);
    }
}
