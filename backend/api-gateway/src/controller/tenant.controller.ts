import { Controller, Post, Body } from '@nestjs/common';
import { TenantService } from '../service/tenant.service';
import { CreateTenantDto } from '../validators/create-tenant.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant and default admin user' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  async createTenant(@Body() body: CreateTenantDto) {
    return this.tenantService.createTenant(body);
  }
}
