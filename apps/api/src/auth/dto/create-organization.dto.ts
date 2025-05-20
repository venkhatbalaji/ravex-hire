// apps/api/src/auth/dto/create-organization.dto.ts
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateNested, Matches } from 'class-validator';

class AdminUserRegistrationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak. Must contain uppercase, lowercase, number, and special character.'
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}

export class CreateOrganizationRequestDto {
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @IsEmail()
  @IsNotEmpty()
  organizationEmail: string; // Email for the organization itself

  @ValidateNested()
  @Type(() => AdminUserRegistrationDto)
  @IsNotEmpty()
  adminUser: AdminUserRegistrationDto;
}
