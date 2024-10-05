import { 
    Entity,
    PrimaryGeneratedColumn,
    Column
} from "typeorm";
@Entity('permission')
export class Permission{
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    permissionName: string;

    @Column()
    description: string;
}