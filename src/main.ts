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

// JWT 미들웨어 등록 (인증 필터)
await fastify.register(jwtMiddleware);

// 라우트 등록
await fastify.register(authRoute, { prefix: '/api' });
await fastify.register(twoFactorAuthRoute, { prefix: '/api' });

// health check api
fastify.get('/ping', async (request, reply) => {
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
