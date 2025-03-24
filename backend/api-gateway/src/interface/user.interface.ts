import { CreateUserDto } from '../validators/create-user.dto';
import { Observable } from 'rxjs';

export interface IUserGrpcService {
  CreateUser(data: CreateUserDto): Observable<any>;
}
