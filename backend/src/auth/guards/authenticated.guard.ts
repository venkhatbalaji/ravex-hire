import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    // Check if session exists and if userId is set in the session
    if (request.session && request.session.userId) {
      return true;
    }
    throw new UnauthorizedException('User is not authenticated');
  }
}
