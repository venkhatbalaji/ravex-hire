// apps/api/src/cache/cache.module.ts
import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true, // Make CacheModule global
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get('redis'); // This expects 'redis' key from config
        if (!redisConfig || !redisConfig.host || redisConfig.port === undefined) {
          throw new Error('Redis configuration (redis.host, redis.port) not found or incomplete.');
        }
        return {
          store: redisStore,
          host: redisConfig.host,
          port: redisConfig.port,
          // password: redisConfig.password, // if applicable
          // ttl: redisConfig.ttl, // default TTL for items
        };
      },
      inject: [ConfigService], // Inject ConfigService
    }),
  ],
  exports: [NestCacheModule], // Export NestCacheModule if other modules need to import CacheModule specifically
})
export class AppCacheModule {} // Renamed to avoid conflict if there's another CacheModule
