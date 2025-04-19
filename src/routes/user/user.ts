import { FastifyPluginAsync } from 'fastify';
import { getUserSchema, getUserByIdSchema, updateUserSchema } from '../../schemas/user/userSchema';

const userRoute: FastifyPluginAsync = async (fastify) => {
  // 현재 로그인한 사용자 정보 조회
  fastify.get('', {
    schema: getUserSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const user = await fastify.userService.getUserById(userId);
      return reply.send(user);
    },
  });

  // 사용자 프로필 수정
  fastify.patch('', {
    schema: updateUserSchema,
    handler: async (request) => {
      const userId = request.user.id;
      const userData = request.body as { name?: string; image?: string | null };
      await fastify.userService.updateUser(userId, userData);
    },
  });
};

export default userRoute;
