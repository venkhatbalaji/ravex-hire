import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity } from './opportunity.entity';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly repo: Repository<Opportunity>,
  ) {}

  create(dto: CreateOpportunityDto, tenantId: string, userId: string) {
    const opp = this.repo.create({
      ...dto,
      createdBy: userId,
      tenant: { id: tenantId } as any,
    });
    return this.repo.save(opp);
  }

  findAll(tenantId: string) {
    return this.repo.find({ where: { tenant: { id: tenantId } } });
  }

  update(id: string, dto: UpdateOpportunityDto) {
    return this.repo.update(id, dto);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
