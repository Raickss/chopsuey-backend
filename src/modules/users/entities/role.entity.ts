import { 
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany
} from "typeorm";
import { User } from "./user.entity";

@Entity('role')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 50, unique: true })
    roleName: string;

    @OneToMany(() => User, (user) => user.role)
    authUsers: User[];
}
