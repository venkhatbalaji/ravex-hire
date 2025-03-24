import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../interface/user.interface';
import { CreateUserInput } from '../dto/create-user.input';
import { UserDto } from '../dto/user.dto';
import { UserRole } from '../entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async createUser(data: CreateUserInput): Promise<UserDto> {
    return this.userRepo.createUser(data);
  }

  async getUserById(id: number): Promise<UserDto | null> {
    return this.userRepo.getUserById(id);
  }

  // Called when tenant is created
  async createAdminUserForTenant(
    name: string,
    email: string,
    tenantId: number,
  ): Promise<UserDto> {
    return this.createUser({ name, email, tenantId, role: UserRole.ADMIN });
  }
}
