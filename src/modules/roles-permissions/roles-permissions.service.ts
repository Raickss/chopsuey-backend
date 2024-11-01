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

    async assignPermissionsToRole(data: RolePermissionDto): Promise<void> {
        const { roleId, permissionIds } = data;
    
        const queryRunner = this.rolesPermissionsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const permissionRepository = queryRunner.manager.getRepository(Permission);
            const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
    
            // Usar el servicio RolesService para buscar el rol y lanzar una excepción si no se encuentra
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

    async updatePermissionsForRole(rolePermissionDto: RolePermissionDto): Promise<void> {
        const { roleId, permissionIds } = rolePermissionDto;

        const queryRunner = this.rolesPermissionsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
            const permissionRepository = queryRunner.manager.getRepository(Permission);

            // Usar el servicio RolesService para buscar el rol y lanzar una excepción si no se encuentra
            const role = await this.rolesService.findOne(roleId);

            // Eliminar permisos actuales del rol
            const existingRolePermissions = await rolePermissionRepository.find({
                where: { role: { id: roleId } },
            });

            if (existingRolePermissions.length > 0) {
                await rolePermissionRepository.remove(existingRolePermissions);
            }

            // Asignar nuevos permisos
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

    async removePermissionsFromRole(rolePermissionDto: RolePermissionDto): Promise<void> {
        const { roleId, permissionIds } = rolePermissionDto;
    
        const queryRunner = this.rolesPermissionsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
            const permissionRepository = queryRunner.manager.getRepository(Permission);
    
            // Usar el servicio RolesService para verificar que el rol existe
            const role = await this.rolesService.findOne(roleId);
    
            // Verificar si los permisos existen en la base de datos
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
    
            // Buscar las relaciones existentes entre el rol y los permisos
            const rolePermissions = await rolePermissionRepository.find({
                where: {
                    role: { id: roleId },
                    permission: In(permissionIds),
                },
            });
    
            // Verificar si alguno de los permisos no está enlazado con el rol
            const existingPermissionIds = rolePermissions.map((rp) => rp.permission.id);
            const notLinkedPermissions = permissionIds.filter(id => !existingPermissionIds.includes(id));
    
            if (notLinkedPermissions.length > 0) {
                throw new NotFoundException(
                    `Los permisos con IDs ${notLinkedPermissions.join(', ')} no están enlazados con el rol con ID ${roleId}.`
                );
            }
    
            // Eliminar los permisos que están enlazados con el rol
            await rolePermissionRepository.remove(rolePermissions);
    
            // Confirmar la transacción
            await queryRunner.commitTransaction();
        } catch (error) {
            // Revertir la transacción en caso de error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Liberar el QueryRunner
            await queryRunner.release();
        }
    }         

    async clearPermissionsForRole(roleId: number): Promise<void> {
        const queryRunner = this.rolesPermissionsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            // Usar el servicio RolesService para buscar el rol y lanzar una excepción si no se encuentra
            const role = await this.rolesService.findOne(roleId);
    
            // Buscar todos los permisos enlazados con el rol
            const rolePermissions = await queryRunner.manager.getRepository(RolePermission).find({
                where: { role: { id: roleId } },
            });
    
            if (rolePermissions.length === 0) {
                throw new NotFoundException(`No se encontraron permisos para el rol con ID ${roleId}.`);
            }
    
            // Eliminar los permisos enlazados al rol
            await queryRunner.manager.getRepository(RolePermission).remove(rolePermissions);
    
            // Confirmar la transacción
            await queryRunner.commitTransaction();
        } catch (error) {
            // Revertir la transacción en caso de error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Liberar el QueryRunner
            await queryRunner.release();
        }
    }

}
