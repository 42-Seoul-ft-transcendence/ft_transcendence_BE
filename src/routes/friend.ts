import { FastifyPluginAsync } from 'fastify';
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
  deleteFriendSchema,
  getFriendsSchema,
  getPendingFriendRequestsSchema,
} from '../schemas/friendSchema';

const friendRoute: FastifyPluginAsync = async (fastify) => {
  // 친구 요청 보내기
  fastify.post('/request', {
    schema: sendFriendRequestSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const { receiverName } = request.body as { receiverName: string };

      const result = await fastify.friendService.sendFriendRequest(userId, receiverName);
      return reply.send(result);
    },
  });

  // 친구 요청 응답 (수락/거절)
  fastify.put('/request/:requestId', {
    schema: respondFriendRequestSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const { requestId } = request.params as { requestId: number };
      const { action } = request.body as { action: 'accept' | 'decline' };

      let result;
      if (action === 'accept') {
        result = await fastify.friendService.acceptFriendRequest(userId, requestId);
      } else {
        result = await fastify.friendService.declineFriendRequest(userId, requestId);
      }

      return reply.send(result);
    },
  });

  // 친구 삭제
  fastify.delete('/:friendId', {
    schema: deleteFriendSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const { friendId } = request.params as { friendId: number };

      const result = await fastify.friendService.deleteFriend(userId, friendId);
      return reply.send(result);
    },
  });

  // 친구 목록 조회
  fastify.get('', {
    schema: getFriendsSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const query = request.query as {
        page?: number;
        limit?: number;
        search?: string;
      };

      const result = await fastify.friendService.getFriends(userId, query);
      return reply.send(result);
    },
  });

  // 받은 친구 요청 목록 조회
  fastify.get('/requests/pending', {
    schema: getPendingFriendRequestsSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;

      const result = await fastify.friendService.getPendingFriendRequests(userId);
      return reply.send(result);
    },
  });
};

export default friendRoute;
