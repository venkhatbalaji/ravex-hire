import { TenantDto } from '../dto/tenant.dto';

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');

export interface ITenantRepository {
  createTenant(name: string, domain: string): Promise<TenantDto>;
  getTenantByDomain(domain: string): Promise<TenantDto | null>;
}
