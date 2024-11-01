import { BadRequestException, Body, Controller, Patch, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dtos/auth.dto';
import { ForgotPasswordDto } from './dtos/forgot-password';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signin')
  async login(@Body() data: AuthDto) {
    return this.authService.signIn(data);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    return this.authService.requestPasswordReset(data);
  }

  @Post('reset-password')
  async resetPassword(@Body() data: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(data);
  }

  @Patch('change-password')
  async changePassword(@Body() data: ChangePasswordDto): Promise<void> {
    return this.authService.changePassword(data);
  }
}
