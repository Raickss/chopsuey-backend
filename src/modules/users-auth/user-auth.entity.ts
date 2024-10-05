import { 
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn
} from "typeorm";
import { User } from "../users/entities/user.entity";


@Entity('user_auth')
export class UserAuth {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User; 

    @Column({ type: 'varchar', length: 50, unique: true })
    username: string;

    @Column({ type: 'varchar' })
    password: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;
}
