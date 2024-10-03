import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto
  ) {
    const { username, password } = loginDto;
    const user = await this.authService.validateUser(username, password);

    if (!user) {
      throw new BadRequestException('Credenciales invalidas');
    }

    return this.authService.login(user);
  }
}
