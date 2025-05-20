// apps/api/src/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Tell passport 'email' is the username field
  }

  async validate(email: string, pass: string): Promise<Omit<User, 'password' | 'candidateProfile' | 'organization'>> {
    // The 'password' field is stripped from the User object by authService.validateUser
    // The 'candidateProfile' and 'organization' are also stripped now.
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
