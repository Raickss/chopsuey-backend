import { 
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany
} from "typeorm";
import { RolePermission } from "../roles-permissiones/role-permission.entity";
import { User } from "../users/entities/user.entity";


@Entity('role')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 50, unique: true })
    roleName: string;

    @OneToMany(() => User, (user) => user.role)
    authUsers: User[];

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
    rolePermissions: RolePermission[];
}
