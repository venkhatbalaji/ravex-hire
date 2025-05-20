// apps/api/src/core/services/tenant-context.service.ts
import { Injectable, Scope, Logger } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity'; // Adjust path as needed

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  private _organizationId?: string;
  private _userId?: string;
  private _userRole?: UserRole;

  set organizationId(id: string | undefined) {
    this._organizationId = id;
    this.logger.debug(`OrganizationId set in context: ${id}`);
  }
  get organizationId(): string | undefined {
    return this._organizationId;
  }

  set userId(id: string | undefined) {
    this._userId = id;
    this.logger.debug(`UserId set in context: ${id}`);
  }
  get userId(): string | undefined {
    return this._userId;
  }

  set userRole(role: UserRole | undefined) {
    this._userRole = role;
    this.logger.debug(`UserRole set in context: ${role}`);
  }
  get userRole(): UserRole | undefined {
    return this._userRole;
  }
}
