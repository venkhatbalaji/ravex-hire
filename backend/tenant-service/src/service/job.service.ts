import { Inject, Injectable } from '@nestjs/common';
import { JobDto } from '../dto/job.dto';
import { IJobRepository, JOB_REPOSITORY } from 'src/interface/job.interface';

@Injectable()
export class JobService {
  constructor(
    @Inject(JOB_REPOSITORY)
    private readonly tenantRepository: IJobRepository,
  ) {}

  async createJob(data: {
    title: string;
    description: string;
    location: string;
    tenantId: number;
  }): Promise<JobDto> {
    return this.tenantRepository.createJob(data);
  }

  async getJobs(tenantId: number): Promise<JobDto[] | null> {
    return this.tenantRepository.getAllJobs(tenantId);
  }

  async getJobById(id: number): Promise<JobDto | null> {
    return this.tenantRepository.getJobById(id);
  }
}
