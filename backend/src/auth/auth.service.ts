// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { OrganizationsService } from '../organizations/organizations.service'; // New import
import { CreateOrganizationRequestDto } from './dto/create-organization.dto'; // New DTO
import { SessionService, SessionData } from './session.service'; // Import SessionService
import { Organization } from '../organizations/entities/organization.entity'; // For type hint

export interface AuthUserResponse { 
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private organizationsService: OrganizationsService, // Inject OrganizationsService
    private sessionService: SessionService, // Inject SessionService
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password' | 'candidateProfile' | 'organization' | 'ownedOrganizations'>> {
    const user = await this.usersService.findUserByEmail(email);
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, candidateProfile, organization, ownedOrganizations, ...result } = user; // Ensure all relations are stripped
      return result;
    }
    return null;
  }

  async login(user: User): Promise<{ accessToken: string; user: AuthUserResponse }> {
    const payload = {
      username: user.email, 
      sub: user.id,         
      role: user.role,
      organizationId: user.organizationId, 
    };
    this.logger.log(`Generating token for user: ${user.email}, role: ${user.role}, orgId: ${user.organizationId}`);
    const accessToken = this.jwtService.sign(payload);

    // Store session in Redis
    const decodedToken = this.jwtService.decode(accessToken) as { exp?: number; iat?: number; sub: string | number };
    const sessionData: SessionData = {
      userId: decodedToken.sub, // 'sub' from JWT payload is user.id
      iat: decodedToken.iat,
      exp: decodedToken.exp,
      // You could add other details like user.role, user.organizationId to SessionData if needed
    };

    const ttl = decodedToken.exp ? decodedToken.exp - Math.floor(Date.now() / 1000) : undefined;
    if (ttl === undefined || ttl > 0) { // if no expiry or token is not yet expired
      await this.sessionService.createSession(accessToken, sessionData, ttl);
    }
    // if ttl <=0, token is already expired, session will not be created by sessionService or will be for 0s.

    const userResponse: AuthUserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
    return {
      accessToken,
      user: userResponse,
    };
  }

  async logout(token: string): Promise<void> {
    await this.sessionService.deleteSession(token);
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; 
    return bcrypt.hash(password, saltRounds);
  }

  // New method for organization registration
  async registerOrganization(
    dto: CreateOrganizationRequestDto,
  ): Promise<{ organization: Organization; user: User; accessToken: string }> {
    this.logger.log(`Attempting to register organization: ${dto.organizationName}`);

    // 1. Create the Organization
    const organization = await this.organizationsService.createOrganization({
      name: dto.organizationName,
      email: dto.organizationEmail,
      // Add other fields like contactPhone, address if they are in DTO and service method
    });
    this.logger.log(`Organization ${organization.name} created with ID ${organization.id}`);

    // 2. Hash password for the admin user
    const hashedPassword = await this.hashPassword(dto.adminUser.password);
    this.logger.log(`Password hashed for admin of ${organization.name}`);

    // 3. Create the Organization Admin User
    let adminUser: User;
    try {
      adminUser = await this.usersService.createUserInternal({
        email: dto.adminUser.email,
        password: hashedPassword,
        firstName: dto.adminUser.firstName,
        lastName: dto.adminUser.lastName,
        role: UserRole.ORGANIZATION_ADMIN,
        organizationId: organization.id, // Link user to the organization
        isActive: true, // Default to active, or false pending email verification
      });
      this.logger.log(`Admin user ${adminUser.email} created for organization ${organization.name}`);
    } catch (error) {
      this.logger.error(`User creation failed for ${dto.adminUser.email}. Error: ${error.message}. MANUAL ROLLBACK of organization ${organization.id} might be needed.`);
      // In a real app, implement proper transaction management or a saga pattern for rollback
      // For now, we'll re-throw. Consider deleting the created organization if user creation fails.
      // e.g., if (organization && organization.id) { await this.organizationsService.deleteOrganization(organization.id); }
      // This would require a deleteOrganization method in OrganizationsService.
      throw error; 
    }

    // 4. Set the owner of the organization
    // Note: The organization entity already has ownerId set. This step ensures the 'owner' relation is populated.
    // The OrganizationsService.setOwner also saves the organization again.
    await this.organizationsService.setOwner(organization.id, adminUser);
    this.logger.log(`Admin user ${adminUser.email} set as owner for organization ${organization.name}`);
    
    // 5. Log in the newly created admin user and return token
    // The adminUser object from createUserInternal should be complete enough for login.
    const loginResult = await this.login(adminUser); 
    this.logger.log(`Admin user ${adminUser.email} logged in after registration.`);

    return {
      organization, // Return the full organization object
      user: adminUser, // Return the full admin user object (password will be stripped by controller if needed)
      accessToken: loginResult.accessToken,
    };
  }
}
