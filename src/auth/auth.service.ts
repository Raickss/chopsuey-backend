import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/users.service';
import { AuthDto } from './dtos/auth.dto';
import { RolesPermissionsService } from 'src/modules/roles-permissions/roles-permissions.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from './dtos/forgot-password';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UserResetPasswordCode } from './entities/user-reset-password.entity';
import { randomInt } from 'crypto';
import { Tokens } from './interfaces/tokens.interface';


@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly rolesPermissionsService: RolesPermissionsService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        @InjectRepository(UserResetPasswordCode)
        private readonly userResetPasswordCodeRepository: Repository<UserResetPasswordCode>
    ) { }

    async logout(userId: number) {
        return this.usersService.update(userId, { refreshToken: null });
    }

    async signin(data: AuthDto): Promise<Tokens> {
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
            user.username,
            user.role.roleName,
            user.role.rolePermissions.map((rolePermission) => rolePermission.permission.permissionName)
        );

        this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    async refreshTokens(userId: number, refreshToken: string): Promise<Tokens> {
        const user = await this.usersService.findById(userId);

        if (!user || !user.refreshToken) throw new ForbiddenException("Acceso denegado.");

        if (!user.isActive) {
            throw new UnauthorizedException('La cuenta del usuario no está activa.');
        }

        if (!user.role) {
            throw new UnauthorizedException('El usuario no tiene ningun rol asignado.');
        }

        const refreshTokenMatches = await bcrypt.compare(
            refreshToken,
            user.refreshToken
        );

        if (!refreshTokenMatches) throw new ForbiddenException("Acceso denegado.");

        const tokens = await this.getTokens(
            user.id,
            user.username,
            user.role.roleName,
            user.role.rolePermissions.map((rolePermission) => rolePermission.permission.permissionName)
        );

        const hashedRefreshToken = await this.hashData(tokens.refreshToken);

        await this.updateRefreshToken(user.id, hashedRefreshToken);

        return tokens;
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

    async resetPassword(data: ResetPasswordDto): Promise<void> {
        const { code, newPassword } = data;

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

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(codeRecord.user.id, hashedPassword);

        await this.userResetPasswordCodeRepository.delete(codeRecord.id);
    }

    async changePassword(data: ChangePasswordDto): Promise<void> {
        const { userId, currentPassword, newPassword } = data;
        const user = await this.usersService.findById(userId);
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('La contraseña actual no es correcta.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(userId, hashedPassword);
    }

    //Helper methods
    private async updateRefreshToken(userId: number, refreshToken: string): Promise<void> {
        const hashedRefreshToken = await this.hashData(refreshToken);
        await this.usersService.update(userId, { refreshToken: hashedRefreshToken });
    }

    private async hashData(data: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(data, saltRounds);
    }

    private async getTokens(
        id: number,
        username: string,
        role: string,
        permissions: string[],
    ): Promise<Tokens> {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                {
                    username,
                    sub: id,
                    role,
                    permissions,
                },
                {
                    secret: process.env.ACCESS_TOKEN_SECRET,
                    expiresIn: '1h',
                },
            ),
            this.jwtService.signAsync(
                {
                    username,
                    sub: id,
                    role,
                    permissions,
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
