import { BadRequestException, Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dtos/auth.dto';
import { ForgotPasswordDto } from './dtos/forgot-password';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { Request } from 'express';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { Tokens } from './interfaces/tokens.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  async logout(@Req() req: Request): Promise<void> {
    const userId = req.user['sub'];
    this.authService.logout(userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  async refreshTokens(@Req() req: Request): Promise<Tokens> {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }  

  @Post('signin')
  async login(@Body() data: AuthDto): Promise<Tokens>  {
    return this.authService.signin(data);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @Post('forgot-password')
  async forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    return this.authService.requestPasswordReset(data);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @Post('reset-password')
  async resetPassword(@Body() data: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(data);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @Patch('change-password')
  async changePassword(@Body() data: ChangePasswordDto): Promise<void> {
    return this.authService.changePassword(data);
  }
}
