// apps/api/src/job-postings/job-postings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosting } from './entities/job-posting.entity';
import { JobPostingsService } from './job-postings.service';
// Assuming CoreModule will provide TenantContextService globally or JobPostingsModule imports CoreModule
// import { CoreModule } from '../../core/core.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPosting]),
    // CoreModule, // Uncomment if CoreModule is not global and provides TenantContextService
  ],
  providers: [JobPostingsService],
  exports: [JobPostingsService], // Export if other modules need it directly
})
export class JobPostingsModule {}
