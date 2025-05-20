// apps/api/src/users/users.controller.ts
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard'; // Adjust path as needed
import { ApiTags, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  @UseGuards(SessionAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth') // Matches the name in main.ts Swagger setup
  @ApiOkResponse({ description: 'Returns the authenticated user profile based on session data.'})
  getProfile(@Request() req) {
    // req.user is populated by SessionAuthGuard
    // It contains { id: session.userId, ...session }
    // For this basic example, we return what the guard attaches.
    // A real app might fetch the full user object from UsersService.
    return req.user; 
  }
}
