import Fastify from 'fastify';
import swagger from './plugins/swagger.js';
import prismaPlugin from './plugins/prismaPlugin.js';
import authRoute from './routes/auth.js';
import jwtMiddleWare from './plugins/jwtMiddleware.js';

const fastify = Fastify({
  logger: true,
});

// Swagger 플러그인 등록
await fastify.register(swagger);
await fastify.register(prismaPlugin); // <-- 이게 먼저여도 괜찮지만
await fastify.register(jwtMiddleWare);
await fastify.register(authRoute); // 이건 반드시 등록되어야 함!

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
