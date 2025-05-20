// apps/api/src/auth/dto/auth-response.dto.ts
import { UserRole } from '../../users/entities/user.entity'; // Path to UserRole enum

// This DTO is used within AuthTokenResponseDto
export class AuthUserDto {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

export class AuthTokenResponseDto {
  accessToken: string;
  user: AuthUserDto;
}
