import { FastifyPluginAsync } from 'fastify';
import {
  getUserMatchHistorySchema,
  getUserSchema,
  getUsersSchema,
  updateUserNameSchema,
  uploadImageSchema,
} from '../../schemas/user/userSchema';
import { MultipartFile } from '@fastify/multipart';
import { GlobalException } from '../../global/exceptions/globalException';
import { GlobalErrorCode } from '../../global/exceptions/globalException';

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
  fastify.post('/me', {
    schema: updateUserNameSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const { name } = request.body as { name: string };
      const user = await fastify.userService.updateUserName(userId, name);
      return reply.send(user);
    },
  });

  // 사용자 매치 히스토리 조회
  fastify.get('/me/matches/history', {
    schema: getUserMatchHistorySchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const query = request.query as { page: number; limit: number };
      const result = await fastify.matchService.getUserMatchHistory(userId, query);
      return reply.send(result);
    },
  });

  // 사용자 프로필 이미지 업로드
  fastify.post(
    '/me/image',
    {
      schema: uploadImageSchema,
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const userId = request.user.id;
      const body = request.body as { image: MultipartFile | MultipartFile[] };
      const data = Array.isArray(body.image) ? body.image[0] : body.image;
      if (!data) {
        throw new GlobalException(GlobalErrorCode.FILE_NOT_UPLOADED);
      }
      // 유저 서비스에 위임
      const result = await fastify.userService.uploadUserImage(userId, data);
      return reply.send({ image: result.image });
    },
  );

  // 사용자 목록 조회
  fastify.get('', {
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
};

export default userRoute;
