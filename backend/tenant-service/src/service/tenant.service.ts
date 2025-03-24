import { Inject, Injectable } from '@nestjs/common';
import { TenantDto } from '../dto/tenant.dto';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../interface/tenant.interface';

@Injectable()
export class TenantService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async createTenant(name: string, domain: string): Promise<TenantDto> {
    return this.tenantRepository.createTenant(name, domain);
  }

  async getTenantByDomain(domain: string): Promise<TenantDto | null> {
    return this.tenantRepository.getTenantByDomain(domain);
  }
}
