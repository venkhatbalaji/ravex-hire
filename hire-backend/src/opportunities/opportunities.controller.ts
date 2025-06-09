import { Controller, Get, Post, Body, Param, Patch, Delete, Req } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly service: OpportunitiesService) {}

  @Post()
  create(@Body() dto: CreateOpportunityDto, @Req() req) {
    return this.service.create(dto, req.tenantId, req.user.id);
  }

  @Get()
  findAll(@Req() req) {
    return this.service.findAll(req.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
