import 'fastify';
import { GoogleUserInfo } from './auth';
import { drive_v3 } from '@googleapis/drive';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: number;
    };
  }

  interface FastifyInstance {
    matchSockets: Map<string, Map<string, WebSocket>>;

    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    authService: {
      generateTokens(userId: number): { accessToken: string; refreshToken: string };

      refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
      }>;
    };

    googleAuthService: {
      getGoogleUserInfo(googleAccessToken: string): Promise<GoogleUserInfo>;
      findOrCreateUser(googleUser: GoogleUserInfo): Promise<{ user: any; isNewUser: boolean }>;
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

    userService: {
      getUserById(userId: number): Promise<any>;
      updateUser(userId: number, userData: { name?: string; image?: string | null }): Promise<any>;
      getUsers(options: { page: number; limit: number; search?: string }): Promise<{
        users: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>;
    };

    friendService: {
      sendFriendRequest(senderId: number, receiverName: string): Promise<any>;
      acceptFriendRequest(
        userId: number,
        requestId: number,
      ): Promise<{ success: boolean; message: string }>;
      declineFriendRequest(
        userId: number,
        requestId: number,
      ): Promise<{ success: boolean; message: string }>;
      deleteFriend(
        userId: number,
        friendId: number,
      ): Promise<{ success: boolean; message: string }>;
      getFriends(
        userId: number,
        options: { page: number; limit: number; search?: string },
      ): Promise<{
        friends: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>;
      getPendingFriendRequests(userId: number): Promise<{ requests: any[] }>;
    };

    adminAuthService: {
      generateTokenForUser(
        userId: number,
        adminPassword: string,
      ): Promise<{
        userId: number;
        userName: string;
        accessToken: string;
        refreshToken: string;
        message: string;
      }>;
    };

    // 토너먼트 서비스 추가
    tournamentService: {
      getTournaments(options: { page: number; limit: number; type: string }): Promise<{
        tournaments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>;

      createTournament(creatorId: number, data: { name: string; type: string }): Promise<any>;

      getTournament(id: number): Promise<any>;

      joinTournament(userId: number, tournamentId: number): Promise<any>;

      leaveTournament(userId: number, tournamentId: number);
    };

    matchService: {
      getMatches(options: { page: number; limit: number; status?: string }): Promise<{
        matches: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>;

      getUserMatchHistory(
        userId: number,
        options: { page: number; limit: number },
      ): Promise<{
        matches: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>;
    };

    googleDrive: drive_v3.Drive;
  }
}
