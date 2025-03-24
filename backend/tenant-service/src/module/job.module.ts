import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobService } from '../service/job.service';
import { JobController } from '../controller/job.controller';
import { Job } from '../entity/job.entity';
import { JobRepository } from '../repository/job.repository';
import { JOB_REPOSITORY } from '../interface/job.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  controllers: [JobController],
  providers: [
    JobService,
    {
      provide: JOB_REPOSITORY,
      useClass: JobRepository,
    },
  ],
  exports: [JobService],
})
export class JobModule {}
