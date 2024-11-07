import { User } from 'src/modules/users/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';


@Entity('user_reset_password_code')
export class UserResetPasswordCode {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.resetPasswordCodes, { onDelete: 'CASCADE' })
    user: User;

    @Column({ type: 'varchar', width: 6 })
    code: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;
}
