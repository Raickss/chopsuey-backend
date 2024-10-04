import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUser.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserAuth } from './entities/user-auth.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { Role } from './entities/role.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserAuth)
        private readonly userAuthRepository: Repository<UserAuth>,

        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,

        private readonly mailService: MailService
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Obtener repositorios desde el QueryRunner
            const userRepository = queryRunner.manager.getRepository(User);
            const userAuthRepository = queryRunner.manager.getRepository(UserAuth);

            // Crear el usuario (datos generales)
            const newUser = userRepository.create({
                ...createUserDto,
                createTime: new Date(),
                updateTime: new Date()
            });

            const savedUser = await userRepository.save(newUser);

            // Generar username basado en nombre y apellido
            let username = this.generateUsername(createUserDto.firstName, createUserDto.lastName);
            let usernameExists = await userAuthRepository.findOne({ where: { username: username } });
            let counter = 1;

            while (usernameExists) {
                username = `${this.generateUsername(createUserDto.firstName, createUserDto.lastName)}${counter}`;
                usernameExists = await userAuthRepository.findOne({ where: { username: username } });
                counter++;
            }

            // Generar una contraseña aleatoria
            const generatedPassword = this.generateRandomPassword(12);
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);

            // Crear los datos de autenticación del usuario
            const newUserAuth = userAuthRepository.create({
                username: username,
                password: hashedPassword,
                user: savedUser,
                isActive: true,
            });

            await userAuthRepository.save(newUserAuth);
            await this.sendAccessEmail(createUserDto.email, username, generatedPassword);

            // Confirmar la transacción
            await queryRunner.commitTransaction();
            return savedUser;
        } catch (error) {
            // Revertir la transacción en caso de error
            await queryRunner.rollbackTransaction();

            if (error.code === '23505') {
                if (error.detail.includes('email')) {
                    throw new ConflictException('El correo electrónico ya está en uso');
                }
                if (error.detail.includes('documentId')) {
                    throw new ConflictException('El número de documento ya está en uso');
                }
            }
            throw new InternalServerErrorException('Error al crear el usuario');
        } finally {
            await queryRunner.release();
        }
    }

    private generateUsername(firstName: string, lastName: string): string {
        const first = firstName.split(' ')[0];
        return `${first.toLowerCase()}.${lastName.toLowerCase()}`;
    }

    private generateRandomPassword(length: number): string {
        return randomBytes(length).toString('hex').slice(0, length);
    }

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

        try {
            await this.mailService.sendEmail({
                to: email,
                subject: subject,
                text: textContent,
                html: htmlContent,
            });
        } catch (error) {
            console.error(`Error al enviar correo a ${email}:`, error);
            throw new InternalServerErrorException('Error al enviar el correo electrónico');
        }
    }



    async findAll(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async getUserByUsername(username: string): Promise<UserAuth | undefined> {
        try {
            const userAuth = await this.userAuthRepository.findOne({
                where: { username: username },
                relations: ['user', 'user.role', 'user.role.rolePermissions', 'user.role.rolePermissions.permission'],
            });
            return userAuth ? userAuth : undefined;
        } catch (error) {
            throw new InternalServerErrorException('Database query failed');
        }
    }

    async getPermissionsByRole(roleId: number): Promise<string[]> {
        const role = await this.roleRepository.findOne({
          where: { id: roleId },
          relations: ['rolePermissions', 'rolePermissions.permission'],
        });
    
        if (!role) {
          throw new Error(`Role with ID ${roleId} not found`);
        }
    
        return role.rolePermissions.map(rp => rp.permission.permissionName);
    }

}
