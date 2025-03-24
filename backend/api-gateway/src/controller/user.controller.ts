import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { CreateUserDto } from '../validators/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user under a tenant' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() body: CreateUserDto) {
    return this.userService.createUser(body);
  }
}
