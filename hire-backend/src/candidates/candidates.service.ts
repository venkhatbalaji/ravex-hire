import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly repo: Repository<Candidate>,
  ) {}

  create(dto: CreateCandidateDto) {
    const candidate = this.repo.create(dto);
    return this.repo.save(candidate);
  }
}
