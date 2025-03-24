import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from '../service/tenant.service';
import { TenantController } from '../controller/tenant.controller';
import { Tenant } from '../entity/tenant.entity';
import { TenantRepository } from '../repository/tenant.repository';
import { TENANT_REPOSITORY } from '../interface/tenant.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantController],
  providers: [
    TenantService,
    {
      provide: TENANT_REPOSITORY,
      useClass: TenantRepository,
    },
  ],
  exports: [TenantService],
})
export class TenantModule {}
