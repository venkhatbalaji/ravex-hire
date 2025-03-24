import { UserDto } from '../dto/user.dto';
import { CreateUserInput } from '../dto/create-user.input';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  createUser(data: CreateUserInput): Promise<UserDto>;
  getUserById(id: number): Promise<UserDto | null>;
}
