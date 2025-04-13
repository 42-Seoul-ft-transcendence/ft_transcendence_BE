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
        version: '1.0.0',
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
      security: [{ bearerAuth: [] }],
      // 태그 순서 지정
      tags: [
        { name: 'Admin', description: '관리자 기능' },
        { name: 'Auth', description: '인증 관련 기능' },
        { name: 'User', description: '사용자 관리' },
        { name: 'Friend', description: '친구 관리' },
      ],
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
