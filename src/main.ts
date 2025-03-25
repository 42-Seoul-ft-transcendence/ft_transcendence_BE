import Fastify from 'fastify';
import swagger from './plugins/swagger.js';

const fastify = Fastify({
  logger: true,
});

// Swagger 플러그인 등록
await fastify.register(swagger);

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
