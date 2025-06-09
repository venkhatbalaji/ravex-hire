import { Controller, Post, Body } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly service: CandidatesService) {}

  @Post()
  create(@Body() dto: CreateCandidateDto) {
    return this.service.create(dto);
  }
}
