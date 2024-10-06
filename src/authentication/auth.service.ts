import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/users.service';
import { UserAuthDto } from './dtos/user-auth.dto';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { AuthDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private permissionsService: PermissionsService,
        private jwtService: JwtService,
    ) { }
    
    async signIn(data: AuthDto) {
        const user = await this.validateUserCredentials(data.username, data.password);
        const tokens = await this.getTokens(
            user.userId,
            user.username,
            user.role,
            user.permissions
        );
        return tokens;
    }

    async validateUserCredentials(username: string, password: string): Promise<UserAuthDto | null> {
        try {
            const userAuth = await this.usersService.getUserByUsername(username);
            if (!userAuth) {
                throw new NotFoundException('Usuario no encontrado.');
            }
            
            if (!userAuth.isActive) {
                throw new UnauthorizedException('La cuenta del usuario no está activa.');
            }
            
            const isPasswordValid = await bcrypt.compare(password, userAuth.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Contraseña incorrecta.');
            }
            
            const { password: _, ...userWithoutPassword } = userAuth;
            
            // Verificar si el usuario tiene un rol asignado
            if (!userWithoutPassword.user.role) {
                throw new UnauthorizedException('El usuario aun no tiene rol asignado.');
            }
            
            // Obtener los permisos del rol del usuario
            const permissions = await this.permissionsService.getPermissionsByRole(userWithoutPassword.user.role.id);
            
            // Retorna el usuario junto con los permisos
            return {
                username: userWithoutPassword.username,
                userId: userWithoutPassword.user.id,
                role: userWithoutPassword.user.role.roleName,
                permissions: permissions,
                isActive: userWithoutPassword.isActive,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('Error al validar el usuario.');
        }
    }

    async getTokens(id: number, username: string, role: string, permissions: string[]){
        const [ accessToken, refreshToken ] = await Promise.all([
            this.jwtService.signAsync(
                {
                    username: username,
                    sub: id,
                    role: role,
                    permissions: permissions
                },
                {
                    secret: process.env.ACCESS_TOKEN_SECRET,
                    expiresIn: '15m'
                }
            ),
            this.jwtService.signAsync(
                {
                    username: username,
                    sub: id,
                    role: role,
                    permissions: permissions
                },
                {
                    secret: process.env.REFRESH_TOKEN_SECRET,
                    expiresIn: '7d'
                }
            )
        ]);

        return {
            accessToken,
            refreshToken
        }
    }
}
