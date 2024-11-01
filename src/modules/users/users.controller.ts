import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { userDto } from './dtos/user.dto';
import { PartialUpdateUserDto } from './dtos/parcial-update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: userDto,
  ): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.usersService.findById(id);
  }


  @Patch(':id')
  async updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: PartialUpdateUserDto
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':userId/role/:roleId')
  async assignRole(
    @Param('userId') userId: number,
    @Param('roleId') roleId: number,
  ): Promise<User> {
    return await this.usersService.assignRoleToUser(userId, roleId);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
