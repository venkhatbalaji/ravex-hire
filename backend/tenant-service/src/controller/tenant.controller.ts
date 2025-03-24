import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TenantDto } from '../dto/tenant.dto';
import { TenantService } from '../service/tenant.service';

@Controller()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @GrpcMethod('TenantService', 'CreateTenant')
  async createTenant(data: {
    name: string;
    domain: string;
  }): Promise<TenantDto> {
    return this.tenantService.createTenant(data.name, data.domain);
  }

  @GrpcMethod('TenantService', 'GetTenant')
  async getTenant(data: { domain: string }): Promise<TenantDto> {
    return this.tenantService.getTenantByDomain(data.domain);
  }
}
