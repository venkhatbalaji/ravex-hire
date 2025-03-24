import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ example: 'Frontend Developer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Build and maintain React applications' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Remote' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  tenantId: number;
}
