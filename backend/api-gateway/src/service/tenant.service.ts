import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateTenantDto } from '../validators/create-tenant.dto';
import { ITenantGrpcService } from '../interface/tenant.interface';

@Injectable()
export class TenantService implements OnModuleInit {
  private tenantGrpc: ITenantGrpcService;

  constructor(@Inject('TENANT_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.tenantGrpc =
      this.client.getService<ITenantGrpcService>('TenantService');
  }

  createTenant(data: CreateTenantDto) {
    return this.tenantGrpc.CreateTenant(data);
  }
}
