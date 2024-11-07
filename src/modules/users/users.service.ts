import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { UserDto } from './dtos/user.dto';
import { PartialUpdateUserDto } from './dtos/parcial-update-user.dto'; 

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly mailService: MailService,
    ) {}

    async findAll(): Promise<User[]> {
        return await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .getMany();
    }

    async findById(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
        });
        if (!user) {
            throw new NotFoundException(`Usuario no encontrado.`);
        }
        return user;
    }

    async findByUsername(username: string): Promise<User | null> {
        const user = await this.userRepository.findOne({
            where: { username },
            relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
        });
        return user || null;
    }

    async findByEmail(email: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException(`Usuario con correo ${email} no encontrado.`);
        }
        return user;
    }

    async create(createUserDto: UserDto): Promise<User> {
        const baseUsername = this.generateUsername(createUserDto.firstName, createUserDto.lastName);
        let uniqueSuffix = this.generateUniqueSuffix();
        let username = `${baseUsername}${uniqueSuffix}`;

        // Asegurarse de que el nombre de usuario sea único
        let usernameExists = await this.userRepository.findOne({ where: { username } });
        while (usernameExists) {
            uniqueSuffix = this.generateUniqueSuffix();
            username = `${baseUsername}${uniqueSuffix}`;
            usernameExists = await this.userRepository.findOne({ where: { username } });
        }

        const generatedPassword = this.generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const newUser = this.userRepository.create({
            ...createUserDto,
            username,
            password: hashedPassword,
            isActive: true,
            createTime: new Date(),
            updateTime: new Date(),
        });

        const savedUser = await this.userRepository.save(newUser);
        await this.mailService.sendAccessEmail(createUserDto.email, savedUser.username, generatedPassword);

        return savedUser;
    }

    private generateUsername(firstName: string, lastName: string): string {
        const first = firstName.split(' ')[0];
        const last = lastName.split(' ')[0];
        return `${first.toLowerCase()}.${last.toLowerCase()}`;
    }

    private generateUniqueSuffix(): string {
        const randomNumber = Math.floor(Math.random() * 1000);
        return randomNumber.toString().padStart(3, '0');
    }

    private generateRandomPassword(length: number): string {
        return randomBytes(length).toString('hex').slice(0, length);
    }

    async update(userId: number, updateUserDto: PartialUpdateUserDto): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
        }

        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }

    async updatePassword(userId: number, newPassword: string): Promise<void> {
        const user = await this.findById(userId);
        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);
    }

    async remove(id: number): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
        }
        await this.userRepository.remove(user);
    }

    async assignRoleToUser(userId: number, roleId: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
        }

        const role = await this.userRepository.manager.getRepository(Role).findOne({ where: { id: roleId } });
        if (!role) {
            throw new NotFoundException(`Rol con ID ${roleId} no encontrado.`);
        }

        user.role = role;
        return this.userRepository.save(user);
    }
}
