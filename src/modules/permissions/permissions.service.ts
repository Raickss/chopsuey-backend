import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/role.entity';

@Injectable()
export class PermissionsService {
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
