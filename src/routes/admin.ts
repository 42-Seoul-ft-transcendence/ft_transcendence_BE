import { FastifyPluginAsync } from 'fastify';
import { generateAdminTokenSchema } from '../schemas/adminSchema';

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
};

export default adminRoute;
