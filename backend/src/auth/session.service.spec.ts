// apps/api/src/auth/session.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SessionService, SessionData } from './session.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('SessionService', () => {
  let service: SessionService;
  let cacheManagerMock: Pick<Cache, 'get' | 'set' | 'del'>; // More specific mock type

  beforeEach(async () => {
    // Initialize mocks for each test
    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMock,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should call cacheManager.set with correct parameters and calculated TTL from exp', async () => {
      const token = 'test-token-exp';
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const sessionData: SessionData = { userId: '1', exp: futureExp, iat: Math.floor(Date.now() / 1000) };
      
      // Calculate expected TTL, allowing for a small discrepancy due to execution time
      const expectedTtlLowerBound = futureExp - Math.floor(Date.now() / 1000) - 1; // Allow 1s for execution
      const expectedTtlUpperBound = futureExp - Math.floor(Date.now() / 1000) + 1; // Allow 1s for execution


      await service.createSession(token, sessionData);
      
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        `session:${token}`,
        sessionData,
        expect.any(Number)
      );
      
      // Check the TTL value more closely if needed, accounting for timing
      const actualTtl = (cacheManagerMock.set as jest.Mock).mock.calls[0][2];
      expect(actualTtl).toBeGreaterThanOrEqual(expectedTtlLowerBound > 0 ? expectedTtlLowerBound : 0);
      expect(actualTtl).toBeLessThanOrEqual(expectedTtlUpperBound);
    });

    it('should call cacheManager.set with provided TTL', async () => {
      const token = 'test-token-ttl';
      const sessionData: SessionData = { userId: '2' };
      const providedTtl = 1800; // 30 minutes

      await service.createSession(token, sessionData, providedTtl);
      expect(cacheManagerMock.set).toHaveBeenCalledWith(`session:${token}`, sessionData, providedTtl);
    });
    
    it('should use default TTL if no TTL provided and no exp in sessionData', async () => {
      const token = 'test-token-default-ttl';
      const sessionData: SessionData = { userId: 'user-default' };
      const defaultTtl = 3600; // As per SessionService logic

      await service.createSession(token, sessionData);
      expect(cacheManagerMock.set).toHaveBeenCalledWith(`session:${token}`, sessionData, defaultTtl);
    });

    it('should not call cacheManager.set if calculated TTL from exp is zero or negative', async () => {
      const token = 'expired-token-exp';
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const sessionData: SessionData = { userId: '3', exp: pastExp };

      await service.createSession(token, sessionData);
      // SessionService logic: if expiry <= 0, it does not call set.
      expect(cacheManagerMock.set).not.toHaveBeenCalled();
    });

    it('should not call cacheManager.set if provided TTL is zero or negative', async () => {
      const token = 'expired-token-ttl-zero';
      const sessionData: SessionData = { userId: '4' };

      await service.createSession(token, sessionData, 0);
      expect(cacheManagerMock.set).not.toHaveBeenCalled();

      await service.createSession(token, sessionData, -100);
      expect(cacheManagerMock.set).not.toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should call cacheManager.get and return session data', async () => {
      const token = 'get-token';
      const mockSessionData: SessionData = { userId: '1' };
      (cacheManagerMock.get as jest.Mock).mockResolvedValue(mockSessionData);

      const result = await service.getSession(token);
      expect(cacheManagerMock.get).toHaveBeenCalledWith(`session:${token}`);
      expect(result).toEqual(mockSessionData);
    });

    it('should return null if session not found', async () => {
      const token = 'not-found-token';
      (cacheManagerMock.get as jest.Mock).mockResolvedValue(null);

      const result = await service.getSession(token);
      expect(cacheManagerMock.get).toHaveBeenCalledWith(`session:${token}`);
      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should call cacheManager.del with the correct key', async () => {
      const token = 'delete-token';
      await service.deleteSession(token);
      expect(cacheManagerMock.del).toHaveBeenCalledWith(`session:${token}`);
    });
  });
  
  describe('refreshSession', () => {
    // refreshSession is just a wrapper around createSession, so we test if createSession's logic is invoked
    it('should call cacheManager.set with correct parameters and provided TTL', async () => {
      const token = 'refresh-token';
      const sessionData: SessionData = { userId: '4' };
      const ttl = 7200; // 2 hours

      await service.refreshSession(token, sessionData, ttl);
      expect(cacheManagerMock.set).toHaveBeenCalledWith(`session:${token}`, sessionData, ttl);
    });

    it('should call cacheManager.set and calculate TTL from exp if no TTL provided', async () => {
      const token = 'refresh-token-exp';
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const sessionData: SessionData = { userId: '5', exp: futureExp };
      
      const expectedTtlLowerBound = futureExp - Math.floor(Date.now() / 1000) - 1;
      const expectedTtlUpperBound = futureExp - Math.floor(Date.now() / 1000) + 1;

      await service.refreshSession(token, sessionData);
      
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        `session:${token}`,
        sessionData,
        expect.any(Number)
      );
      const actualTtl = (cacheManagerMock.set as jest.Mock).mock.calls[0][2];
      expect(actualTtl).toBeGreaterThanOrEqual(expectedTtlLowerBound > 0 ? expectedTtlLowerBound : 0);
      expect(actualTtl).toBeLessThanOrEqual(expectedTtlUpperBound);
    });

    it('should not call cacheManager.set if TTL is zero or negative (from explicit TTL)', async () => {
        const token = 'refresh-token-no-set';
        const sessionData: SessionData = { userId: '6' };
        await service.refreshSession(token, sessionData, 0);
        expect(cacheManagerMock.set).not.toHaveBeenCalled();
    });
  });
});
