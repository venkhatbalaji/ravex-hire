import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateJobDto } from '../validators/create-job.dto';
import { IJobGrpcService } from '../interface/job.interface';

@Injectable()
export class JobService implements OnModuleInit {
  private jobGrpc: IJobGrpcService;

  constructor(@Inject('JOB_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.jobGrpc = this.client.getService<IJobGrpcService>('JobService');
  }

  createJob(data: CreateJobDto) {
    return this.jobGrpc.CreateJob(data);
  }
}
