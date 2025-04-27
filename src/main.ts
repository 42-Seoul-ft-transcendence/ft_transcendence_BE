import Fastify from 'fastify';
import swagger from './plugins/swagger.js';
import prismaPlugin from './plugins/prismaPlugin.js';
import jwtMiddleware from './plugins/jwtMiddleware.js';
import authService from './plugins/auth/authService.js';
import googleAuthService from './plugins/auth/googleAuthService.js';
import twoFactorAuthService from './plugins/auth/twoFactorAuthService.js';
import authRoute from './routes/auth/auth';
import twoFactorAuthRoute from './routes/auth/twoFactorAuth';
import { exceptionHandler } from './global/exceptions/exceptionHandler.js';
import userService from './plugins/user/userService';
import userRoute from './routes/user/user';
import friendService from './plugins/user/friendService';
import friendRoute from './routes/user/friend';
import adminRoute from './routes/admin';
import adminService from './plugins/admin/adminService';
import tournamentRoute from './routes/tournament/tournament';
import tournamentService from './plugins/tournament/tournamentService';
import matchService from './plugins/tournament/matchService';
import fastifyWebsocket from '@fastify/websocket';
import matchRoutes from './routes/tournament/match';
import sensible from '@fastify/sensible';
import googleDrivePlugin from './plugins/googleDrive';
import userImageRoute from './routes/user/uploadProfileImage';
import multipart from '@fastify/multipart';

const fastify = Fastify({
  // logger: true,
});

// 글로벌 에러 핸들러 등록
fastify.setErrorHandler(exceptionHandler);

// 데이터베이스 연결
await fastify.register(prismaPlugin);

// Config 플러그인 등록
await fastify.register(swagger);
await fastify.register(fastifyWebsocket);
await fastify.register(jwtMiddleware);

await fastify.register(multipart, {
  limits: { fileSize: 100 * 1024 * 1024 },
});

// 서비스 플러그인 등록
await fastify.register(authService);
await fastify.register(googleAuthService);
await fastify.register(twoFactorAuthService);
await fastify.register(userService);
await fastify.register(friendService);
await fastify.register(adminService);
await fastify.register(tournamentService);
await fastify.register(matchService);
await fastify.register(sensible);
await fastify.register(googleDrivePlugin);

// 라우트 등록
await fastify.register(authRoute, { prefix: '/ft/api/auth' });
await fastify.register(twoFactorAuthRoute, { prefix: '/ft/api/auth' });
await fastify.register(userRoute, { prefix: '/ft/api/users' });
await fastify.register(userImageRoute, { prefix: '/ft/api/users' });
await fastify.register(friendRoute, { prefix: '/ft/api/friends' });
await fastify.register(adminRoute, { prefix: '/ft/api/admin' });
await fastify.register(tournamentRoute, { prefix: '/ft/api/tournaments' });
fastify.register(matchRoutes, { prefix: '/ft' });

// health check api
fastify.get('/ft/ping', async () => {
  return 'pong\n';
});

fastify.register(async function (fastify) {
  fastify.get('/ft/websocket', { websocket: true }, (socket) => {
    socket.on('message', () => {
      socket.send('hi from server');
    });
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

// // 라우트 확인
// await fastify.ready();
// console.log(fastify.printRoutes());
