import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { JobService } from '../service/job.service';
import { JobDto } from '../dto/job.dto';

@Controller()
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @GrpcMethod('JobService', 'CreateJob')
  async createJob(data: {
    title: string;
    description: string;
    location: string;
    tenantId: number;
  }): Promise<JobDto> {
    return this.jobService.createJob(data);
  }

  @GrpcMethod('JobService', 'GetJobById')
  async getJobById(data: { id: number }): Promise<JobDto> {
    return this.jobService.getJobById(data.id);
  }

  @GrpcMethod('JobService', 'GetJobs')
  async getAllJobs(data: { tenantId: number }): Promise<{ jobs: JobDto[] }> {
    const jobs = await this.jobService.getJobs(data.tenantId);
    return { jobs };
  }
}
