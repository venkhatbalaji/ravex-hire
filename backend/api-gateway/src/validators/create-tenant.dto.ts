import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Rave X' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ravex' })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiProperty({ example: 'Venkhat Balaji' })
  @IsString()
  @IsNotEmpty()
  adminName: string;

  @ApiProperty({ example: 'admin@ravex.io' })
  @IsEmail()
  adminEmail: string;
}
