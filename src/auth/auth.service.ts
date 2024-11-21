import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/users.service';
import { AuthDto } from './dtos/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from './dtos/forgot-password';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UserResetPasswordCode } from './entities/user-reset-password.entity';
import { randomInt } from 'crypto';
import { Tokens } from './interfaces/tokens.interface';
import { CacheConfigService } from 'src/config/caching/config.service';


@Injectable()
export class AuthService {
    private tokenUpdateInProgress = new Map<number, boolean>();
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        @InjectRepository(UserResetPasswordCode)
        private readonly userResetPasswordCodeRepository: Repository<UserResetPasswordCode>,
        private readonly cacheConfigService: CacheConfigService
    ) { }

    async logout(userId: number): Promise<void> {
        await this.usersService.update(userId, { refreshToken: null });

        await this.cacheConfigService.removeFromCache(`user:${userId}`);
    }

    async signin(data: AuthDto): Promise<Tokens> {
        console.log("hola")
        const { username, password } = data;
        const user = await this.usersService.findByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Usuario o contraseña incorrectos.');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('La cuenta del usuario no está activa.');
        }

        if (!user.role) {
            throw new UnauthorizedException('El usuario no tiene ningun rol asignado.');
        }

        const tokens = await this.getTokens(
            user.id,
            user.username
        );
        console.log('Tokens del login:', tokens)
        this.updateRefreshToken(user.id, tokens.refreshToken);
        const permissions = user.role.rolePermissions.map((rp) => rp.permission.permissionName);

        await this.cacheConfigService.saveToCache(`user:${user.id}`, {
            permissions: permissions,
        });

        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, permissions: permissions };
    }

    // async refreshTokens(userId: number, refreshToken: string): Promise<Tokens> {
    //     const user = await this.usersService.findById(userId);

    //     if (!user) {
    //         throw new ForbiddenException('Usuario no encontrado.');
    //     }

    //     if (!user.refreshToken) {
    //         throw new ForbiddenException({
    //             errorCode: 'REFRESH_TOKEN_MISSING',
    //             message: 'Acceso denegado.',
    //         });
    //     }

    //     if (!user.isActive) {
    //         throw new UnauthorizedException('La cuenta del usuario no está activa.');
    //     }

    //     if (!user.role) {
    //         throw new UnauthorizedException('El usuario no tiene ningun rol asignado.');
    //     }

    //     const refreshTokenMatches = await bcrypt.compare(
    //         refreshToken,
    //         user.refreshToken
    //     );

    //     if (!refreshTokenMatches) {
    //         throw new ForbiddenException({
    //             errorCode: 'REFRESH_TOKEN_INVALID',
    //             message: 'Token invalido. no coinciden',
    //         });
    //     }

    //     const tokens = await this.getTokens(
    //         user.id,
    //         user.username
    //     );
    //     console.log('tokens refrescados:', tokens)
    //     const hashedRefreshToken = await this.hashData(tokens.refreshToken);

    //     await this.updateRefreshToken(user.id, hashedRefreshToken);
    //     const permissions = user.role.rolePermissions.map((rp) => rp.permission.permissionName);

    //     await this.cacheConfigService.saveToCache(`user:${user.id}`, {
    //         permissions: permissions,
    //     });

    //     return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, permissions: permissions };
    // }

    async refreshTokens(userId: number, refreshToken: string): Promise<Tokens> {
        // Si ya hay un bloqueo activo para este usuario, lanza un error
        if (this.tokenUpdateInProgress.get(userId)) {
            throw new ForbiddenException({
                errorCode: 'REFRESH_TOKEN_ALREADY_IN_PROGRESS',
                message: 'La actualización del token ya está en curso.',
            });
        }

        // Activa el bloqueo
        this.tokenUpdateInProgress.set(userId, true);

        try {
            const user = await this.usersService.findById(userId);

            if (!user) {
                throw new ForbiddenException('Usuario no encontrado.');
            }

            if (!user.refreshToken) {
                throw new ForbiddenException({
                    errorCode: 'REFRESH_TOKEN_MISSING',
                    message: 'Acceso denegado.',
                });
            }

            if (!user.isActive) {
                throw new UnauthorizedException('La cuenta del usuario no está activa.');
            }

            if (!user.role) {
                throw new UnauthorizedException('El usuario no tiene ningún rol asignado.');
            }

            // Verifica si el refresh token coincide con el almacenado
            const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);

            if (!refreshTokenMatches) {
                throw new ForbiddenException({
                    errorCode: 'REFRESH_TOKEN_INVALID',
                    message: 'Token inválido. No coinciden.',
                });
            }

            // Genera nuevos tokens
            const tokens = await this.getTokens(user.id, user.username);
            console.log('Tokens refrescados:', tokens);

            // Encripta el nuevo refresh token
            const hashedRefreshToken = await this.hashData(tokens.refreshToken);

            // Actualiza el refresh token almacenado
            await this.updateRefreshToken(user.id, hashedRefreshToken);

            // Extrae los permisos del rol del usuario
            const permissions = user.role.rolePermissions.map((rp) => rp.permission.permissionName);

            // Guarda los permisos en la caché
            await this.cacheConfigService.saveToCache(`user:${user.id}`, {
                permissions: permissions,
            });

            // Devuelve los nuevos tokens y permisos
            return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, permissions: permissions };
        } finally {
            // Libera el bloqueo para permitir futuras solicitudes
            this.tokenUpdateInProgress.delete(userId);
        }
    }

    async requestPasswordReset(data: ForgotPasswordDto): Promise<void> {
        const { email } = data;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('No se encontró ningún usuario con ese correo electrónico.');
        }

        const resetCode = randomInt(100000, 999999).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const codeRecord = this.userResetPasswordCodeRepository.create({
            user,
            code: resetCode,
            expiresAt,
        });
        await this.userResetPasswordCodeRepository.save(codeRecord);

        await this.mailService.sendResetPasswordEmail(user.email, `Su código de restablecimiento es: ${resetCode}`);
    }

    async verifyResetCode(code: string): Promise<void> {
        const codeRecord = await this.userResetPasswordCodeRepository.findOne({
            where: { code },
            relations: ['user'],
        });

        if (!codeRecord) {
            throw new UnauthorizedException('Código de restablecimiento inválido.');
        }

        if (codeRecord.expiresAt < new Date()) {
            await this.userResetPasswordCodeRepository.delete(codeRecord.id);
            throw new UnauthorizedException('Código de restablecimiento expirado.');
        }
    }

    async resetPassword(code: string, newPassword: string): Promise<void> {
        const codeRecord = await this.userResetPasswordCodeRepository.findOne({
            where: { code },
            relations: ['user'],
        });

        if (!codeRecord) {
            throw new UnauthorizedException('Código de restablecimiento inválido.');
        }

        await this.usersService.updatePassword(codeRecord.user.id, newPassword);

        await this.userResetPasswordCodeRepository.delete(codeRecord.id);
    }

    async changePassword(userId: number ,data: ChangePasswordDto): Promise<void> {
        const { currentPassword, newPassword } = data;
        const user = await this.usersService.findById(userId);
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('La contraseña actual no es correcta.');
        }

        await this.usersService.updatePassword(userId, newPassword);
    }

    //Helper methods
    private async updateRefreshToken(userId: number, refreshToken: string): Promise<void> {
        console.log("Estoy guardando esta refreshtoken:", refreshToken);
        const hashedRefreshToken = await this.hashData(refreshToken);
        await this.usersService.update(userId, { refreshToken: hashedRefreshToken });
    }

    private async hashData(data: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(data, saltRounds);
    }

    private async getTokens(
        id: number,
        username: string
    ): Promise<Omit<Tokens, 'permissions'>> {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                {
                    username,
                    sub: id
                },
                {
                    secret: process.env.ACCESS_TOKEN_SECRET,
                    expiresIn: '2h',
                },
            ),
            this.jwtService.signAsync(
                {
                    username,
                    sub: id
                },
                {
                    secret: process.env.REFRESH_TOKEN_SECRET,
                    expiresIn: '7d',
                },
            ),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }
}
