// apps/api/src/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  // Basic length validation, more complex rules can be added if needed
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
