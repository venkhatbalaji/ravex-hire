import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from '../entity/tenant.entity';
import { ITenantRepository } from '../interface/tenant.interface';
import { TenantDto } from '../dto/tenant.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly repository: Repository<Tenant>,
  ) {}

  async createTenant(name: string, domain: string): Promise<TenantDto> {
    try {
      const tenant = this.repository.create({ name, domain });
      const savedTenant = await this.repository.save(tenant);
      return {
        id: savedTenant.id,
        name: savedTenant.name,
        domain: savedTenant.domain,
      };
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

  async getTenantByDomain(domain: string): Promise<TenantDto | null> {
    const tenant = await this.repository.findOne({ where: { domain } });
    return tenant
      ? { id: tenant.id, name: tenant.name, domain: tenant.domain }
      : null;
  }
}
