import { 
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne
} from "typeorm";
import { Role } from "./role.entity";

@Entity('user')
export class User{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    dni: number;

    @Column({ type: "varchar", length: 50 })
    firstName: string;

    @Column({ type: "varchar", length: 50 })
    lastName: string

    @Column({ type: 'varchar', length: 20 })
    gender: string;

    @Column({ type: 'varchar', length: 15, nullable: true })
    phoneNumber: string;

    @Column({ type: 'varchar', length: 100 })
    email: string;

    @Column({ type: 'timestamp' })
    createTime: Date;

    @Column({ type: 'timestamp' })
    updateTime: Date;

    @Column({ type: 'boolean', default: true })
    isAcive: boolean;

    @ManyToOne(() => Role, (role) => role.users)
    role: Role;
}