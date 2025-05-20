import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Adjust path to main AppModule
import { clearRedisStore } from './setup-e2e'; // Import the clearRedisStore helper

describe('Session Authentication (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperAgentTest; // To persist cookies across requests

  const uniqueUserSuffix = () => `${Date.now()}${Math.random().toString(36).substring(2, 7)}`;
  const testUserEmail = `session-test-user-${uniqueUserSuffix()}@example.com`;
  const testUserPassword = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    // No need to override CACHE_MANAGER here as we are testing express-session
    // The redis mock in setup-e2e.ts should cover connect-redis
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();

    // Create a supertest agent to automatically handle cookies
    agent = request.agent(app.getHttpServer());

    // Register a user for testing login and session
    // This uses the existing /auth/register-organization endpoint
    await agent
      .post('/auth/register-organization')
      .send({
        organizationName: `Session Test Org ${uniqueUserSuffix()}`,
        organizationEmail: `session-org-${uniqueUserSuffix()}@ravex-org.com`,
        adminUser: {
          email: testUserEmail,
          password: testUserPassword,
          firstName: 'SessionUser',
          lastName: 'Test',
        },
      })
      .expect(HttpStatus.CREATED);
  });

  beforeEach(() => {
    // Clear Redis store before each test related to sessions if needed,
    // though agent should handle cookies per test instance.
    // If global state from Redis mock affects tests, clear it.
    // clearRedisStore(); // Already called by setup-e2e.ts's global beforeEach
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/app/me (GET) - Protected by AuthenticatedGuard', () => {
    it('should deny access (401) if no session cookie is present', async () => {
      // Use a new agent for this request to ensure no cookies from previous tests
      const freshAgent = request.agent(app.getHttpServer());
      await freshAgent
        .get('/app/me')
        .expect(HttpStatus.UNAUTHORIZED); // AuthenticatedGuard throws UnauthorizedException
    });

    it('should allow access (200) after login and return user ID from session', async () => {
      // 1. Login the user - the agent will store the session cookie
      const loginResponse = await agent
        .post('/auth/login')
        .send({ email: testUserEmail, password: testUserPassword })
        .expect(HttpStatus.OK);

      // The user ID should be in the login response body
      const expectedUserId = loginResponse.body.user.id;
      expect(expectedUserId).toBeDefined();

      // 2. Access the protected route /app/me using the same agent (which has the cookie)
      const profileResponse = await agent
        .get('/app/me')
        .expect(HttpStatus.OK);
      
      // Assert that the body contains the userId from the session
      expect(profileResponse.body.userId).toEqual(expectedUserId);
    });

    it('should deny access (401) if session cookie is present but session data is invalid/missing in Redis', async () => {
      // 1. Login to establish a valid session and get cookie
      await agent
        .post('/auth/login')
        .send({ email: testUserEmail, password: testUserPassword })
        .expect(HttpStatus.OK);

      // 2. Manually clear the Redis store to invalidate the session server-side
      // This simulates session expiration or manual deletion from Redis.
      // The mock clearRedisStore() is run in beforeEach, but we need to clear it mid-test here.
      clearRedisStore(); 
      // console.log("Manually cleared Redis store for invalid session test.");


      // 3. Attempt to access the protected route with the (now stale) cookie
      // The AuthenticatedGuard should fail because req.session.userId won't be found
      // as connect-redis won't find the session in the (cleared) mock Redis.
      await agent
        .get('/app/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
