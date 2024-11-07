import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UserDto } from './dtos/user.dto';
import { PartialUpdateUserDto } from './dtos/parcial-update-user.dto';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(AccessTokenGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: UserDto,
  ): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Get(':userid')
  async findById(@Param('userid', ParseIntPipe) userId: number): Promise<User> {
    return this.usersService.findById(userId);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':username')
  async findByUserName(@Param('username') username: string): Promise<User> {
    return this.usersService.findByUsername(username);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':email')
  async findByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.findByEmail(email);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: PartialUpdateUserDto
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AccessTokenGuard)
  @Put(':userId/role/:roleId')
  async assignRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<User> {
    return await this.usersService.assignRoleToUser(userId, roleId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
