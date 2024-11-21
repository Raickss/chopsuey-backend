// role-permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne
} from "typeorm";
import { Permission } from "../permissions/permission.entity";
import { Role } from "../roles/role.entity";

@Entity('role_permission')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { onDelete: 'CASCADE' })
  permission: Permission;
}
