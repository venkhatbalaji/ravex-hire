// apps/api/src/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig, databaseConfig, redisConfig } from './config/configurations';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
      load: [appConfig, databaseConfig, redisConfig],
      envFilePath: ['.env.development.local', '.env.development', '.env'], // Load order
    }),
  ],
})
export class ConfigModule {}
