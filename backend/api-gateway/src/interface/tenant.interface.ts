import { Observable } from 'rxjs';
import { CreateTenantDto } from '../validators/create-tenant.dto';

export interface ITenantGrpcService {
  CreateTenant(data: CreateTenantDto): Observable<any>;
}
