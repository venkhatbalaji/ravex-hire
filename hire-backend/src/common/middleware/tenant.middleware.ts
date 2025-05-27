import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new UnauthorizedException('x-tenant-id header is missing');
    }

    // Extend the Express Request type to include tenantId
    // This is a common practice, but you might want to define a custom interface for Request
    (req as any).tenantId = tenantId;
    next();
  }
}
