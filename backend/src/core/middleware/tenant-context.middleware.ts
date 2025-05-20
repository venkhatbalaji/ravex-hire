// apps/api/src/core/middleware/tenant-context.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '../services/tenant-context.service';
import { JwtService } from '@nestjs/jwt'; 
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../auth/strategies/jwt.strategy'; 

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  constructor(
    private readonly tenantContextService: TenantContextService,
    // These are only needed if decoding token directly in middleware
    // private readonly jwtService: JwtService, 
    // private readonly configService: ConfigService, 
    ) {}

  async use(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) {
    this.logger.debug('TenantContextMiddleware running...');
    const userPayload = req.user; // Assuming JwtAuthGuard has run and populated req.user

    if (userPayload) {
      this.logger.debug(`User payload found in request: ${JSON.stringify(userPayload)}`);
      this.tenantContextService.userId = userPayload.sub; // 'sub' is typically userId
      this.tenantContextService.userRole = userPayload.role as any; // Cast if UserRole enum is used
      if (userPayload.organizationId) {
        this.tenantContextService.organizationId = userPayload.organizationId;
      } else {
        // If user has a role but no organizationId in payload (e.g., SUPER_ADMIN, CANDIDATE)
        // organizationId in context remains undefined, which is correct.
        this.logger.debug(`User ${userPayload.sub} (role: ${userPayload.role}) has no organizationId in JWT payload.`);
      }
    } else {
      this.logger.debug('No user payload found on request for TenantContext. Middleware will not populate context from JWT.');
      // The commented-out section for decoding token directly can be enabled if needed,
      // but it's generally better to rely on the guard to populate req.user.
      // If enabling, ensure JwtService and ConfigService are injected.
    }
    next();
  }
}
