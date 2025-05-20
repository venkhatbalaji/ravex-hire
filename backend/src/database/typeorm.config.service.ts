// apps/api/src/database/typeorm.config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbConfig = this.configService.get('database'); // Uses the 'database' key from configurations.ts
    if (!dbConfig) {
      throw new Error('Database configuration not found. Ensure it is loaded by ConfigModule.');
    }
    return {
      ...dbConfig,
      autoLoadEntities: true, // Automatically load entities registered via forFeature()
    };
  }
}
