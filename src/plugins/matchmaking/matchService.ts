// src/plugins/matchmaking/matchService.ts
import prisma from '../../global/db/prisma';
import { MatchQueue, MATCH_CAPACITY } from './matchQueue';
import { MatchMode, Player } from '../../types/matchMaking';
import { SocketServer } from '../socket';

const queue = new MatchQueue();

queue.on('ready', async (mode: MatchMode) => {
  const capacity = MATCH_CAPACITY[mode];
  const players = queue.getReadyPlayers(mode);

  // 해당 모드 정원만큼 채워졌는지 확인
  if (players.length < capacity) return;

  // 큐에서 해당 인원 제거
  queue.popPlayers(mode, players);

  const match = await prisma.match.create({
    data: {
      mode,
      players: {
        connect: players.map((p) => ({ id: p.id })),
      },
    },
    include: {
      players: true,
    },
  });

  // User 모델에 status 필드(enum UserStatus)가 추가된 상태여야 함.
  await prisma.user.updateMany({
    where: {
      id: { in: players.map((p) => p.id) },
    },
    data: {
      status: 'IN_GAME',
    },
  });

  // 매치 시작 푸시
  players.forEach((p) => {
    SocketServer.to(p.socketId).emit('match-started', {
      matchId: match.id,
      players: match.players,
    });
  });
});

export const matchmakingService = {
  join: (mode: MatchMode, player: Player) => {
    queue.addPlayer(mode, player);
  },
  leave: (playerId: number) => {
    queue.removePlayer(playerId);
  },
};
