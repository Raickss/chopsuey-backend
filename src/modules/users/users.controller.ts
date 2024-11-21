import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UserDto } from './dtos/user.dto';
import { PartialUpdateUserDto } from './dtos/parcial-update-user.dto';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { RequiredPermissions } from 'src/common/decorators/permission.decorator';
import { Permissions } from 'src/common/guards/enums/permissions.enum';

@Controller('users')
@UseGuards(AccessTokenGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @RequiredPermissions(Permissions.user.fetchAllUsers)
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('id/:userId')
  @RequiredPermissions(Permissions.user.findUserById)
  async findById(@Param('userId', ParseIntPipe) userId: number): Promise<User> {
    return this.usersService.findById(userId);
  }

  @Get('username/:username')
  @RequiredPermissions(Permissions.user.findUserByUsername)
  async findByUserName(@Param('username') username: string): Promise<User> {
    return this.usersService.findByUsername(username);
  }

  @Get('email/:email')
  @RequiredPermissions(Permissions.user.findUserByEmail)
  async findByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.findByEmail(email);
  }

  @Post()
  @RequiredPermissions(Permissions.user.createUser)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: UserDto,
  ): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Patch(':userId')
  @RequiredPermissions(Permissions.user.updateUser)
  async updateUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserDto: PartialUpdateUserDto
  ): Promise<User> {
    return this.usersService.update(userId, updateUserDto);
  }

  @Put(':userId/role/:roleId')
  @RequiredPermissions(Permissions.user.assignRole)
  async assignRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<User> {
    return await this.usersService.assignRoleToUser(userId, roleId);
  }
  
  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @RequiredPermissions(Permissions.user.removeUser)
  async delete(@Param('userId', ParseIntPipe) userId: number): Promise<void> {
    return this.usersService.remove(userId);
  }
}
