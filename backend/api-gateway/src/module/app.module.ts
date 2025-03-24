import { Module } from '@nestjs/common';
import { TenantModule } from '../module/tenant.module';
import { UserModule } from './user.module';
import { JobModule } from './job.module';

@Module({
  imports: [TenantModule, UserModule, JobModule],
})
export class AppModule {}
