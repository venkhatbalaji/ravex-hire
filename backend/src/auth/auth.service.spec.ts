// apps/api/src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, AuthUserResponse } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { Organization } from '../organizations/entities/organization.entity';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: Partial<UsersService>;
  let jwtServiceMock: Partial<JwtService>;
  let configServiceMock: Partial<ConfigService>;
  let organizationsServiceMock: Partial<OrganizationsService>;


  const mockUser: User = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    password: 'hashedPassword123', // Usually this would be fetched from DB
    role: UserRole.CANDIDATE,
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Relations
    ownedOrganizations: [],
  };

  beforeEach(async () => {
    usersServiceMock = {
      findUserByEmail: jest.fn(),
      createUserInternal: jest.fn().mockResolvedValue(mockUser), // Mock createUserInternal
    };
    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('mockAccessToken'),
    };
    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'jwtSecret') return 'testSecret'; // Changed from app.jwtSecret to match current config
        if (key === 'jwtExpiresIn') return '1h'; // Changed from app.jwtExpiresIn
        return null;
      }),
    };
    organizationsServiceMock = {
        createOrganization: jest.fn(),
        setOwner: jest.fn(),
    };


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: OrganizationsService, useValue: organizationsServiceMock }, // Added mock
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should call bcrypt.hash with password and salt rounds', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      await service.hashPassword('password123');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('validateUser', () => {
    it('should return user (minus password and relations) if user exists and password matches', async () => {
      (usersServiceMock.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, candidateProfile, organization, ownedOrganizations, ...expectedUser } = mockUser;
      const result = await service.validateUser('test@example.com', 'password123');
      
      expect(result).toEqual(expectedUser);
      expect(usersServiceMock.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
    });

    it('should return null if user exists but password does not match', async () => {
      (usersServiceMock.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongPassword');
      expect(result).toBeNull();
    });
    
    it('should return null if user password is not set', async () => {
        const userWithoutPassword = { ...mockUser, password: null };
        (usersServiceMock.findUserByEmail as jest.Mock).mockResolvedValue(userWithoutPassword);
        const result = await service.validateUser('test@example.com', 'anyPassword');
        expect(result).toBeNull();
    });

    it('should return null if user does not exist', async () => {
      (usersServiceMock.findUserByEmail as jest.Mock).mockResolvedValue(null);
      const result = await service.validateUser('unknown@example.com', 'password123');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should call jwtService.sign with correct payload and return token and user DTO', async () => {
      const loginUser: User = { ...mockUser, organizationId: 'org-uuid-456' };
      const expectedPayload = {
        username: loginUser.email,
        sub: loginUser.id,
        role: loginUser.role,
        organizationId: loginUser.organizationId,
      };
      const expectedUserResponse: AuthUserResponse = {
        id: loginUser.id,
        email: loginUser.email,
        role: loginUser.role,
        organizationId: loginUser.organizationId,
      };

      const result = await service.login(loginUser);

      expect(jwtServiceMock.sign).toHaveBeenCalledWith(expectedPayload);
      expect(result.accessToken).toEqual('mockAccessToken');
      expect(result.user).toEqual(expectedUserResponse);
    });
  });

  describe('registerOrganization', () => {
    const mockOrgDto = {
        organizationName: 'New Org',
        organizationEmail: 'org@new.com',
        adminUser: {
            email: 'admin@new.com',
            password: 'Password123!',
            firstName: 'Admin',
            lastName: 'User',
        },
    };
    const mockCreatedOrg = { id: 'org-uuid', name: 'New Org', email: 'org@new.com' } as Organization;
    const mockCreatedAdminUser = { 
        id: 'admin-uuid', 
        email: 'admin@new.com', 
        role: UserRole.ORGANIZATION_ADMIN,
        organizationId: mockCreatedOrg.id,
        // ... other user fields
    } as User;

    beforeEach(() => {
        (organizationsServiceMock.createOrganization as jest.Mock).mockResolvedValue(mockCreatedOrg);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
        (usersServiceMock.createUserInternal as jest.Mock).mockResolvedValue(mockCreatedAdminUser);
        (organizationsServiceMock.setOwner as jest.Mock).mockResolvedValue(mockCreatedOrg); // Assume it returns the org
        // Mock the login part of registerOrganization
        jest.spyOn(service, 'login').mockResolvedValue({ 
            accessToken: 'newMockAccessToken', 
            user: {
                id: mockCreatedAdminUser.id,
                email: mockCreatedAdminUser.email,
                role: mockCreatedAdminUser.role,
                organizationId: mockCreatedAdminUser.organizationId,
            }
        });
    });

    it('should successfully register an organization and admin user', async () => {
        const result = await service.registerOrganization(mockOrgDto);

        expect(organizationsServiceMock.createOrganization).toHaveBeenCalledWith({
            name: mockOrgDto.organizationName,
            email: mockOrgDto.organizationEmail,
        });
        expect(bcrypt.hash).toHaveBeenCalledWith(mockOrgDto.adminUser.password, 10);
        expect(usersServiceMock.createUserInternal).toHaveBeenCalledWith({
            email: mockOrgDto.adminUser.email,
            password: 'hashedNewPassword',
            firstName: mockOrgDto.adminUser.firstName,
            lastName: mockOrgDto.adminUser.lastName,
            role: UserRole.ORGANIZATION_ADMIN,
            organizationId: mockCreatedOrg.id,
            isActive: true,
        });
        expect(organizationsServiceMock.setOwner).toHaveBeenCalledWith(mockCreatedOrg.id, mockCreatedAdminUser);
        expect(service.login).toHaveBeenCalledWith(mockCreatedAdminUser);
        expect(result.accessToken).toEqual('newMockAccessToken');
        expect(result.organization).toEqual(mockCreatedOrg);
        expect(result.user).toEqual(mockCreatedAdminUser);
    });

    // Add test for user creation failure and potential rollback logic if implemented
  });
});
