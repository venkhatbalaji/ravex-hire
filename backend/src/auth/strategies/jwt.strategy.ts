// apps/api/src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service'; 
import { TenantContextService } from '../../core/services/tenant-context.service'; // New import
import { UserRole } from '../../users/entities/user.entity'; // Import UserRole

export interface JwtPayload {
  username: string;
  sub: string; 
  role: string; // Keep as string to match JWT standard, cast to UserRole where needed
  organizationId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService, 
    private tenantContextService: TenantContextService, // Inject TenantContextService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwtSecret'), 
    });
    // this.logger.log(`JWT Secret used for strategy: ${configService.get<string>('jwtSecret')}`);
  }

  async validate(payload: JwtPayload): Promise<any> {
    this.logger.debug(`Validating JWT payload: ${JSON.stringify(payload)}`);
    const user = await this.usersService.findUserById(payload.sub);
    if (!user || !user.isActive) {
        this.logger.warn(`User ${payload.sub} not found or inactive.`);
        throw new UnauthorizedException('User not found or inactive.');
    }

    // Populate TenantContextService
    this.tenantContextService.userId = payload.sub;
    this.tenantContextService.userRole = payload.role as UserRole; // Cast to enum
    this.tenantContextService.organizationId = payload.organizationId;

    this.logger.debug(`TenantContext populated from JwtStrategy: userId=${payload.sub}, orgId=${payload.organizationId}, role=${payload.role}`);

    // This return value is what NestJS attaches to the Request object as request.user
    return { userId: payload.sub, username: payload.username, role: payload.role, organizationId: payload.organizationId };
  }
}
