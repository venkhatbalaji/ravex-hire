// apps/api/test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Adjust path to main AppModule
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Organization } from '../src/organizations/entities/organization.entity';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

// Note: For true E2E tests, a separate test database is crucial.
// This example will run against the configured dev database unless overridden.
// Overriding TypeORM connection for testing (e.g., with SQLite in-memory):
// This is a simplified example. A full setup would involve more robust configuration.

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  // let userRepository: Repository<User>; // For direct DB interaction if needed
  // let organizationRepository: Repository<Organization>; // For direct DB interaction

  const uniqueEmailSuffix = () => `${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

  // Hold a reference to the original TypeOrmModuleOptions
  let originalTypeOrmModuleOptions: Partial<TypeOrmModuleOptions>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    // Example of how one might try to override the DB for testing:
    // This approach has limitations and might not fully work without more complex setup
    // especially with migrations. For this task, we'll mostly test API contracts.
    // .overrideProvider(ConfigService) // If ConfigService provides dynamic DB config
    // .useValue({
    //   get: (key: string) => {
    //     if (key === 'database.type' && process.env.NODE_ENV === 'test') return 'sqlite';
    //     if (key === 'database.database' && process.env.NODE_ENV === 'test') return ':memory:';
    //     if (key === 'database.synchronize' && process.env.NODE_ENV === 'test') return true;
    //     // Return original values for other keys
    //     return new ConfigService().get(key); // Fallback to actual ConfigService
    //   }
    // })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Strips properties not in DTO
      forbidNonWhitelisted: true, // Throws error if non-whitelisted properties are present
    }));
    await app.init();

    // userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    // organizationRepository = moduleFixture.get<Repository<Organization>>(getRepositoryToken(Organization));

    // Clean up database before tests (requires a method to do so, or run on a test DB)
    // await organizationRepository.delete({}); // Be VERY careful with this on a dev DB
    // await userRepository.delete({});       // Be VERY careful with this on a dev DB
  });

  afterAll(async () => {
    // Clean up database after tests
    // await organizationRepository.delete({});
    // await userRepository.delete({});
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
});
