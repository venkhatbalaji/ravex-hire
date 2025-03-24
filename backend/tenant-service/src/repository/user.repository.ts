import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entity/user.entity';
import { IUserRepository } from '../interface/user.interface';
import { UserDto } from '../dto/user.dto';
import { CreateUserInput } from '../dto/create-user.input';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createUser(data: CreateUserInput): Promise<UserDto> {
    try {
      const user = this.userRepo.create({
        ...data,
        role: data.role || UserRole.CANDIDATE,
        tenant: { id: data.tenantId },
      });
      const saved = await this.userRepo.save(user);
      return { ...saved, tenantId: saved.tenant.id };
    } catch (error) {
      Logger.error(error);
      throw new RpcException(
        JSON.stringify({
          message: error?.message,
          code: error?.code,
          success: false,
        }),
      );
    }
  }

  async getUserById(id: number): Promise<UserDto | null> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['tenant'],
    });
    return user ? { ...user, tenantId: user.tenant.id } : null;
  }
}
