import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateUserDto } from '../validators/create-user.dto';
import { IUserGrpcService } from '../interface/user.interface';

@Injectable()
export class UserService implements OnModuleInit {
  private userGrpc: IUserGrpcService;

  constructor(@Inject('USER_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userGrpc = this.client.getService<IUserGrpcService>('UserService');
  }

  createUser(data: CreateUserDto) {
    return this.userGrpc.CreateUser(data);
  }
}
