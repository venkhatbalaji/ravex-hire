import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Roles } from './common/decorators/roles.decorator';
import { RolesGuard } from './common/guards/roles.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('admin')
  @Roles('admin') // Specify that 'admin' role is required
  @UseGuards(RolesGuard) // Apply the RolesGuard
  getAdminResource(@Req() req): string {
    // req.user would be populated by an authentication middleware
    // For testing, you might manually mock req.user in a test or a temporary middleware
    return `This is an admin resource. User: ${JSON.stringify(req.user)}`;
  }
}
