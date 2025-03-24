import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entity/job.entity';
import { IJobRepository } from '../interface/job.interface';
import { JobDto } from '../dto/job.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class JobRepository implements IJobRepository {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  async createJob(data: {
    title: string;
    description: string;
    location: string;
    tenantId: number;
  }): Promise<JobDto> {
    try {
      const job = this.jobRepo.create({
        title: data.title,
        description: data.description,
        location: data.location,
        tenant: { id: data.tenantId },
      });
      const savedJob = await this.jobRepo.save(job);
      return {
        id: savedJob.id,
        title: savedJob.title,
        description: savedJob.description,
        location: savedJob.location,
        tenantId: savedJob.tenant.id,
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

  async getJobById(id: number): Promise<JobDto | null> {
    const job = await this.jobRepo.findOne({
      where: { id },
      relations: ['tenant'],
    });
    return job
      ? {
          id: job.id,
          title: job.title,
          description: job.description,
          location: job.location,
          tenantId: job.tenant.id,
        }
      : null;
  }

  async getAllJobs(tenantId?: number): Promise<JobDto[]> {
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.tenant', 'tenant');
    if (tenantId) {
      query.where('tenant.id = :tenantId', { tenantId });
    }
    const jobs = await query.getMany();
    return jobs.map((job) => {
      return {
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        tenantId: job.tenant.id,
      };
    });
  }
}
