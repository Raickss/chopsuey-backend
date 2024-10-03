import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserAuth } from 'src/modules/users/entities/user-auth.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }
    async login(user: Omit<UserAuth, 'password'>) {
        // const payload = { username: user.username, sub: user.userId };
        // return {
        //     access_token: this.jwtService.sign(payload),
        // };
    }
    async validateUser(username: string, pass: string): Promise<Omit<UserAuth, 'password'> | null> {
        const user = await this.usersService.getUserByUsername(username);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    
}
