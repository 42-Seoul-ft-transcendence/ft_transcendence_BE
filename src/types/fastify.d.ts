import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number;
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

    twoFactorAuthService: {
      setupTwoFactor(userId: number): Promise<{
        secret: string;
        qrCodeUrl: string;
      }>;

      verifyAndEnableTwoFactor(
        userId: number,
        token: string,
        secret: string,
      ): Promise<{
        success: boolean;
        backupCodes?: string[];
      }>;

      verifyTwoFactorAuth(
        userId: number,
        token: string,
      ): Promise<{
        accessToken: string;
        refreshToken: string;
      }>;

      disableTwoFactor(userId: number): Promise<{
        success: boolean;
      }>;
    };
  }
}
