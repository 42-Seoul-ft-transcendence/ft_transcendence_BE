import Fastify from 'fastify';
import swagger from './plugins/swagger.js';
import prismaPlugin from './plugins/prismaPlugin.js';
import jwtMiddleware from './plugins/jwtMiddleware.js';
import authRoute from './routes/auth.js';

const fastify = Fastify({
  logger: true,
});

// Swagger 플러그인 등록
await fastify.register(swagger);

// Prisma 플러그인
await fastify.register(prismaPlugin);

// JWT 미들웨어 등록 (인증 필터)
await fastify.register(jwtMiddleware);

// 라우트
await fastify.register(authRoute);

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
