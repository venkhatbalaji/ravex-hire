// apps/api/src/auth/session.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { User } from '../users/entities/user.entity'; // Adjust path as needed

export interface SessionData {
  userId: string | number; // Or your User ID type
  // Add any other data you want to store in the session
  // e.g., roles, permissions, lastActivity
  iat?: number; // Issued at timestamp (from JWT)
  exp?: number; // Expiry timestamp (from JWT)
}

@Injectable()
export class SessionService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async createSession(token: string, sessionData: SessionData, ttl?: number): Promise<void> {
    // ttl is in seconds. If not provided, Redis might use a default or no expiry.
    // It's good to align this with JWT expiry if JWT is used as the token.
    const expiry = ttl || (sessionData.exp ? Math.max(0, sessionData.exp - Math.floor(Date.now() / 1000)) : 3600); // Default 1 hour
    if (expiry > 0) {
      await this.cacheManager.set(`session:${token}`, sessionData, expiry);
    }
    // If expiry is 0 or negative, don't set (or handle as an already expired session)
  }

  async getSession(token: string): Promise<SessionData | null> {
    return await this.cacheManager.get<SessionData>(`session:${token}`);
  }

  async deleteSession(token: string): Promise<void> {
    await this.cacheManager.del(`session:${token}`);
  }

  async refreshSession(token: string, sessionData: SessionData, ttl?: number): Promise<void> {
    // This is essentially creating it again, potentially with a new TTL
    await this.createSession(token, sessionData, ttl);
  }
}
