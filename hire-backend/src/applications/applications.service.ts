import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly repo: Repository<Application>,
  ) {}

  create(dto: CreateApplicationDto) {
    const app = this.repo.create({
      candidate: { id: dto.candidateId } as any,
      opportunity: { id: dto.opportunityId } as any,
    });
    return this.repo.save(app);
  }
}
