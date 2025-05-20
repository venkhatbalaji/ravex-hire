// apps/api/src/auth/auth.controller.ts
import { Controller, Post, UseGuards, Request, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service'; // AuthUserResponse removed as it's an interface in service
import { LocalAuthGuard } from './guards/local-auth.guard'; 
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
}
