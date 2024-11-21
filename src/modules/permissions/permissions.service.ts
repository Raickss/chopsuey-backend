import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/role.entity';
import { Permission } from './permission.entity';
import { PermissionDto } from './dtos/permission.dto';

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

  async create(data: PermissionDto | PermissionDto[]): Promise<Permission | Permission[]> {
    const queryRunner = this.permissionsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (Array.isArray(data)) {
        const newPermissions = [];

        for (const permissionData of data) {
          const exists = await queryRunner.manager.findOne(Permission, {
            where: { permissionName: permissionData.permissionName },
          });

          if (exists) {
            throw new ConflictException(`El permiso con el nombre ${permissionData.permissionName} ya existe`);
          }

          const newPermission = this.permissionsRepository.create(permissionData);
          const savedPermission = await queryRunner.manager.save(newPermission);
          newPermissions.push(savedPermission);
        }

        await queryRunner.commitTransaction();
        return newPermissions;
      } else {
        const exists = await queryRunner.manager.findOne(Permission, {
          where: { permissionName: data.permissionName },
        });

        if (exists) {
          throw new ConflictException(`El permiso con el nombre ${data.permissionName} ya existe`);
        }

        const newPermission = this.permissionsRepository.create(data);
        const savedPermission = await queryRunner.manager.save(newPermission);

        await queryRunner.commitTransaction();
        return savedPermission;
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear los permisos');
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, data: PermissionDto): Promise<void> {
    const result = await this.permissionsRepository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado.`);
    }
  }

  async remove(id: number | number[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id];
    const queryRunner = this.permissionsRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const deleteResult = await queryRunner.manager.delete(Permission, ids);

      if (deleteResult.affected !== ids.length) {
        throw new NotFoundException(`Algunos permisos no fueron encontrados para los IDs proporcionados: ${ids}`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
