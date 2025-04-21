import { FastifyPluginAsync } from 'fastify';
import {
  getTournamentsSchema,
  createTournamentSchema,
  getTournamentSchema,
  joinTournamentSchema,
  leaveTournamentSchema,
} from '../../schemas/tournament/tournamentSchema';

const tournamentRoute: FastifyPluginAsync = async (fastify) => {
  // 토너먼트 목록 조회
  fastify.get('', {
    schema: getTournamentsSchema,
    handler: async (request, reply) => {
      const query = request.query as {
        page: number;
        limit: number;
        type: string;
      };

      const result = await fastify.tournamentService.getTournaments(query);
      return reply.send(result);
    },
  });

  // 토너먼트 생성
  fastify.post('', {
    schema: createTournamentSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const body = request.body as {
        name: string;
        type: string;
      };

      const result = await fastify.tournamentService.createTournament(userId, body);
      return reply.send(result);
    },
  });

  // 토너먼트 상세 조회
  fastify.get('/:id', {
    schema: getTournamentSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };

      const result = await fastify.tournamentService.getTournament(id);
      return reply.send(result);
    },
  });

  // 토너먼트 참가
  fastify.post('/:id/join', {
    schema: joinTournamentSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const { id } = request.params as { id: number };

      const result = await fastify.tournamentService.joinTournament(userId, id);
      return reply.send(result);
    },
  });

  // 토너먼트 탈퇴
  fastify.delete('/:id/join', {
    schema: leaveTournamentSchema,
    preHandler: fastify.authenticate,
    handler: async (request) => {
      const userId = request.user.id;
      const { id } = request.params as { id: number };
      await fastify.tournamentService.leaveTournament(userId, id);
    },
  });
};

export default tournamentRoute;
