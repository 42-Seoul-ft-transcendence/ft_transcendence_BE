import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { GlobalException, GlobalErrorCode } from '../../global/exceptions/globalException';

export default fp(async (fastify: FastifyInstance) => {
  // 의존성 확인
  if (!fastify.prisma) {
    throw new Error('Prisma plugin is required for tournamentMatchService');
  }

  // 토너먼트 매치 생성 헬퍼 함수
  const createTournamentBracket = async (tournamentId: number) => {
    // 토너먼트 정보 조회
    const tournament = await fastify.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });

    if (!tournament) {
      throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_FOUND);
    }

    if (tournament.status !== 'PENDING') {
      throw new GlobalException(GlobalErrorCode.TOURNAMENT_ALREADY_STARTED);
    }

    const participantCount = tournament.participants.length;

    // 참가자 수 확인 (최소 2명)
    if (participantCount < 2) {
      throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_ENOUGH_PLAYERS);
    }

    // 참가자 셔플 (무작위 대진)
    const shuffledParticipants = [...tournament.participants].sort(() => 0.5 - Math.random());

    // 토너먼트 유형에 따른 매치 구성
    const matchSize = tournament.type === '2P' ? 2 : 4;

    // 브라켓의 크기 계산 (2의 승수로)
    let bracketSize = 1;
    while (bracketSize < Math.ceil(participantCount / matchSize)) {
      bracketSize *= 2;
    }

    // 각 라운드별 매치 수 계산
    const totalRounds = Math.log2(bracketSize) + 1;
    const rounds = [];

    for (let i = 1; i <= totalRounds; i++) {
      const matchesInRound = bracketSize / Math.pow(2, i - 1);
      rounds.push(matchesInRound);
    }

    // 매치 생성 시작
    const tournamentMatches = [];
    let playerIndex = 0;

    // 첫 번째 라운드 매치 생성
    for (let matchOrder = 1; matchOrder <= rounds[0]; matchOrder++) {
      // 현재 매치에 할당할 플레이어
      const matchPlayers = [];
      for (let j = 0; j < matchSize && playerIndex < participantCount; j++) {
        matchPlayers.push(shuffledParticipants[playerIndex++]);
      }

      // 플레이어가 있는 경우만 매치 생성
      if (matchPlayers.length > 0) {
        const match = await fastify.prisma.tournamentMatch.create({
          data: {
            tournamentId,
            round: 1,
            matchOrder,
            status: 'PENDING',
            players: {
              connect: matchPlayers.map((p) => ({ id: p.id })),
            },
          },
        });
        tournamentMatches.push(match);
      }
    }

    // 다음 라운드 매치 생성 및 연결
    for (let round = 2; round <= totalRounds; round++) {
      const prevRoundMatches = await fastify.prisma.tournamentMatch.findMany({
        where: {
          tournamentId,
          round: round - 1,
        },
        orderBy: { matchOrder: 'asc' },
      });

      // 이전 라운드 매치들을 다음 라운드와 연결
      for (let matchOrder = 1; matchOrder <= rounds[round - 1]; matchOrder++) {
        const match = await fastify.prisma.tournamentMatch.create({
          data: {
            tournamentId,
            round,
            matchOrder,
            status: 'PENDING',
          },
        });

        // 이전 라운드 매치들을 현재 매치와 연결
        const matchesPerNextRound = 2; // 2경기당 1경기로 진출
        const startIdx = (matchOrder - 1) * matchesPerNextRound;

        for (let i = 0; i < matchesPerNextRound; i++) {
          const idx = startIdx + i;
          if (idx < prevRoundMatches.length) {
            await fastify.prisma.tournamentMatch.update({
              where: { id: prevRoundMatches[idx].id },
              data: { nextMatchId: match.id },
            });
          }
        }

        tournamentMatches.push(match);
      }
    }

    // 토너먼트 상태 업데이트
    await fastify.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: 'IN_PROGRESS',
      },
    });

    return tournamentMatches;
  };

  // 다음 매치 진출자 계산 함수
  const advanceToNextMatch = async (matchId: number) => {
    // 현재 매치 조회
    const match = await fastify.prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: {
        match: {
          include: {
            players: true,
          },
        },
        nextMatch: true,
      },
    });

    if (!match || !match.match || !match.nextMatchId) {
      return null; // 다음 매치가 없거나, 게임이 없는 경우
    }

    // 승자 결정
    let winner = null;
    if (match.match.player1Score > match.match.player2Score) {
      winner = match.match.players[0];
    } else if (match.match.player2Score > match.match.player1Score) {
      winner = match.match.players[1];
    } else {
      return null; // 동점인 경우 (아직 결정되지 않음)
    }

    // 다음 매치에 승자 추가
    if (winner) {
      await fastify.prisma.tournamentMatch.update({
        where: { id: match.nextMatchId },
        data: {
          players: {
            connect: { id: winner.id },
          },
        },
      });

      return match.nextMatchId;
    }

    return null;
  };

  fastify.decorate('tournamentMatchService', {
    /**
     * 토너먼트 매치 목록 조회
     */
    async getTournamentMatches(tournamentId: number) {
      // 토너먼트 확인
      const tournament = await fastify.prisma.tournament.findUnique({
        where: { id: tournamentId },
      });

      if (!tournament) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_FOUND);
      }

      // 매치 목록 조회
      const matches = await fastify.prisma.tournamentMatch.findMany({
        where: { tournamentId },
        include: {
          players: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          match: {
            select: {
              id: true,
              status: true,
              player1Score: true,
              player2Score: true,
              createdAt: true,
            },
          },
        },
        orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
      });

      return {
        tournamentId,
        matches,
      };
    },

    /**
     * 토너먼트 대진표 조회
     */
    async getTournamentBracket(tournamentId: number) {
      // 토너먼트 확인
      const tournament = await fastify.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (!tournament) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_FOUND);
      }

      // 매치 목록 조회
      const matches = await fastify.prisma.tournamentMatch.findMany({
        where: { tournamentId },
        include: {
          players: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          match: {
            select: {
              id: true,
              status: true,
              player1Score: true,
              player2Score: true,
            },
          },
          previousMatches: {
            select: {
              id: true,
            },
          },
        },
        orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
      });

      // 라운드별로 매치 그룹화
      const rounds = matches.reduce(
        (acc, match) => {
          if (!acc[match.round]) {
            acc[match.round] = [];
          }
          acc[match.round].push(match);
          return acc;
        },
        {} as Record<number, any[]>,
      );

      return {
        tournamentId,
        tournament,
        rounds,
      };
    },

    /**
     * 토너먼트 매치 상세 조회
     */
    async getTournamentMatch(tournamentId: number, matchId: number) {
      // 토너먼트 매치 확인
      const tournamentMatch = await fastify.prisma.tournamentMatch.findFirst({
        where: {
          id: matchId,
          tournamentId,
        },
        include: {
          players: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          match: {
            select: {
              id: true,
              status: true,
              player1Score: true,
              player2Score: true,
              gameLogs: {
                orderBy: { timestamp: 'asc' },
              },
            },
          },
          nextMatch: {
            select: {
              id: true,
              round: true,
              matchOrder: true,
            },
          },
          previousMatches: {
            select: {
              id: true,
              round: true,
              matchOrder: true,
            },
          },
        },
      });

      if (!tournamentMatch) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_MATCH_NOT_FOUND);
      }

      return tournamentMatch;
    },

    /**
     * 토너먼트 매치 시작 (게임 생성)
     */
    async startTournamentMatch(userId: number, tournamentId: number, matchId: number) {
      // 토너먼트 매치 확인
      const tournamentMatch = await fastify.prisma.tournamentMatch.findFirst({
        where: {
          id: matchId,
          tournamentId,
        },
        include: {
          players: true,
          match: true,
        },
      });

      if (!tournamentMatch) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_MATCH_NOT_FOUND);
      }

      // 이미 게임이 있는지 확인
      if (tournamentMatch.match) {
        throw new GlobalException(GlobalErrorCode.MATCH_ALREADY_EXISTS);
      }

      // 플레이어 확인 (최소 2명 필요)
      if (tournamentMatch.players.length < 2) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_MATCH_NOT_ENOUGH_PLAYERS);
      }

      // 권한 확인 (플레이어만 게임 시작 가능)
      const isPlayer = tournamentMatch.players.some((p) => p.id === userId);
      if (!isPlayer) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_MATCH_NOT_AUTHORIZED);
      }

      // 게임 생성
      const match = await fastify.prisma.match.create({
        data: {
          status: 'PENDING',
          players: {
            connect: tournamentMatch.players.map((p) => ({ id: p.id })),
          },
          tournamentMatch: {
            connect: { id: matchId },
          },
        },
        include: {
          players: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // 토너먼트 매치 상태 업데이트
      await fastify.prisma.tournamentMatch.update({
        where: { id: matchId },
        data: { status: 'IN_PROGRESS' },
      });

      return match;
    },

    /**
     * 토너먼트 매치 완료 처리
     */
    async completeTournamentMatch(userId: number, tournamentId: number, matchId: number) {
      // 토너먼트 매치 확인
      const tournamentMatch = await fastify.prisma.tournamentMatch.findFirst({
        where: {
          id: matchId,
          tournamentId,
        },
        include: {
          players: true,
          match: {
            include: {
              players: true,
            },
          },
        },
      });

      if (!tournamentMatch || !tournamentMatch.match) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_MATCH_NOT_FOUND);
      }

      // 권한 확인 (플레이어만 완료 처리 가능)
      const isPlayer = tournamentMatch.players.some((p) => p.id === userId);
      if (!isPlayer) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_MATCH_NOT_AUTHORIZED);
      }

      // 승자 결정
      const player1Score = tournamentMatch.match.player1Score;
      const player2Score = tournamentMatch.match.player2Score;

      let winnerId = null;
      if (player1Score > player2Score) {
        winnerId = tournamentMatch.match.players[0].id;
      } else if (player2Score > player1Score) {
        winnerId = tournamentMatch.match.players[1].id;
      } else {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_MATCH_NO_WINNER);
      }

      // 게임 완료 처리
      await fastify.prisma.match.update({
        where: { id: tournamentMatch.match.id },
        data: {
          status: 'COMPLETED',
        },
      });

      // 토너먼트 매치 완료 처리
      await fastify.prisma.tournamentMatch.update({
        where: { id: matchId },
        data: { status: 'COMPLETED' },
      });

      // 다음 매치 진출 처리
      const nextMatchId = await advanceToNextMatch(matchId);

      // 다음 매치가 없으면 토너먼트 완료
      if (!nextMatchId) {
        // 마지막 라운드 매치인지 확인
        const tournamentMatches = await fastify.prisma.tournamentMatch.findMany({
          where: { tournamentId },
          orderBy: { round: 'desc' },
          take: 1,
        });

        if (tournamentMatches.length > 0 && tournamentMatches[0].id === matchId) {
          // 토너먼트 완료 처리
          await fastify.prisma.tournament.update({
            where: { id: tournamentId },
            data: {
              status: 'COMPLETED',
            },
          });
        }
      }

      return {
        matchId,
        status: 'COMPLETED',
        winnerId,
        nextMatchId,
      };
    },
  });
});
