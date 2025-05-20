// apps/api/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // Import UsersController
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule, // Add AuthModule to imports
  ],
  controllers: [UsersController], // Add UsersController to controllers
  providers: [UsersService],
  exports: [UsersService], // Export UsersService for use in other modules (e.g., AuthModule)
})
export class UsersModule {}
