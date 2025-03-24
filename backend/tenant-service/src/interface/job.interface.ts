import { JobDto } from '../dto/job.dto';

export const JOB_REPOSITORY = Symbol('JOB_REPOSITORY');

export interface IJobRepository {
  createJob(data: {
    title: string;
    description: string;
    location: string;
    tenantId: number;
  }): Promise<JobDto>;
  getJobById(id: number): Promise<JobDto | null>;
  getAllJobs(tenantId?: number): Promise<JobDto[]>;
}
