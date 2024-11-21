// role.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany
} from "typeorm";
import { RolePermission } from "../roles-permissions/role-permission.entity";
import { User } from "../users/user.entity";

@Entity('role')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 50, unique: true })
    roleName: string;

    @OneToMany(() => User, (user) => user.role, { cascade: false }) 
    users: User[];

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role, { onDelete: 'CASCADE' }) 
    rolePermissions: RolePermission[];
}
