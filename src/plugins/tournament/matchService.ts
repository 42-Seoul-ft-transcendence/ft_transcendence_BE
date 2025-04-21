import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { GlobalException, GlobalErrorCode } from '../../global/exceptions/globalException';

export default fp(async (fastify: FastifyInstance) => {
  // 의존성 확인
  if (!fastify.prisma) {
    throw new Error('Prisma plugin is required for matchService');
  }

  fastify.decorate('matchService', {
    /**
     * 매치 목록 조회
     */
    async getMatches(options: { page: number; limit: number; status?: string }) {
      const page = options.page;
      const limit = options.limit;

      // 검색 조건 설정
      const where = options.status ? { status: options.status } : {};

      // 매치 목록 조회
      const matches = await fastify.prisma.match.findMany({
        where,
        include: {
          players: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          tournamentMatch: {
            select: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // 총 매치 수 조회
      const total = await fastify.prisma.match.count({
        where,
      });

      return {
        matches,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },

    /**
     * 매치 생성
     */
    async createMatch(creatorId: number, data: { player2Id: number; tournamentMatchId?: number }) {
      // 플레이어 확인
      const player1 = await fastify.prisma.user.findUnique({
        where: { id: creatorId },
      });

      if (!player1) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      const player2 = await fastify.prisma.user.findUnique({
        where: { id: data.player2Id },
      });

      if (!player2) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      // 자기 자신과 매치를 만들려는 경우
      if (creatorId === data.player2Id) {
        throw new GlobalException(GlobalErrorCode.MATCH_SELF_PLAY);
      }

      // 토너먼트 매치 확인 (있는 경우)
      if (data.tournamentMatchId) {
        const tournamentMatch = await fastify.prisma.tournamentMatch.findUnique({
          where: { id: data.tournamentMatchId },
          include: { match: true },
        });

        if (!tournamentMatch) {
          throw new GlobalException(GlobalErrorCode.TOURNAMENT_MATCH_NOT_FOUND);
        }

        if (tournamentMatch.match) {
          throw new GlobalException(GlobalErrorCode.MATCH_ALREADY_EXISTS);
        }
      }

      // 매치 생성
      const match = await fastify.prisma.match.create({
        data: {
          status: 'PENDING',
          players: {
            connect: [{ id: creatorId }, { id: data.player2Id }],
          },
          ...(data.tournamentMatchId && {
            tournamentMatch: {
              connect: { id: data.tournamentMatchId },
            },
          }),
        },
        include: {
          players: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          tournamentMatch: {
            select: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return match;
    },

    /**
     * 매치 상세 조회
     */
    async getMatch(id: number) {
      const match = await fastify.prisma.match.findUnique({
        where: { id },
        include: {
          players: {
            select: {
              id: true,
              name: true,
              image: true,
              wins: true,
              losses: true,
            },
          },
          tournamentMatch: {
            select: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
          gameLogs: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      if (!match) {
        throw new GlobalException(GlobalErrorCode.MATCH_NOT_FOUND);
      }

      return match;
    },

    /**
     * 매치 상태 조회/업데이트
     */
    async getMatchState(id: number) {
      const match = await fastify.prisma.match.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          player1Score: true,
          player2Score: true,
          gameState: true,
          players: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!match) {
        throw new GlobalException(GlobalErrorCode.MATCH_NOT_FOUND);
      }

      return {
        ...match,
        gameState: match.gameState ? JSON.parse(match.gameState) : null,
      };
    },

    /**
     * 매치 상태 업데이트
     */
    async updateMatchState(
      id: number,
      userId: number,
      data: {
        status?: string;
        player1Score?: number;
        player2Score?: number;
        gameState?: any;
      },
    ) {
      // 매치 확인
      const match = await fastify.prisma.match.findUnique({
        where: { id },
        include: {
          players: true,
        },
      });

      if (!match) {
        throw new GlobalException(GlobalErrorCode.MATCH_NOT_FOUND);
      }

      // 권한 확인 (플레이어만 업데이트 가능)
      const isPlayer = match.players.some((p) => p.id === userId);
      if (!isPlayer) {
        throw new GlobalException(GlobalErrorCode.MATCH_NOT_AUTHORIZED);
      }

      // 상태 변경 유효성 검사
      if (data.status) {
        const validStatusTransitions: { [key: string]: string[] } = {
          PENDING: ['IN_PROGRESS', 'ABANDONED'],
          IN_PROGRESS: ['COMPLETED', 'ABANDONED'],
          COMPLETED: [],
          ABANDONED: [],
        };

        if (!validStatusTransitions[match.status].includes(data.status)) {
          throw new GlobalException(GlobalErrorCode.MATCH_INVALID_STATUS_TRANSITION);
        }
      }

      // 매치 업데이트
      const updatedMatch = await fastify.prisma.match.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.player1Score !== undefined && { player1Score: data.player1Score }),
          ...(data.player2Score !== undefined && { player2Score: data.player2Score }),
          ...(data.gameState && { gameState: JSON.stringify(data.gameState) }),
        },
        include: {
          players: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // 게임이 완료된 경우 플레이어 승패 기록 업데이트
      if (data.status === 'COMPLETED') {
        const player1 = match.players[0];
        const player2 = match.players[1];

        if (updatedMatch.player1Score > updatedMatch.player2Score) {
          // Player 1 승리
          await fastify.prisma.user.update({
            where: { id: player1.id },
            data: { wins: { increment: 1 } },
          });
          await fastify.prisma.user.update({
            where: { id: player2.id },
            data: { losses: { increment: 1 } },
          });
        } else if (updatedMatch.player2Score > updatedMatch.player1Score) {
          // Player 2 승리
          await fastify.prisma.user.update({
            where: { id: player2.id },
            data: { wins: { increment: 1 } },
          });
          await fastify.prisma.user.update({
            where: { id: player1.id },
            data: { losses: { increment: 1 } },
          });
        }

        // 토너먼트 매치인 경우 토너먼트 매치 상태 업데이트
        if (match.tournamentMatchId) {
          await fastify.prisma.tournamentMatch.update({
            where: { id: match.tournamentMatchId },
            data: { status: 'COMPLETED' },
          });
        }
      }

      return {
        ...updatedMatch,
        gameState: updatedMatch.gameState ? JSON.parse(updatedMatch.gameState) : null,
      };
    },

    /**
     * 매치 로그 기록
     */
    async addMatchLog(matchId: number, data: { event: string; data?: any }) {
      // 매치 확인
      const match = await fastify.prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        throw new GlobalException(GlobalErrorCode.MATCH_NOT_FOUND);
      }

      // 로그 생성
      const log = await fastify.prisma.gameLog.create({
        data: {
          matchId,
          event: data.event,
          data: data.data ? JSON.stringify(data.data) : null,
        },
      });

      return log;
    },

    /**
     * 사용자 매치 히스토리 조회
     */
    async getUserMatchHistory(userId: number, options: { page: number; limit: number }) {
      const page = options.page;
      const limit = options.limit;

      // 사용자 확인
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      // 매치 기록 조회
      const matches = await fastify.prisma.match.findMany({
        where: {
          players: {
            some: { id: userId },
          },
          status: { in: ['COMPLETED', 'ABANDONED'] },
        },
        include: {
          players: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          tournamentMatch: {
            select: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // 총 매치 수 조회
      const total = await fastify.prisma.match.count({
        where: {
          players: {
            some: { id: userId },
          },
          status: { in: ['COMPLETED', 'ABANDONED'] },
        },
      });

      return {
        matches,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
  });
});
