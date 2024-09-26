import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne
} from "typeorm";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";

@Entity('role_permission')
export class RolePermission{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Role)
    role: Role;

    @ManyToOne(() => Permission)
    permission: Permission;
}