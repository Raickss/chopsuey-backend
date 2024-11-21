import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermission } from './role-permission.entity';
import { In, Repository } from 'typeorm';
import { Role } from '../roles/role.entity';
import { Permission } from '../permissions/permission.entity';
import { RolePermissionDto } from './dtos/role-permission.dto';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class RolesPermissionsService {
    constructor(
        @InjectRepository(RolePermission)
        private readonly rolesPermissionsRepository: Repository<RolePermission>,
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,
        @InjectRepository(Permission)
        private readonly permissionsRepository: Repository<Permission>,

        private readonly rolesService: RolesService
    ) { }

    async findAll(): Promise<RolePermission[]> {
        return await this.rolesPermissionsRepository.find({
            relations: ['role', 'permission'],
        });
    }  

    async getPermissionsByRole(roleId: number): Promise<string[]> {
        const role = await this.rolesRepository.findOne({
            where: { id: roleId },
            relations: ['rolePermissions', 'rolePermissions.permission'],
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        return role.rolePermissions.map(rp => rp.permission.permissionName);
    }

    async assignPermissionsToRole(data: RolePermissionDto): Promise<void> {
        const { roleId, permissionIds } = data;
    
        const queryRunner = this.rolesPermissionsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const permissionRepository = queryRunner.manager.getRepository(Permission);
            const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
    
            const role = await this.rolesService.findOne(roleId);
    
            const permissions = await permissionRepository.find({
                where: { id: In(permissionIds) },
            });
    
            if (permissions.length !== permissionIds.length) {
                const foundIds = permissions.map((perm) => perm.id);
                const notFoundIds = permissionIds.filter((id) => !foundIds.includes(id));
                throw new NotFoundException(
                    `Los permisos con IDs ${notFoundIds.join(', ')} no fueron encontrados.`
                );
            }
    
            const existingRolePermissions = await rolePermissionRepository.find({
                where: {
                    role: { id: roleId },
                    permission: In(permissionIds),
                },
                relations: ['permission'],
            });
    
            const existingPermissionIds = existingRolePermissions.map(
                (rp) => rp.permission.id,
            );
    
            const newPermissions = permissions.filter(
                (perm) => !existingPermissionIds.includes(perm.id),
            );
    
            if (newPermissions.length === 0) {
                throw new BadRequestException(
                    'Todos los permisos ya están asignados al rol.',
                );
            }
    
            const rolePermissions = newPermissions.map((permission) => {
                const rolePermission = new RolePermission();
                rolePermission.role = role;
                rolePermission.permission = permission;
                return rolePermission;
            });
    
            await rolePermissionRepository.save(rolePermissions);
    
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }  

    async updatePermissionsForRole(rolePermissionDto: RolePermissionDto): Promise<void> {
        const { roleId, permissionIds } = rolePermissionDto;

        const queryRunner = this.rolesPermissionsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
            const permissionRepository = queryRunner.manager.getRepository(Permission);

            const role = await this.rolesService.findOne(roleId);

            const existingRolePermissions = await rolePermissionRepository.find({
                where: { role: { id: roleId } },
            });

            if (existingRolePermissions.length > 0) {
                await rolePermissionRepository.remove(existingRolePermissions);
            }

            const permissions = await permissionRepository.find({
                where: { id: In(permissionIds) },
            });

            if (permissions.length !== permissionIds.length) {
                const foundIds = permissions.map((perm) => perm.id);
                const notFoundIds = permissionIds.filter((id) => !foundIds.includes(id));
                throw new NotFoundException(
                    `Los permisos con IDs ${notFoundIds.join(', ')} no fueron encontrados.`
                );
            }

            const rolePermissions = permissions.map(permission => {
                const rolePermission = new RolePermission();
                rolePermission.role = role;
                rolePermission.permission = permission;
                return rolePermission;
            });

            await rolePermissionRepository.save(rolePermissions);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async removeSpecificPermissionsFromRole(rolePermissionDto: RolePermissionDto): Promise<void> {
        const { roleId, permissionIds } = rolePermissionDto;
    
        const queryRunner = this.rolesPermissionsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
            const permissionRepository = queryRunner.manager.getRepository(Permission);
    
            const role = await this.rolesService.findOne(roleId);
            if (!role) {
                throw new NotFoundException(`Role con ID ${roleId} no encontrado.`);
            }
    
            const permissions = await permissionRepository.find({
                where: { id: In(permissionIds) },
            });
    
            if (permissions.length !== permissionIds.length) {
                const foundIds = permissions.map((perm) => perm.id);
                const notFoundIds = permissionIds.filter((id) => !foundIds.includes(id));
                throw new NotFoundException(
                    `Los permisos con IDs ${notFoundIds.join(', ')} no existen en el sistema.`
                );
            }
    
            const rolePermissions = await rolePermissionRepository.createQueryBuilder('rolePermission')
                .leftJoinAndSelect('rolePermission.permission', 'permission')
                .where('rolePermission.roleId = :roleId', { roleId })
                .andWhere('permission.id IN (:...permissionIds)', { permissionIds })
                .getMany();
    
            if (!rolePermissions || rolePermissions.length === 0) {
                throw new NotFoundException(
                    `No se encontraron relaciones entre el rol con ID ${roleId} y los permisos especificados.`
                );
            }
    
            const existingPermissionIds = rolePermissions.map((rp) => rp.permission.id);
            const notLinkedPermissions = permissionIds.filter(id => !existingPermissionIds.includes(id));
    
            if (notLinkedPermissions.length > 0) {
                throw new NotFoundException(
                    `Los permisos con IDs ${notLinkedPermissions.join(', ')} no están enlazados con el rol con ID ${roleId}.`
                );
            }
    
            await rolePermissionRepository.remove(rolePermissions);
    
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }             

    async removeAllPermissionsFromRole(roleId: number): Promise<void> {
        const queryRunner = this.rolesPermissionsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const role = await this.rolesService.findOne(roleId);
    
            const rolePermissions = await queryRunner.manager.getRepository(RolePermission).find({
                where: { role: { id: roleId } },
            });
    
            if (rolePermissions.length === 0) {
                throw new NotFoundException(`No se encontraron permisos para el rol con ID ${roleId}.`);
            }
    
            await queryRunner.manager.getRepository(RolePermission).remove(rolePermissions);
    
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
