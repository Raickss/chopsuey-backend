import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUser.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { UserAuth } from './entities/user-auth.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserAuth)
        private readonly userAuthRepository: Repository<UserAuth>,
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
            let usernameExists = await userAuthRepository.findOne({ where: { userName: username } });
            let counter = 1;
    
            while (usernameExists) {
                username = `${this.generateUsername(createUserDto.firstName, createUserDto.lastName)}${counter}`;
                usernameExists = await userAuthRepository.findOne({ where: { userName: username } });
                counter++;
            }
    
            // Generar una contraseña aleatoria
            const generatedPassword = this.generateRandomPassword(12);
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    
            // Crear los datos de autenticación del usuario
            const newUserAuth = userAuthRepository.create({
                userName: username,
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
        const text = `Hola, aquí están tus credenciales para acceder al sistema:\n\nUsuario: ${username}\nContraseña temporal: ${password}\n\nPor favor, inicia sesión y cambia tu contraseña lo antes posible.`;
    }


    async findAll(): Promise<User[]> {
        return await this.userRepository.find();
    }

}
