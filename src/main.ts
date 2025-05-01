import Fastify from 'fastify';
import swagger from './plugins/swagger.js';
import prismaPlugin from './plugins/prismaPlugin.js';
import jwtMiddleware from './plugins/jwtMiddleware.js';
import authService from './plugins/auth/authService.js';
import googleAuthService from './plugins/auth/googleAuthService.js';
import twoFactorAuthService from './plugins/auth/twoFactorAuthService.js';
import userService from './plugins/user/userService';
import friendService from './plugins/user/friendService';
import adminService from './plugins/admin/adminService';
import tournamentService from './plugins/tournament/tournamentService';
import matchService from './plugins/tournament/matchService';
import gameService from './plugins/tournament/gameService';
import googleDrivePlugin from './plugins/googleDrivePlugin';
import googleDriveService from './plugins/user/googleDriveService';
import cors from '@fastify/cors';
import authRoute from './routes/auth/auth';
import twoFactorAuthRoute from './routes/auth/twoFactorAuth';
import userRoute from './routes/user/user';
import friendRoute from './routes/user/friend';
import adminRoute from './routes/admin';
import tournamentRoute from './routes/tournament/tournament';
import matchRoutes from './routes/tournament/match';
import fastifyWebsocket from '@fastify/websocket';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { ajvFilePlugin } from '@fastify/multipart';
import { exceptionHandler } from './global/exceptions/exceptionHandler.js';
import { GameState, PaddleDirection } from './types/game';

const fastify = Fastify({
  // logger: true,
  ajv: { plugins: [ajvFilePlugin] },
});

// 글로벌 에러 핸들러
fastify.setErrorHandler(exceptionHandler);

fastify.decorate('matchSockets', new Map<number, Map<number, WebSocket>>());
fastify.decorate('matchStates', new Map<number, GameState>());
fastify.decorate('gameIntervals', new Map<number, NodeJS.Timeout>());
fastify.decorate('playerAuthenticated', new Map<number, Set<number>>());
fastify.decorate('paddleDirections', new Map<number, Map<number, PaddleDirection>>());

// 데이터베이스 연결
await fastify.register(prismaPlugin);

// Config 플러그인 등록
await fastify.register(swagger);
await fastify.register(fastifyWebsocket);
await fastify.register(jwtMiddleware);

// Auth 관련 서비스
await fastify.register(authService);
await fastify.register(googleAuthService);
await fastify.register(twoFactorAuthService);

// Google Drive 플러그인 & 서비스
await fastify.register(multipart, {
  attachFieldsToBody: true,
  limits: { fileSize: 100 * 1024 * 1024 },
});
await fastify.register(googleDrivePlugin);
await fastify.register(googleDriveService);

// User/Friend/Admin 서비스
await fastify.register(userService);
await fastify.register(friendService);
await fastify.register(adminService);

// Tournament/Match/Game 서비스
await fastify.register(tournamentService);
await fastify.register(matchService);
await fastify.register(gameService);

// 7) 기타 유틸
await fastify.register(sensible);

// 라우트 등록
await fastify.register(authRoute, { prefix: '/ft/api/auth' });
await fastify.register(twoFactorAuthRoute, { prefix: '/ft/api/auth' });
await fastify.register(userRoute, { prefix: '/ft/api/users' });
await fastify.register(friendRoute, { prefix: '/ft/api/friends' });
await fastify.register(adminRoute, { prefix: '/ft/api/admin' });
await fastify.register(tournamentRoute, { prefix: '/ft/api/tournaments' });
await fastify.register(matchRoutes, { prefix: '/ft' });

// CORS 설정 등록
await fastify.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://back-coffeego.com',
      'http://localhost:8083',
      'http://localhost:5173',
      'http://localhost:5174',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      // 허용된 출처
      callback(null, true);
    } else {
      // 허용되지 않은 출처
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // 허용할 HTTP 메서드
  credentials: true, // 쿠키 허용 여부
});

// Health check & 기본 WebSocket 테스트
fastify.get('/ft/ping', async () => 'pong\n');

fastify.register(async (f) => {
  f.get('/ft/websocket', { websocket: true }, (socket) => {
    socket.on('message', () => socket.send('hi from server'));
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 8083, host: '0.0.0.0' });
    console.log('Server Start!!');
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
