// apps/api/src/auth/guards/session-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SessionService, SessionData } from '../session.service'; // Adjust path
import { JwtService } from '@nestjs/jwt'; // To validate JWT structure/expiry if needed, beyond Redis check

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private sessionService: SessionService,
    private jwtService: JwtService, // Optional: for deeper token validation if session exists
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // 1. Verify token structure and basic expiry (optional, Redis is main check)
      // const decodedJwt = this.jwtService.verify(token); // Throws error if invalid/expired

      // 2. Check if session exists in Redis
      const session: SessionData | null = await this.sessionService.getSession(token);
      if (!session) {
        throw new UnauthorizedException('Session not found or expired');
      }

      // 3. (Optional) Validate session data further, e.g., check if user is active
      // This might involve fetching the user from DB based on session.userId
      // For now, we'll assume session existence is enough.

      // 4. Attach session data or user object to the request for use in handlers
      request.user = { id: session.userId, ...session }; // Or fetch full user object

      // 5. (Optional) Refresh session activity / TTL if implementing sliding sessions
      // await this.sessionService.refreshSession(token, session, newTtl);

    } catch (error) {
      // Log the error if needed
      // console.error('SessionAuthGuard error:', error.message);
      throw new UnauthorizedException(error.message || 'Invalid session');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
