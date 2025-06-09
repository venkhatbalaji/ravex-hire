import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  validateOAuthLogin(profile: any) {
    // TODO: Implement JWT generation and Redis session storage
    return `jwt-token-for-${profile.id}`;
  }
}
