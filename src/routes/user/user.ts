import { FastifyPluginAsync } from 'fastify';
import {
  getUserMatchHistorySchema,
  getUserSchema,
  updateUserSchema,
} from '../../schemas/user/userSchema';

const userRoute: FastifyPluginAsync = async (fastify) => {
  // 현재 로그인한 사용자 정보 조회
  fastify.get('/me', {
    schema: getUserSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const user = await fastify.userService.getUserById(userId);
      return reply.send(user);
    },
  });

  // 사용자 프로필 이름 수정
  fastify.patch('/me', {
    schema: updateUserSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const userData = request.body as { name?: string };
      const user = await fastify.userService.updateUser(userId, userData);
      return reply.send(user);
    },
  });

  // 사용자 매치 히스토리 조회
  fastify.get('/me/matches/history', {
    schema: getUserMatchHistorySchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const query = request.query as {
        page: number;
        limit: number;
      };

      const result = await fastify.matchService.getUserMatchHistory(userId, query);
      return reply.send(result);
    },
  });
};

export default userRoute;
