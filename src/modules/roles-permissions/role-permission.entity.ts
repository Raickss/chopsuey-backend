import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne
} from "typeorm";

import { Permission } from "../permissions/permission.entity";
import { Role } from "../roles/role.entity";


@Entity('role_permission')
export class RolePermission{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Role, (role) => role.rolePermissions, { eager: true })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { eager: true })
  permission: Permission;
}