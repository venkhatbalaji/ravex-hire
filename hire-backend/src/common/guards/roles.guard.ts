import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    // For now, assume user.roles is an array of strings.
    // A real implementation would involve more robust role checking.
    // Also, ensure 'user' object and 'user.roles' exist.
    if (user && user.roles && Array.isArray(user.roles)) { // Check if user.roles is an array
       return requiredRoles.some((role) => (user.roles as string[]).includes(role));
    }
    // It's generally better to throw an exception for unauthorized access.
    throw new ForbiddenException('You do not have the necessary roles to access this resource.');
  }
}
