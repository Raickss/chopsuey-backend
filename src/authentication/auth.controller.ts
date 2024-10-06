import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dtos/auth.dto';




@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signin')
  async login( @Body() data: AuthDto ) {
    return this.authService.signIn(data);
  }
}
