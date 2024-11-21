import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity'; 
import { MailModule } from 'src/mail/mail.module';
import { Role } from '../roles/role.entity';
import { RolesModule } from '../roles/roles.module';


@Module({
  imports: [
    MailModule,
    RolesModule,
    TypeOrmModule.forFeature(
      [
        User,
        Role
      ]
    )
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
