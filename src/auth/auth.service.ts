import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/users.service';
import { UserAuthDto } from './dtos/user-auth.dto';
import { AuthDto } from './dtos/auth.dto';
import { RolesPermissionsService } from 'src/modules/roles-permissions/roles-permissions.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ResetToken } from './entities/reset-token.entity';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { MailService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from './dtos/forgot-password';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';


@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private readonly rolesPermissionsService: RolesPermissionsService,
        private jwtService: JwtService,
        private mailService: MailService,
        @InjectRepository(ResetToken)
        private readonly resetTokensRepository: Repository<ResetToken>
    ) { }

    async signIn(data: AuthDto) {
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
        return tokens;
    }

    async logout(userId: number) {
        return this.usersService.update(userId, { refreshToken: null });
    }

    async requestPasswordReset(data: ForgotPasswordDto): Promise<void> {
        const { email } = data;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('No se encontró ningún usuario con ese correo electrónico.');
        }

        const resetToken = nanoid(64);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const tokenRecord = this.resetTokensRepository.create({
            user,
            token: resetToken,
            expiresAt,
        });
        await this.resetTokensRepository.save(tokenRecord);

        const resetLink = `http://tu-dominio.com/reset-password?token=${resetToken}`;
        await this.mailService.sendResetPasswordEmail(user.email, resetLink);
    }

    async resetPassword(data: ResetPasswordDto): Promise<void> {
        const { token, newPassword } = data;
        const tokenRecord = await this.resetTokensRepository.findOne({
            where: { token },
            relations: ['user'],
        });

        if (!tokenRecord) {
            throw new UnauthorizedException('Token inválido.');
        }

        if (tokenRecord.expiresAt < new Date()) {
            await this.resetTokensRepository.delete(tokenRecord.id);
            throw new UnauthorizedException('Token expirado.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(tokenRecord.user.id, hashedPassword);
        await this.resetTokensRepository.delete(tokenRecord.id);
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

    async updateRefreshToken(userId: number, refreshToken: string) {
        const hashedRefreshToken = await this.hashData(refreshToken);
        await this.usersService.update(userId, { refreshToken: hashedRefreshToken });
    }

    async hashData(data: string) {
        const saltRounds = 10;
        return bcrypt.hash(data, saltRounds);
    }

    async refreshTokens(userId: number, refreshToken: string) {
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

        return tokens;
    }

    async getTokens(
        id: number,
        username: string,
        role: string,
        permissions: string[],
    ) {
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
