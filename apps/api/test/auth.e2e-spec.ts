// apps/api/test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Adjust path to main AppModule
// import { getRepositoryToken } from '@nestjs/typeorm'; // Not used directly in these modified tests
// import { User } from '../src/users/entities/user.entity'; // Not used directly
// import { Organization } from '../src/organizations/entities/organization.entity'; // Not used directly
// import { TypeOrmModuleOptions } from '@nestjs/typeorm'; // Not used directly
// import { ConfigService } from '@nestjs/config'; // Not used directly
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt'; // To decode tokens for assertions

// Note: For true E2E tests, a separate test database is crucial.
// These tests will mock Redis interactions.

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let mockCacheManager;
  let jwtService: JwtService; // To decode tokens

  const uniqueEmailSuffix = () => `${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

  // Hold a reference to the original TypeOrmModuleOptions
  // let originalTypeOrmModuleOptions: Partial<TypeOrmModuleOptions>; // Not currently used

  beforeAll(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(CACHE_MANAGER)
    .useValue(mockCacheManager)
    .compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService); // Get JwtService instance
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Strips properties not in DTO
      forbidNonWhitelisted: true, // Throws error if non-whitelisted properties are present
    }));
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register-organization (POST)', () => {
    const orgAdminEmail = `admin-${uniqueEmailSuffix()}@ravex.com`;
    const orgEmail = `org-${uniqueEmailSuffix()}@ravex-org.com`;
    const orgName = `Ravex Test Org ${uniqueEmailSuffix()}`;

    const registrationDto = {
      organizationName: orgName,
      organizationEmail: orgEmail,
      adminUser: {
        email: orgAdminEmail,
        password: 'Password123!',
        firstName: 'TestAdmin',
        lastName: 'User',
      },
    };

    it('should register an organization and admin user, return 201 with token and user/org info', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register-organization')
        .send(registrationDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toEqual(orgAdminEmail);
      expect(response.body.user.password).toBeUndefined(); // Ensure password is not returned
      expect(response.body.organization).toBeDefined();
      expect(response.body.organization.name).toEqual(orgName);
      expect(response.body.organization.email).toEqual(orgEmail);

      // Verify session was "created" via cacheManager.set
      const token = response.body.accessToken;
      const decodedToken = jwtService.decode(token) as { sub: string; exp: number; iat: number };
      const expectedSessionKey = `session:${token}`;
      const expectedSessionData = expect.objectContaining({
        userId: decodedToken.sub,
        iat: decodedToken.iat,
        exp: decodedToken.exp,
      });
      const expectedTtl = decodedToken.exp - Math.floor(Date.now() / 1000);
      
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expectedSessionKey,
        expectedSessionData,
        expect.any(Number) // TTL
      );
      // Check TTL with a small tolerance
      const actualTtl = mockCacheManager.set.mock.calls[0][2];
      expect(actualTtl).toBeGreaterThanOrEqual(expectedTtl - 5); // Allow 5s difference
      expect(actualTtl).toBeLessThanOrEqual(expectedTtl + 5);
    });

    it('should return 409 Conflict if organization email already exists', async () => {
      // First registration (from previous test or a new one if tests are isolated)
      // For this test to be robust, ensure the orgEmail is indeed unique before this specific test
      // or that the previous test's data is cleaned up.
      // Assuming the previous test created this orgEmail:
      await request(app.getHttpServer())
        .post('/auth/register-organization')
        .send({
            organizationName: "Another Org Name",
            organizationEmail: orgEmail, // Use the same orgEmail
            adminUser: {
                email: `another-admin-${uniqueEmailSuffix()}@ravex.com`,
                password: 'Password123!',
                firstName: 'Another',
                lastName: 'Admin',
            }
        })
        .expect(HttpStatus.CONFLICT); // Expect 409 Conflict
    });
    
    it('should return 409 Conflict if admin user email already exists', async () => {
      // Assuming the first test created this adminUserEmail:
      await request(app.getHttpServer())
        .post('/auth/register-organization')
        .send({
            organizationName: `Yet Another Org ${uniqueEmailSuffix()}`,
            organizationEmail: `org-unique-${uniqueEmailSuffix()}@ravex-org.com`,
            adminUser: { // Use the same adminUser email
                email: orgAdminEmail, 
                password: 'Password123!',
                firstName: 'Original',
                lastName: 'Admin',
            }
        })
        .expect(HttpStatus.CONFLICT); // Assuming UsersService throws ConflictException
    });

    it('should return 400 Bad Request for invalid input (e.g., weak password)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register-organization')
        .send({
          ...registrationDto,
          adminUser: {
            ...registrationDto.adminUser,
            email: `newadmin-${uniqueEmailSuffix()}@ravex.com`, // Unique email for this test
            password: '123', // Weak password
          },
          organizationEmail: `neworg-${uniqueEmailSuffix()}@ravex-org.com`, // Unique org email
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/auth/login (POST)', () => {
    // To properly test login, a user needs to be registered first.
    // This relies on the /auth/register-organization endpoint working.
    const loginUserEmail = `login-user-${uniqueEmailSuffix()}@ravex.com`;
    const loginUserPassword = 'PasswordForLogin123!';
    const loginOrgEmail = `login-org-${uniqueEmailSuffix()}@ravex-org.com`;
    const loginOrgName = `Login Test Org ${uniqueEmailSuffix()}`;


    beforeAll(async () => {
      // Create a user to test login
      await request(app.getHttpServer())
        .post('/auth/register-organization')
        .send({
          organizationName: loginOrgName,
          organizationEmail: loginOrgEmail,
          adminUser: {
            email: loginUserEmail,
            password: loginUserPassword,
            firstName: 'Login',
            lastName: 'TestUser',
          },
        })
        .expect(HttpStatus.CREATED); // Ensure user is created before login tests
    });

    it('should login successfully with valid credentials and return 200 with token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: loginUserEmail, password: loginUserPassword })
        .expect(HttpStatus.OK);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toEqual(loginUserEmail);

      // Verify session was "created" via cacheManager.set
      const token = response.body.accessToken;
      const decodedToken = jwtService.decode(token) as { sub: string; exp: number; iat: number };
      const expectedSessionKey = `session:${token}`;
      const expectedSessionData = expect.objectContaining({
        userId: decodedToken.sub,
        iat: decodedToken.iat,
        exp: decodedToken.exp,
      });
      const expectedTtl = decodedToken.exp - Math.floor(Date.now() / 1000);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expectedSessionKey,
        expectedSessionData,
        expect.any(Number) // TTL
      );
      const actualTtl = mockCacheManager.set.mock.calls[0][2];
      expect(actualTtl).toBeGreaterThanOrEqual(expectedTtl - 5); // Allow 5s difference
      expect(actualTtl).toBeLessThanOrEqual(expectedTtl + 5);
    });

    it('should return 401 Unauthorized for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: loginUserPassword })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: loginUserEmail, password: 'WrongPassword123!' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- Tests for Protected Route (/users/profile) ---
  describe('/users/profile (GET) - Protected Route', () => {
    let authToken = '';
    let decodedTokenPayload: { sub: string; exp: number; iat: number; role?: string; organizationId?: string; username?: string; };
    const profileUserEmail = `profile-user-${uniqueEmailSuffix()}@ravex.com`;
    const profileUserPassword = 'PasswordForProfile123!';

    beforeAll(async () => {
      // Register a new user and log them in to get a token
      await request(app.getHttpServer())
        .post('/auth/register-organization')
        .send({
          organizationName: `Profile Test Org ${uniqueEmailSuffix()}`,
          organizationEmail: `profile-org-${uniqueEmailSuffix()}@ravex-org.com`,
          adminUser: {
            email: profileUserEmail,
            password: profileUserPassword,
            firstName: 'ProfileUser',
            lastName: 'Test',
          },
        })
        .expect(HttpStatus.CREATED);
      
      mockCacheManager.set.mockClear(); // Clear set from registration's internal login

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: profileUserEmail, password: profileUserPassword })
        .expect(HttpStatus.OK);
      
      authToken = loginResponse.body.accessToken;
      decodedTokenPayload = jwtService.decode(authToken) as { sub: string; exp: number; iat: number; };

      // Ensure the login call correctly "sets" the session for subsequent tests
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `session:${authToken}`,
        expect.objectContaining({ userId: decodedTokenPayload.sub }),
        expect.any(Number)
      );
    });

    it('should allow access with valid token and session, returning user profile', async () => {
      const mockSessionData = { 
        userId: decodedTokenPayload.sub, 
        exp: decodedTokenPayload.exp, 
        iat: decodedTokenPayload.iat 
      };
      mockCacheManager.get.mockResolvedValue(mockSessionData);

      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toEqual(decodedTokenPayload.sub);
      // SessionAuthGuard attaches { id: session.userId, ...session } to req.user
      // So response.body should contain properties from SessionData like iat, exp
      expect(response.body.iat).toEqual(decodedTokenPayload.iat);
      expect(response.body.exp).toEqual(decodedTokenPayload.exp);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`session:${authToken}`);
    });

    it('should deny access if session not found in cache (e.g., expired or invalid)', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.UNAUTHORIZED); // Expect 401 from SessionAuthGuard
      expect(mockCacheManager.get).toHaveBeenCalledWith(`session:${authToken}`);
    });
    
    it('should deny access without a token', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(HttpStatus.UNAUTHORIZED); // Expect 401
    });
  });

  // --- Tests for Logout Functionality (/auth/logout) ---
  describe('/auth/logout (POST)', () => {
    let authTokenForLogout = '';
    const logoutUserEmail = `logout-user-${uniqueEmailSuffix()}@ravex.com`;
    const logoutUserPassword = 'PasswordForLogout123!';
    let logoutUserDecodedPayload: { sub: string; exp: number; iat: number; };


    beforeAll(async () => {
      // Register and login a user for logout tests
      await request(app.getHttpServer())
        .post('/auth/register-organization')
        .send({
          organizationName: `Logout Test Org ${uniqueEmailSuffix()}`,
          organizationEmail: `logout-org-${uniqueEmailSuffix()}@ravex-org.com`,
          adminUser: {
            email: logoutUserEmail,
            password: logoutUserPassword,
            firstName: 'LogoutUser',
            lastName: 'Test',
          },
        })
        .expect(HttpStatus.CREATED);

      mockCacheManager.set.mockClear(); // Clear set from registration's internal login

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: logoutUserEmail, password: logoutUserPassword })
        .expect(HttpStatus.OK);
      
      authTokenForLogout = loginResponse.body.accessToken;
      logoutUserDecodedPayload = jwtService.decode(authTokenForLogout) as { sub: string; exp: number; iat: number; };

      // Ensure login sets the session
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `session:${authTokenForLogout}`,
        expect.objectContaining({ userId: logoutUserDecodedPayload.sub }),
        expect.any(Number)
      );
    });

    it('should successfully logout, delete session, and deny subsequent access', async () => {
      // 1. Mock get for SessionAuthGuard on the logout endpoint itself
      const mockSessionData = { 
        userId: logoutUserDecodedPayload.sub, 
        exp: logoutUserDecodedPayload.exp, 
        iat: logoutUserDecodedPayload.iat 
      };
      mockCacheManager.get.mockResolvedValue(mockSessionData);
      mockCacheManager.del.mockResolvedValue(undefined); // Mock successful deletion

      // 2. Call logout endpoint
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authTokenForLogout}`)
        .expect(HttpStatus.OK); // Or HttpStatus.NO_CONTENT if changed

      expect(mockCacheManager.del).toHaveBeenCalledWith(`session:${authTokenForLogout}`);
      
      // 3. Attempt to access protected route with the same token
      mockCacheManager.get.mockResolvedValue(null); // Simulate session is now deleted

      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authTokenForLogout}`)
        .expect(HttpStatus.UNAUTHORIZED);
      
      expect(mockCacheManager.get).toHaveBeenCalledWith(`session:${authTokenForLogout}`);
    });

    it('should deny logout if token is invalid or session does not exist', async () => {
      mockCacheManager.get.mockResolvedValue(null); // Simulate no session for the token

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authTokenForLogout}`) // Could be any token if session is null
        .expect(HttpStatus.UNAUTHORIZED); // SessionAuthGuard should deny access
      
      expect(mockCacheManager.del).not.toHaveBeenCalled(); // del should not be called if guard fails
    });
  });
});
