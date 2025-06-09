import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SubdomainTenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    if (!host) {
      throw new BadRequestException('Host header missing');
    }
    const subdomain = host.split('.')[0];
    (req as any).tenantId = subdomain;
    next();
  }
}
