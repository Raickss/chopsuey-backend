import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { User } from './user.entity';
import { UserDto } from './dtos/user.dto';
import { PartialUpdateUserDto } from './dtos/parcial-update-user.dto';
import { CacheConfigService } from 'src/config/caching/config.service';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly mailService: MailService,
        private readonly cacheConfigService: CacheConfigService,
        private readonly rolesService: RolesService
    ) { }

    async findAll(): Promise<User[]> {
        return await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
            .leftJoinAndSelect('rolePermissions.permission', 'permission')
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

    // async create(createUserDto: UserDto): Promise<User> {
    //     const baseUsername = this.generateUsername(createUserDto.firstName, createUserDto.lastName);
    //     let uniqueSuffix = this.generateUniqueSuffix();
    //     let username = `${baseUsername}${uniqueSuffix}`;

    //     // Asegurarse de que el nombre de usuario sea único
    //     let usernameExists = await this.userRepository.findOne({ where: { username } });
    //     while (usernameExists) {
    //         uniqueSuffix = this.generateUniqueSuffix();
    //         username = `${baseUsername}${uniqueSuffix}`;
    //         usernameExists = await this.userRepository.findOne({ where: { username } });
    //     }

    //     const generatedPassword = this.generateRandomPassword(12);
    //     const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    //     const newUser = this.userRepository.create({
    //         ...createUserDto,
    //         username,
    //         password: hashedPassword,
    //         isActive: false,
    //         createTime: new Date(),
    //         updateTime: new Date(),
    //     });

    //     const savedUser = await this.userRepository.save(newUser);
    //     await this.mailService.sendAccessEmail(createUserDto.email, savedUser.username, generatedPassword);

    //     return savedUser;
    // }
    async create(createUserDto: UserDto): Promise<User> {
        // Buscar el rol "RECEPTIONIST"
        const receptionistRole = await this.rolesService.findByRoleName('RECEPTIONIST');
        if (!receptionistRole) {
            throw new NotFoundException('Rol "RECEPTIONIST" no encontrado.');
        }
    
        // Generar un nombre de usuario único
        const baseUsername = this.generateUsername(createUserDto.firstName, createUserDto.lastName);
        let uniqueSuffix = this.generateUniqueSuffix();
        let username = `${baseUsername}${uniqueSuffix}`;
    
        let usernameExists = await this.userRepository.findOne({ where: { username } });
        while (usernameExists) {
            uniqueSuffix = this.generateUniqueSuffix();
            username = `${baseUsername}${uniqueSuffix}`;
            usernameExists = await this.userRepository.findOne({ where: { username } });
        }
    
        // Generar contraseña y encriptarla
        const generatedPassword = this.generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    
        // Crear y guardar el nuevo usuario
        const newUser = this.userRepository.create({
            ...createUserDto,
            username,
            password: hashedPassword,
            role: receptionistRole, // Asignar el rol directamente
            isActive: true,
            createTime: new Date(),
            updateTime: new Date(),
        });
    
        const savedUser = await this.userRepository.save(newUser);
    
        // Enviar correo con credenciales
        await this.mailService.sendAccessEmail(createUserDto.email, savedUser.username, generatedPassword);
    
        // Guardar los permisos del usuario en caché
        await this.cacheConfigService.saveToCache(`user:${savedUser.id}`, {
            permissions: receptionistRole.rolePermissions.map((rp) => rp.permission.permissionName),
        });
    
        return savedUser;
    }
    
    async update(userId: number, updateUserDto: PartialUpdateUserDto): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
        }

        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }

    async assignRoleToUser(userId: number, roleId: number): Promise<User> {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException(`Usuario no encontrado.`);
        }

        const role = await this.rolesService.findOne(roleId);

        if (!role) {
            throw new NotFoundException(`Rol con ID ${roleId} no encontrado.`);
        }

        user.role = role;
        user.isActive = true;

        const updatedUser = await this.userRepository.save(user);

        await this.cacheConfigService.saveToCache(`user:${user.id}`, {
            permissions: updatedUser.role.rolePermissions.map((rp) => rp.permission.permissionName),
        });

        return updatedUser;
    }

    async remove(userId: number): Promise<void> {
        const user = await this.findById(userId)
        if (!user) {
            throw new NotFoundException(`Usuario no encontrado.`);
        }
        await this.userRepository.remove(user);
    }

    //Helper methods
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

    async updatePassword(userId: number, newPassword: string): Promise<void> {
        const user = await this.findById(userId);
        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);
    }
}
