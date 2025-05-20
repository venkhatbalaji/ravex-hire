// apps/api/src/app.controller.ts
import { Controller, Get, UseGuards, Request as NestRequest } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthenticatedGuard } from './auth/guards/authenticated.guard'; // Import the guard
import { Request as ExpressRequest } from 'express'; // For typing req.session

@Controller('app') // Changed to /app to avoid root path conflicts and group app-specific routes
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello') // Changed to /app/hello
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(AuthenticatedGuard)
  @Get('me') // New protected route /app/me
  getMe(@NestRequest() req: ExpressRequest): { userId: string } {
    // req.session.userId should be populated if AuthenticatedGuard passes
    // Ensure that the session object and userId are available.
    if (req.session && req.session.userId) {
      return { userId: req.session.userId };
    }
    // This part should ideally not be reached if AuthenticatedGuard is working correctly
    // and throws an UnauthorizedException if req.session.userId is not set.
    // However, as a fallback or for clarity:
    return { userId: 'unknown_user_session_not_properly_set' }; 
  }
}
