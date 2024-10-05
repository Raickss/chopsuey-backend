import { Controller } from '@nestjs/common';
import { UsersAuthService } from './users-auth.service';

@Controller('users-auth')
export class UsersAuthController {
  constructor(private readonly usersAuthService: UsersAuthService) {}
}
