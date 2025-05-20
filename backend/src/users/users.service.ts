// apps/api/src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
// DTOs will be added later if needed for controller interactions

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createUserInternal(userData: {
    email: string;
    password?: string; // Password will be hashed by AuthService before calling this
    role: UserRole;
    firstName?: string;
    lastName?: string;
    organizationId?: string;
    isActive?: boolean;
  }): Promise<User> {
    // Ensure default for isActive if not provided
    const userToCreate = {
      isActive: true, // Default to true if not specified
      ...userData,
    };
    const newUser = this.usersRepository.create(userToCreate);
    return this.usersRepository.save(newUser);
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findUserById(id: string): Promise<User | undefined> {
    // TypeORM's findOne changed in 0.3.x, findOneBy is preferred for simple conditions
    // or findOne({ where: { id } })
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    Object.assign(user, updates);
    return this.usersRepository.save(user);
  }
}
