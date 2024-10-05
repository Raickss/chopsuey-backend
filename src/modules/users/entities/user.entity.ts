import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn
} from "typeorm";
import { DocumentType } from "../enums/document-type.enum";
import { Gender } from "../enums/gender.enum";
import { Role } from "src/modules/roles/role.entity";


@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "enum",
        enum: DocumentType
    })
    documentType: DocumentType;

    @Column({ type: "varchar", length: 20, unique: true })
    documentId: string;

    @Column({ type: "varchar", length: 50 })
    firstName: string;

    @Column({ type: "varchar", length: 50 })
    lastName: string;

    @Column({
        type: "enum",
        enum: Gender
    })
    gender: Gender;

    @Column({ type: 'varchar', length: 15, nullable: true })
    phoneNumber: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    address: string;

    @Column({ type: 'date', nullable: true })
    birthDate: Date;

    @ManyToOne(() => Role, (role) => role.authUsers)
    role: Role;

    @CreateDateColumn({ type: 'timestamp' })
    createTime: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updateTime: Date;
}