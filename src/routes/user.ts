import { FastifyPluginAsync } from 'fastify';
import {
  getUserSchema,
  getUserByIdSchema,
  updateUserSchema,
  getUsersSchema,
} from '../schemas/userSchema';

const userRoute: FastifyPluginAsync = async (fastify) => {
  // 현재 로그인한 사용자 정보 조회
  fastify.get('', {
    schema: getUserSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;

      const user = await fastify.userService.getCurrentUser(userId);
      return reply.send(user);
    },
  });

  // 특정 사용자 정보 조회
  fastify.get('/:id', {
    schema: getUserByIdSchema,
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };

      const user = await fastify.userService.getUserById(id);
      return reply.send(user);
    },
  });

  // 사용자 프로필 수정
  fastify.patch('', {
    schema: updateUserSchema,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const userData = request.body as { name?: string; image?: string | null };

      const updatedUser = await fastify.userService.updateUser(userId, userData);

      return reply.send({
        ...updatedUser,
        message: '프로필이 성공적으로 업데이트되었습니다.',
      });
    },
  });

  // 사용자 목록 조회
  fastify.get('/list', {
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

export default userRoute;
