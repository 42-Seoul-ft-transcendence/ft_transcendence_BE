// src/types/fastify.d.ts
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: number;
    };
  }

  interface FastifyInstance {
    authService: {
      generateTokens(userId: number): { accessToken: string; refreshToken: string };
    };
    googleAuthService: {
      getGoogleUserInfo(googleAccessToken: string): Promise<any>;
      findOrCreateUser(googleUser: any): Promise<{ user: any; isNewUser: boolean }>;
    };
  }
}
