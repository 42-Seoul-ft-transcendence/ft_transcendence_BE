import Fastify from 'fastify';
import swagger from './plugins/swagger.js';
import prismaPlugin from './plugins/prismaPlugin.js';
import jwtMiddleware from './plugins/jwtMiddleware.js';
import authService from './plugins/auth/authService.js';
import googleAuthService from './plugins/auth/googleAuthService.js';
import twoFactorAuthService from './plugins/auth/twoFactorAuthService.js';
import authRoute from './routes/auth.js';
import twoFactorAuthRoute from './routes/twoFactorAuth.js';
import { exceptionHandler } from './global/exceptions/exceptionHandler.js';
import userService from './plugins/user/userService';
import userRoute from './routes/user';
import friendService from './plugins/user/friendService';
import friendRoute from './routes/friend';
import adminRoute from './routes/admin';
import adminService from './plugins/admin/adminService';
import tournamentRoute from './routes/tournament';
import tournamentService from './plugins/tournament/tournamentService';

const fastify = Fastify({
  // logger: true,
});

// 글로벌 에러 핸들러 등록
fastify.setErrorHandler(exceptionHandler);

// 데이터베이스 연결
await fastify.register(prismaPlugin);

// Swagger 문서화
await fastify.register(swagger);

// 서비스 플러그인 등록
await fastify.register(authService);
await fastify.register(googleAuthService);
await fastify.register(twoFactorAuthService);
await fastify.register(userService);
await fastify.register(friendService);
await fastify.register(adminService);
await fastify.register(tournamentService);

// JWT 미들웨어 등록 (인증 필터)
await fastify.register(jwtMiddleware);

// 라우트 등록
await fastify.register(authRoute, { prefix: '/ft/api/auth' });
await fastify.register(twoFactorAuthRoute, { prefix: '/ft/api/auth' });
await fastify.register(userRoute, { prefix: '/ft/api/users' });
await fastify.register(friendRoute, { prefix: '/ft/api/friends' });
await fastify.register(adminRoute, { prefix: '/ft/api/admin' });
await fastify.register(tournamentRoute, { prefix: '/ft/api/tournaments' });


// 라우트 등록


// health check api
fastify.get('/ft/ping', async () => {
  return 'pong\n';
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
