import { FastifyPluginAsync } from 'fastify';
import { generateAdminTokenSchema, getUsersSchema } from '../schemas/adminSchema.js';
import { getMatchesSchema } from '../schemas/adminSchema.js';

const adminRoute: FastifyPluginAsync = async (fastify) => {
  // 어드민 토큰 생성 엔드포인트 (테스트용)
  fastify.post('/token', {
    schema: generateAdminTokenSchema,
    handler: async (request, reply) => {
      const { userId, adminPassword } = request.body as { userId: number; adminPassword: string };

      const result = await fastify.adminAuthService.generateTokenForUser(userId, adminPassword);
      return reply.send(result);
    },
  });

  // 사용자 목록 조회
  fastify.get('/users', {
    schema: getUsersSchema,
    handler: async (request, reply) => {
      const query = request.query as {
        page: number;
        limit: number;
        search?: string;
      };

      const result = await fastify.userService.getUsers(query);
      return reply.send(result);
    },
  });

  // 매치 목록 조회
  fastify.get('/matches', {
    schema: getMatchesSchema,
    handler: async (request, reply) => {
      const query = request.query as {
        page: number;
        limit: number;
        status?: string;
      };

      const result = await fastify.matchService.getMatches(query);
      return reply.send(result);
    },
  });
};

export default adminRoute;
