// apps/api/src/auth/auth.controller.ts
import { Controller, Post, UseGuards, Request, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service'; // AuthUserResponse removed as it's an interface in service
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard'; // Import SessionAuthGuard
import { User } from '../users/entities/user.entity';
import { LoginRequestDto } from './dto/login.dto';
import { AuthTokenResponseDto } from './dto/auth-response.dto'; 
import { CreateOrganizationRequestDto } from './dto/create-organization.dto'; // New DTO
import { Organization } from '../organizations/entities/organization.entity'; // For type hint

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: { user: User }, @Body() loginDto: LoginRequestDto): Promise<AuthTokenResponseDto> {
    // loginDto is validated by class-validator pipe globally if applied
    const result = await this.authService.login(req.user as User); // req.user comes from LocalStrategy
    return {
      accessToken: result.accessToken,
      user: result.user, // This is AuthUserResponse from AuthService
    };
  }

  // New method for organization registration
  @Post('register-organization')
  @HttpCode(HttpStatus.CREATED)
  async registerOrganization(
    @Body() createOrganizationDto: CreateOrganizationRequestDto,
  ): Promise<{ organization: Organization; user: Omit<User, 'password'>; accessToken: string }> {
    // DTO is validated by class-validator pipe globally if applied
    const result = await this.authService.registerOrganization(createOrganizationDto);
    
    // Sanitize response: do not return full user entity with password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, candidateProfile, organization: userOrg, ownedOrganizations, ...userWithoutSensitiveData } = result.user;
    
    return {
      organization: result.organization, // Or an Organization DTO
      user: userWithoutSensitiveData,     // Or a User DTO
      accessToken: result.accessToken,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK) // Or HttpStatus.NO_CONTENT
  async logout(@Request() req): Promise<{ message: string }> {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // This case should ideally not be reached if SessionAuthGuard is effective
      throw new UnauthorizedException('Authorization header not found');
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      // Also should not be reached if SessionAuthGuard is effective
      throw new UnauthorizedException('Malformed token');
    }
    const token = parts[1];

    await this.authService.logout(token);
    return { message: 'Successfully logged out' };
  }
}
