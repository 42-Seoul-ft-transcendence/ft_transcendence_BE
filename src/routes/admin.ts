import { FastifyPluginAsync } from 'fastify';
import { generateAdminTokenSchema, getUsersSchema } from '../schemas/adminSchema';

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
  fastify.get('/users/list', {
    schema: getUsersSchema,
    handler: async (request, reply) => {
      const query = request.query as {
        page?: number;
        limit?: number;
        search?: string;
      };

      const result = await fastify.userService.getUsers(query);
      return reply.send(result);
    },
  });
};

export default adminRoute;
