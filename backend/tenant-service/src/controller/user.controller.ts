import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../service/user.service';
import { UserDto } from '../dto/user.dto';
import { UserRole } from '../entity/user.entity';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: {
    name: string;
    email: string;
    tenantId: number;
    role?: UserRole;
  }): Promise<UserDto> {
    return this.userService.createUser(data);
  }

  @GrpcMethod('UserService', 'GetUserById')
  async getUserById(data: { id: number }): Promise<UserDto> {
    return this.userService.getUserById(data.id);
  }

  @GrpcMethod('UserService', 'CreateTenantAdmin')
  async createTenantAdmin(data: {
    name: string;
    email: string;
    tenantId: number;
  }): Promise<UserDto> {
    return this.userService.createAdminUserForTenant(
      data.name,
      data.email,
      data.tenantId,
    );
  }
}
