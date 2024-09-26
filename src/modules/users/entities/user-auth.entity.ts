import { 
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn
} from "typeorm";
import { User } from './user.entity';

@Entity('user_auth')
export class UsersAuth {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' })
    employee: User;

    @Column({ type: 'varchar', length: 50, unique: true })
    userName: string;

    @Column({ type: 'varchar' })
    password: string;
}