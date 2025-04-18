// src/routes/matchMaking.ts
import { FastifyInstance } from 'fastify';
import { matchmakingService } from '../plugins/matchmaking/matchService';
import { MatchMode } from '../types/matchMaking';

export default async function matchMakingRoutes(fastify: FastifyInstance) {
  // join API
  fastify.post<{
    Body: { userId: number; socketId: string; mode: MatchMode };
  }>('/matchmaking/join', async (request, reply) => {
    const { userId, mode, socketId } = request.body;
    matchmakingService.join(mode, { id: userId, socketId });
    reply.send({ status: 'queued' });
  });

  // leave API
  fastify.delete<{
    Body: { userId: number };
  }>('/matchmaking/leave', async (request, reply) => {
    const { userId } = request.body;
    matchmakingService.leave(userId);
    reply.send({ status: 'left' });
  });
}
