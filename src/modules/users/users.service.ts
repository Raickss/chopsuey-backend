import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { userDto } from './dtos/user.dto';
import { PartialUpdateUserDto } from './dtos/parcial-update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly mailService: MailService,
    ) { }

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
        return this.userRepository.findOne({ where: { email } });
    }

    // Crear un nuevo usuario
    async create(createUserDto: userDto): Promise<User> {
        // Generar un nombre de usuario único antes de crear el usuario
        const baseUsername = this.generateUsername(createUserDto.firstName, createUserDto.lastName);
        let uniqueSuffix = this.generateUniqueSuffix();
        let username = `${baseUsername}${uniqueSuffix}`;

        // Verificar si el nombre de usuario ya existe y ajustar el sufijo
        let usernameExists = await this.userRepository.findOne({ where: { username } });
        while (usernameExists) {
            ``
            uniqueSuffix = this.generateUniqueSuffix();
            username = `${baseUsername}${uniqueSuffix}`;
            usernameExists = await this.userRepository.findOne({ where: { username } });
        }

        // Generar una contraseña aleatoria y cifrarla
        const generatedPassword = this.generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Crear el nuevo usuario con la información proporcionada, junto con username y password
        const newUser = this.userRepository.create({
            ...createUserDto,
            username, // Asignar el username generado
            password: hashedPassword, // Asignar la contraseña cifrada
            isActive: true, // Asignar el valor por defecto de isActive
            createTime: new Date(),
            updateTime: new Date(),
        });

        // Guardar el usuario en la base de datos
        const savedUser = await this.userRepository.save(newUser);

        // Enviar las credenciales por correo electrónico
        await this.sendAccessEmail(createUserDto.email, savedUser.username, generatedPassword);

        return savedUser;
    }

    // Generar un nombre de usuario basado en el primer nombre y primer apellido
    private generateUsername(firstName: string, lastName: string): string {
        // Extraer el primer nombre
        const first = firstName.split(' ')[0];

        // Extraer el primer apellido
        const last = lastName.split(' ')[0];

        // Generar el nombre de usuario en minúsculas
        return `${first.toLowerCase()}.${last.toLowerCase()}`;
    }

    // Generar un sufijo único para el nombre de usuario
    private generateUniqueSuffix(): string {
        const randomNumber = Math.floor(Math.random() * 1000);
        return randomNumber.toString().padStart(3, '0');
    }

    // Generar una contraseña aleatoria
    private generateRandomPassword(length: number): string {
        return randomBytes(length).toString('hex').slice(0, length);
    }

    // Enviar el correo con las credenciales de acceso
    private async sendAccessEmail(email: string, username: string, password: string) {
        const subject = 'Acceso a tu cuenta';
        const textContent = `Hola,

    Aquí están tus credenciales para acceder al sistema:
    
    Usuario: ${username}
    Contraseña temporal: ${password}
    
    Por favor, inicia sesión y cambia tu contraseña lo antes posible.
    
    Enlace de inicio de sesión: http://tu-dominio.com/login`;

        const htmlContent = `
      <p>Hola,</p>
      <p>Aquí están tus credenciales para acceder al sistema:</p>
      <ul>
        <li><strong>Usuario:</strong> ${username}</li>
        <li><strong>Contraseña temporal:</strong> ${password}</li>
      </ul>
      <p>Por favor, inicia sesión y cambia tu contraseña lo antes posible.</p>
      <p><a href="http://tu-dominio.com/login">Iniciar sesión</a></p>
    `;

        await this.mailService.sendEmail({
            to: email,
            subject,
            text: textContent,
            html: htmlContent,
        });
    }

    // Actualizar un usuario
    async update(userId: number, updateUserDto: PartialUpdateUserDto): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
        }

        // Actualizar solo los campos que vienen en el DTO
        Object.assign(user, updateUserDto);

        return this.userRepository.save(user); // `updateTime` se actualizará automáticamente
    }

    async updatePassword(userId: number, newPassword: string): Promise<void> {
        const user = await this.findById(userId);
        user.password = newPassword;
        await this.userRepository.save(user);
    }

    // Eliminar un usuario
    async remove(id: number): Promise<void> {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const userRepository = queryRunner.manager.getRepository(User);

            // Buscar el usuario a eliminar
            const user = await userRepository.findOne({ where: { id } });
            if (!user) {
                throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
            }

            // Eliminar el usuario
            await userRepository.remove(user);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // Asignar un rol a un usuario
    async assignRoleToUser(userId: number, roleId: number): Promise<User> {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const userRepository = queryRunner.manager.getRepository(User);
            const roleRepository = queryRunner.manager.getRepository(Role);

            const user = await userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
            }

            const role = await roleRepository.findOne({ where: { id: roleId } });
            if (!role) {
                throw new NotFoundException(`Rol con ID ${roleId} no encontrado.`);
            }

            user.role = role;
            const updatedUser = await userRepository.save(user);

            await queryRunner.commitTransaction();

            return updatedUser;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
