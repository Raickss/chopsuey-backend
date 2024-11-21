import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: process.env.REFRESH_TOKEN_SECRET,
                passReqToCallback: true
            }
        );
    }

    async validate(req: Request, payload: any) {
        const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();
        console.log(payload);
        return { ...payload, refreshToken };
    }
}