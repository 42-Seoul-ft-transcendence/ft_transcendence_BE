import Fastify from 'fastify';
import swagger from './plugins/swagger.js';
import prismaPlugin from './plugins/prismaPlugin.js';
import jwtMiddleware from './plugins/jwtMiddleware.js';
import authRoute from './routes/auth.js';
import authService from './plugins/auth/authService';
import googleAuthService from './plugins/auth/googleAuthService';

const fastify = Fastify({
  logger: true,
});

await fastify.register(prismaPlugin);

await fastify.register(swagger);

// Services
await fastify.register(authService);
await fastify.register(googleAuthService);

// JWT 미들웨어 등록 (인증 필터)
await fastify.register(jwtMiddleware);

// 라우트
await fastify.register(authRoute, { prefix: '/api' });

// health check api
fastify.get('/ping', async (request, reply) => {
  return 'pong\n';
});

const start = async () => {
  try {
    await fastify.listen({ port: 8083 });
    console.log('Server Start!!');
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
