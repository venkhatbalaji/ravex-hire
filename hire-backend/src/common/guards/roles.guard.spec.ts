import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
    mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({}),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should return true if user has one of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({ user: { roles: ['admin'] } });
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should return true if user has one of several required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['editor', 'viewer']);
    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({ user: { roles: ['viewer'] } });
    expect(guard.canActivate(mockContext)).toBe(true);
  });
  
  it('should throw ForbiddenException if user does not have any of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if req.user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({}); // No user object
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if req.user.roles is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({ user: {} }); // User object without roles
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
  
  it('should throw ForbiddenException if req.user.roles is not an array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({ user: { roles: 'admin' } }); // roles is a string, not array
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user has no roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({ user: { roles: [] } });
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
