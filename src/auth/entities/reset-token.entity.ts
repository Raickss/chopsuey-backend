import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/modules/users/user.entity';

@Entity('reset_token')
export class ResetToken {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.resetTokens)
    user: User;

    @Column({ type: 'varchar', length: 64 }) // Cambiado a 64 para un token más largo
    token: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;
}
