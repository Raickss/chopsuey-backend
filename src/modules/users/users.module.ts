import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { UserAuth } from '../users-auth/user-auth.entity';
import { Role } from '../roles/role.entity';

@Module({
  imports: [
    MailModule,
    TypeOrmModule.forFeature(
      [
        User,
        UserAuth,
        Role
      ]
    )
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
