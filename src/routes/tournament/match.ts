import { FastifyPluginAsync } from 'fastify';
import {
  createMatchSchema,
  getMatchSchema,
  getMatchStateSchema,
  updateMatchStateSchema,
  getUserMatchHistorySchema,
} from '../../schemas/tournament/matchSchema';

const matchRoute: FastifyPluginAsync = async (fastify) => {
  // 매치 생성
  fastify.post('', {
    schema: createMatchSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const body = request.body as {
        player2Id: number;
        tournamentMatchId?: number;
      };

      const result = await fastify.matchService.createMatch(userId, body);
      return reply.send(result);
    },
  });

  // 매치 상세 조회
  fastify.get('/:id', {
    schema: getMatchSchema,
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };

      const result = await fastify.matchService.getMatch(id);
      return reply.send(result);
    },
  });

  // 매치 상태 조회
  fastify.get('/:id/state', {
    schema: getMatchStateSchema,
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };

      const result = await fastify.matchService.getMatchState(id);
      return reply.send(result);
    },
  });

  // 매치 상태 업데이트
  fastify.patch('/:id/state', {
    schema: updateMatchStateSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const { id } = request.params as { id: number };
      const body = request.body as {
        status?: string;
        player1Score?: number;
        player2Score?: number;
        gameState?: any;
      };

      const result = await fastify.matchService.updateMatchState(id, userId, body);
      return reply.send(result);
    },
  });

  // 사용자 매치 히스토리 조회
  fastify.get('/history', {
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

export default matchRoute;
