// apps/api/src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common'; 
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OrganizationsModule } from '../organizations/organizations.module';
import { CoreModule } from '../../core/core.module'; // Import CoreModule
import { SessionService } from './session.service'; // Import SessionService
import { SessionAuthGuard } from './guards/session-auth.guard'; // Import SessionAuthGuard

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), 
    JwtModule.registerAsync({
      imports: [ConfigModule], 
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('jwtSecret'); 
        const jwtExpiresIn = configService.get<string>('jwtExpiresIn'); 
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: jwtExpiresIn },
        };
      },
      inject: [ConfigService],
    }),
    OrganizationsModule, 
    CoreModule, // Add CoreModule here to make TenantContextService available
    // ConfigModule itself is already global from AppModule
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, SessionService, SessionAuthGuard], // Add SessionAuthGuard to providers
  exports: [AuthService, JwtModule, SessionService], // SessionAuthGuard is not exported by default
})
export class AuthModule {}
