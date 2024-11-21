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
import { VerifyResetCodeDto } from './dtos/verify-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(RefreshTokenGuard)
  @HttpCode(200)
  @Get('refresh-token')
  async refreshTokens(@Req() req: Request): Promise<Tokens> {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }  

  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() req: Request): Promise<void> {
    const userId = req.user['sub'];
    await this.authService.logout(userId);
  }

  @HttpCode(200)
  @Post('signin')
  async login(@Body() data: AuthDto): Promise<Tokens> {
    return this.authService.signin(data);
  }
  
  @HttpCode(200)
  @Post('forgot-password')
  async forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    await this.authService.requestPasswordReset(data);
  }
  
  @HttpCode(200)
  @Post('verify-reset-code')
  async verifyResetCode(@Body() data: VerifyResetCodeDto): Promise<void> {
    const { code } = data;
    return await this.authService.verifyResetCode(code);
  }

  @HttpCode(200)
  @Post('reset-password')
  async resetPassword(@Body() data: ResetPasswordDto): Promise<{ message: string }> {
    const { code, newPassword } = data;
    await this.authService.resetPassword(code, newPassword);
    return { message: 'Contraseña cambiada con éxito' };
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @Patch('change-password')
  async changePassword(@Req() req: Request, @Body() data: ChangePasswordDto): Promise<void> {
    const userId = req.user['sub'];
    await this.authService.changePassword(userId,data);
  }
}
