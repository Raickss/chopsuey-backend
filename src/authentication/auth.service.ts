import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/users.service';
import { UserAuthDto } from './dtos/user-auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }
    async login(user: UserAuthDto) {
        const payload = { username: user.username, sub: user.userId, role: user.role, permissions: user.permissions };

        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.ACCESS_TOKEN_SECRET,
            expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '15m',
        });

        const refreshToken = this.jwtService.sign({ sub: user.userId }, {
            secret: process.env.REFRESH_TOKEN_SECRET,
            expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
    async validateUser(username: string, pass: string): Promise<UserAuthDto | null> {
        const userAuth = await this.usersService.getUserByUsername(username);

        if (userAuth && userAuth.isActive && (await bcrypt.compare(pass, userAuth.password))) {
            const { password, ...userWithoutPassword } = userAuth;

            // Verificar si el usuario tiene un rol asignado
            if (!userWithoutPassword.user.role) {
                throw new UnauthorizedException('El usuario aun no tiene rol asignado.');
            }

            // Obtener los permisos del rol del usuario
            const permissions = await this.usersService.getPermissionsByRole(userWithoutPassword.user.role.id);

            // Retorna el usuario junto con los permisos
            return {
                username: userWithoutPassword.username,
                userId: userWithoutPassword.user.id,
                role: userWithoutPassword.user.role.roleName,
                permissions: permissions,
                isActive: userWithoutPassword.isActive
            };
        }

        return null;
    }

}
