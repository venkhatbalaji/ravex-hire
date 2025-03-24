import { Controller, Post, Body } from '@nestjs/common';
import { JobService } from '../service/job.service';
import { CreateJobDto } from '../validators/create-job.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job listing' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  async createJob(@Body() body: CreateJobDto) {
    return this.jobService.createJob(body);
  }
}
