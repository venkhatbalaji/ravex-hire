import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
// import { clearRedisStore } from './setup-e2e'; // Import if needed for specific scenarios

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let rateLimitMaxRequests: number;
  let rateLimitWindowMs: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = app.get(ConfigService);

    // Get rate limit config for tests - ensure these are numbers
    rateLimitMaxRequests = parseInt(configService.get<string>('RATE_LIMIT_MAX_REQUESTS', '100'), 10);
    rateLimitWindowMs = parseInt(configService.get<string>('RATE_LIMIT_WINDOW_MS', (15 * 60 * 1000).toString()), 10);
    
    // console.log(`Rate Limit Config: Max Requests = ${rateLimitMaxRequests}, Window MS = ${rateLimitWindowMs}`);


    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Endpoint Rate Limiting (e.g., /app/hello)', () => {
    // Test the /app/hello endpoint as it's public and simple
    const publicEndpoint = '/app/hello';

    it(`should allow requests up to the limit (max: ${rateLimitMaxRequests})`, async () => {
      for (let i = 0; i < rateLimitMaxRequests; i++) {
        const response = await request(app.getHttpServer())
          .get(publicEndpoint)
          .expect(HttpStatus.OK);
        
        // Check RateLimit headers on the last successful request
        if (i === rateLimitMaxRequests - 1) {
          expect(response.headers['ratelimit-limit']).toEqual(rateLimitMaxRequests.toString());
          expect(response.headers['ratelimit-remaining']).toEqual('0');
          expect(response.headers['ratelimit-reset']).toBeDefined();
        }
      }
    });

    it(`should block requests exceeding the limit with 429 Too Many Requests`, async () => {
      // First, ensure the limit is reached by making 'rateLimitMaxRequests' calls
      // This assumes the previous test ran or we reset state. For isolated tests, fill up the limit here.
      // For simplicity, this test relies on the previous one to fill up the limit.
      // Or, to make it more robust, run the loop here again (potentially on a different IP or endpoint if possible)
      // For this test, we assume the limit was just hit.

      const response = await request(app.getHttpServer())
        .get(publicEndpoint)
        .expect(HttpStatus.TOO_MANY_REQUESTS); // 429

      expect(response.body.message).toContain('Too many requests');
      expect(response.body.statusCode).toEqual(HttpStatus.TOO_MANY_REQUESTS);
      expect(response.headers['retry-after']).toBeDefined(); // Standard header for 429
      expect(response.headers['ratelimit-limit']).toEqual(rateLimitMaxRequests.toString());
      expect(response.headers['ratelimit-remaining']).toEqual('0');
    });
    
    it('should allow requests again after the rate limit window resets', async () => {
      // This test requires control over time
      jest.useFakeTimers();

      // 1. Exceed the limit (make rateLimitMaxRequests + 1 calls)
      // We need to ensure the counter is at max for the *current* window
      // To be safe, let's hit the limit again within this test's context
      // This resets any prior state for this specific test regarding timers.
      // clearRedisStore(); // This would clear *all* redis, might affect other parallel tests if any.
      // The mock redis store is cleared for each test file by setup-e2e.ts's global beforeEach
      // but not between tests in the same file.

      for (let i = 0; i < rateLimitMaxRequests; i++) {
        await request(app.getHttpServer()).get(publicEndpoint).expect(HttpStatus.OK);
      }
      // This one should be the first to get 429
      await request(app.getHttpServer()).get(publicEndpoint).expect(HttpStatus.TOO_MANY_REQUESTS);

      // 2. Advance time by the windowMs + a small buffer (e.g., 1 second)
      // console.log(`Advancing time by ${rateLimitWindowMs + 1000} ms`);
      jest.advanceTimersByTime(rateLimitWindowMs + 1000);

      // 3. Make another request - it should now be allowed
      const response = await request(app.getHttpServer())
        .get(publicEndpoint)
        .expect(HttpStatus.OK);

      // Check headers to confirm reset
      expect(response.headers['ratelimit-limit']).toEqual(rateLimitMaxRequests.toString());
      expect(response.headers['ratelimit-remaining']).toEqual((rateLimitMaxRequests - 1).toString());
      expect(response.headers['ratelimit-reset']).toBeDefined();
      
      jest.useRealTimers(); // Restore real timers
    });
  });
});
