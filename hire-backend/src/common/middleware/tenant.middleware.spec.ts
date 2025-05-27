import { TenantMiddleware } from './tenant.middleware';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new TenantMiddleware();
    mockRequest = {
      headers: {},
    };
    mockResponse = {}; // Not really used by this middleware
    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should set req.tenantId if x-tenant-id header is present', () => {
    const tenantId = 'test-tenant';
    mockRequest.headers['x-tenant-id'] = tenantId;

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect((mockRequest as any).tenantId).toEqual(tenantId);
    expect(nextFunction).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedException if x-tenant-id header is missing', () => {
    expect(() => {
      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    }).toThrow(UnauthorizedException);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if x-tenant-id header is an empty string', () => {
    mockRequest.headers['x-tenant-id'] = '';
    expect(() => {
      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    }).toThrow(UnauthorizedException);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
