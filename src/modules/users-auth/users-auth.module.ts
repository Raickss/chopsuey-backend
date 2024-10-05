import { Module } from '@nestjs/common';
import { UsersAuthService } from './users-auth.service';
import { UsersAuthController } from './users-auth.controller';

@Module({
  controllers: [UsersAuthController],
  providers: [UsersAuthService],
})
export class UsersAuthModule {}
