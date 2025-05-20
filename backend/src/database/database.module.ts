// apps/api/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule as AppConfigModule } from '../config.module'; // Alias to avoid name collision if needed
import { TypeOrmConfigService } from './typeorm.config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // imports: [AppConfigModule], // Explicitly import ConfigModule if it's not global.
                                  // Since our AppConfigModule IS global, this is not strictly needed
                                  // for ConfigService to be injectable in TypeOrmConfigService.
                                  // However, keeping it can be a good practice for module dependency clarity.
                                  // For this task, assuming ConfigModule is correctly set up as global.
      useClass: TypeOrmConfigService,
    }),
  ],
})
export class DatabaseModule {}
