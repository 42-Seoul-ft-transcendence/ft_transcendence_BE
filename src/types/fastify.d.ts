import 'fastify';
import { GoogleUserInfo } from './auth';
import { drive_v3 } from '@googleapis/drive';
import { GameState, PaddleDirection } from './game';

type DriveClient = ReturnType<typeof google.drive>;

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: number;
    };
  }

  interface FastifyInstance {
    matchSockets: Map<number, Map<number, WebSocket>>;
    matchStates: Map<number, GameState>;
    gameIntervals: Map<number, NodeJS.Timeout>;
    playerAuthenticated: Map<number, Set<number>>;
    paddleDirections: Map<number, Map<number, PaddleDirection>>;

    gameService: {
      validateMatchParticipation(matchId: number, userId: number): Promise<void>;
      registerPlayerConnection(matchId: number, userId: number, socket: any): Promise<void>;
      authenticatePlayer(matchId: number, userId: number): Promise<{ isGameReady: boolean }>;
      updatePaddleDirection(matchId: number, userId: number, direction: PaddleDirection): void;
      handlePlayerDisconnect(matchId: number, userId: number): void;
      cleanupMatch(matchId: number): void;
      initGameState(matchId: number): Promise<void>;
      startMatch(matchId: number): Promise<void>;
      updateGameLoop(matchId: number): void;
      checkPauseState(matchId: number, gameState: GameState): boolean;
      updatePaddles(matchId: number, gameState: GameState): void;
      updateBallPosition(gameState: GameState): void;
      checkPaddleCollisions(gameState: GameState): void;
      checkScoring(matchId: number, gameState: GameState): void;
      checkGameOver(matchId: number, gameState: GameState): void;
      resetBall(gameState: GameState): void;
      endGame(matchId: number): Promise<void>;
      updateMatchResults(matchId: number, gameState: GameState): Promise<void>;
      updatePlayerStats(winnerId: number, loserId: number): Promise<void>;
      broadcastGameState(matchId: number): void;
      broadcastToMatch(matchId: number, message: any): void;
    };

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
      updateUserName(userId: number, name: string): Promise<any>;
      getUsers(options: { page: number; limit: number; search?: string }): Promise<{
        users: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>;
      uploadUserImage(userId: number, file: MultipartFile): Promise<{ image: string }>;
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

    googleDrive: { drive: DriveClient };

    googleDriveService: {
      uploadFile(name: string, buffer: Buffer, mimeType: string, folderId: string): Promise<string>;
    };

    googleDrive: drive_v3.Drive;

    awsS3: {
      s3: S3Client;
    };

    awsS3Service: {
      uploadFile(
        fileName: string,
        buffer: Buffer,
        mimeType: string,
        folder?: string,
      ): Promise<string>;

      uploadUserImage(userId: number, file: MultipartFile): Promise<string>;
    };
  }
}
