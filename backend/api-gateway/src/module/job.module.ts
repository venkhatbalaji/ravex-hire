import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JobController } from 'src/controller/job.controller';
import { JobService } from 'src/service/job.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'JOB_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'job',
          protoPath: 'src/proto/job.proto',
          url: 'localhost:5001',
        },
      },
    ]),
  ],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
