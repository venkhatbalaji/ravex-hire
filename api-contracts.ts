import {
  IsString,
  IsEmail,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsDateString,
  Matches,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Enums (Assuming these are defined elsewhere, e.g., in entities.ts or a shared types file) ---
// For the purpose of this file, let's redefine them or assume they are imported.
// If they are in entities.ts, the import would be:
// import { UserRole, EmploymentType, JobPostingStatus, ApplicationStatus } from './entities';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  CANDIDATE = 'CANDIDATE',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
}

export enum JobPostingStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DRAFT = 'DRAFT',
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  REVIEWING = 'REVIEWING',
  INTERVIEWING = 'INTERVIEWING',
  OFFERED = 'OFFERED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

// --- Placeholder for User entity type ---
// This would typically be imported from where User entity is defined.
export interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  // other user properties
}

// --- I. DTOs (Data Transfer Objects) ---

// 1. Organization Registration

export class AdminUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak. It must contain uppercase, lowercase, number, and special character.',
  })
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

export class CreateOrganizationRequestDto {
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ValidateNested()
  @Type(() => AdminUserDto)
  @IsNotEmpty()
  adminUser: AdminUserDto;
}

export class OrganizationResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string; // Organization's contact email

  @IsBoolean()
  isApproved: boolean;

  @IsUUID()
  ownerId: string;

  @Type(() => Date)
  createdAt: Date;
}

// 2. User Login

export class LoginRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthUserResponseDto {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsUUID()
  @IsOptional()
  organizationId?: string;
}
export class AuthTokenResponseDto {
  @IsString()
  accessToken: string;

  @ValidateNested()
  @Type(() => AuthUserResponseDto)
  user: AuthUserResponseDto;
}

// 3. Job Posting Creation

export class CreateJobPostingRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salaryMin?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  // TODO: Add custom validator for salaryMax > salaryMin if both present
  // @ValidateIf(o => o.salaryMin !== undefined && o.salaryMax !== undefined)
  // @GreaterThan('salaryMin', { message: 'salaryMax must be greater than salaryMin' })
  salaryMax?: number;

  @IsEnum(EmploymentType)
  @IsNotEmpty()
  employmentType: EmploymentType;

  @IsEnum(JobPostingStatus)
  @IsOptional()
  status?: JobPostingStatus = JobPostingStatus.DRAFT;

  @IsDateString()
  @IsOptional()
  // TODO: Add custom validator for future date
  expiresAt?: string;
}

export class JobPostingResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @IsNumber()
  @IsOptional()
  salaryMax?: number;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsEnum(JobPostingStatus)
  status: JobPostingStatus;

  @IsUUID()
  organizationId: string;

  @IsUUID()
  postedById: string;

  @Type(() => Date)
  createdAt: Date;

  @Type(() => Date)
  updatedAt: Date;

  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;
}

// 4. Candidate Application

export class CreateApplicationRequestDto {
  @IsUUID()
  @IsNotEmpty()
  jobPostingId: string;

  @IsString()
  @IsOptional()
  coverLetter?: string;

  @IsString()
  @IsOptional() // Assuming key to an uploaded file (e.g., S3 key)
  resumeFileKey?: string;
}

export class ApplicationResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  jobPostingId: string;

  @IsUUID()
  candidateProfileId: string;

  @IsUUID()
  organizationId: string;

  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @Type(() => Date)
  appliedAt: Date;

  @IsString()
  @IsOptional()
  coverLetter?: string;
}

// --- II. Service Interfaces (Illustrative examples) ---

export interface IAuthService {
  login(loginDto: LoginRequestDto): Promise<AuthTokenResponseDto>;
  registerOrganization(createOrgDto: CreateOrganizationRequestDto): Promise<OrganizationResponseDto>;
  validateUser(userId: string): Promise<User | null>; // User type from your entity
}

export interface IJobPostingService {
  createJobPosting(createDto: CreateJobPostingRequestDto, userId: string, organizationId: string): Promise<JobPostingResponseDto>;
  getJobPostingById(id: string, organizationId?: string): Promise<JobPostingResponseDto | null>;
  getJobPostingsByOrganization(organizationId: string): Promise<JobPostingResponseDto[]>;
  // Add other methods like update, delete, list with pagination etc.
}

// Example of a custom validator (conceptual, needs proper implementation)
// import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

// @ValidatorConstraint({ async: false })
// export class IsGreaterThanConstraint implements ValidatorConstraintInterface {
//   validate(value: any, args: ValidationArguments) {
//     const [relatedPropertyName] = args.constraints;
//     const relatedValue = (args.object as any)[relatedPropertyName];
//     if (relatedValue === undefined || value === undefined) {
//       return true; // Do not validate if one of the properties is missing
//     }
//     return typeof value === 'number' && typeof relatedValue === 'number' && value > relatedValue;
//   }

//   defaultMessage(args: ValidationArguments) {
//     const [relatedPropertyName] = args.constraints;
//     return `$property must be greater than ${relatedPropertyName}`;
//   }
// }

// export function GreaterThan(property: string, validationOptions?: ValidationOptions) {
//   return function (object: Object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName: propertyName,
//       options: validationOptions,
//       constraints: [property],
//       validator: IsGreaterThanConstraint,
//     });
//   };
// }
