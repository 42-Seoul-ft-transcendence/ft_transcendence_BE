import { fastifyPlugin } from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'ft_transcendence 스웨거',
        description: '탁구 게임의 사용자, 매치, 토너먼트 관리를 위한 API',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:8083',
          description: '개발 서버',
        },
        {
          url: 'https://api.example.com',
          description: '프로덕션 서버',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
});
