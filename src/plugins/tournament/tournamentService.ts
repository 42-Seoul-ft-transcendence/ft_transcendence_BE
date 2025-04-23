import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { GlobalException, GlobalErrorCode } from '../../global/exceptions/globalException';

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('tournamentService', {
    /**
     * 토너먼트 목록 조회
     */
    async getTournaments(options: { page: number; limit: number; type: string }) {
      const page = options.page;
      const limit = options.limit;

      // 검색 조건 설정
      const where = { type: options.type, status: 'PENDING' };

      // 토너먼트 목록 조회
      const tournaments = await fastify.prisma.tournament.findMany({
        where,
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // 총 토너먼트 수 조회
      const total = await fastify.prisma.tournament.count({ where });

      return {
        tournaments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },

    /**
     * 토너먼트 생성
     */
    async createTournament(creatorId: number, data: { name: string; type: string }) {
      // 유효성 검사
      if (data.type !== '2P' && data.type !== '4P') {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_INVALID_TYPE);
      }

      // 토너먼트 생성
      const tournament = await fastify.prisma.tournament.create({
        data: {
          name: data.name,
          type: data.type,
          status: 'PENDING',
          participants: {
            connect: { id: creatorId }, // 생성자를 자동으로 참가자로 추가
          },
        },
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

      return tournament;
    },

    /**
     * 토너먼트 상세 조회
     */
    async getTournament(id: number) {
      const tournament = await fastify.prisma.tournament.findUnique({
        where: { id },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          matches: {
            include: {
              matchUsers: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              round: 'asc',
            },
          },
        },
      });

      if (!tournament) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_FOUND);
      }

      // 응답 데이터 포맷팅
      const formattedTournament = {
        id: tournament.id,
        name: tournament.name,
        type: tournament.type,
        status: tournament.status,
        createdAt: tournament.createdAt,
        updatedAt: tournament.updatedAt,
        participants: tournament.participants.map((user) => ({
          id: user.id,
          name: user.name,
          image: user.image,
        })),
        matches: tournament.matches.map((match) => ({
          id: match.id,
          round: match.round,
          status: match.status,
          createdAt: match.createdAt,
          updatedAt: match.updatedAt,
          players: match.matchUsers.map((mu) => ({
            id: mu.user.id,
            name: mu.user.name,
            image: mu.user.image,
            score: mu.score,
            isWinner: mu.isWinner,
          })),
        })),
      };

      return formattedTournament;
    },

    /**
     * 토너먼트 참가
     */
    async joinTournament(userId: number, tournamentId: number) {
      // 사용자 확인
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      // 토너먼트 확인
      const tournament = await fastify.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: true,
          matches: {
            where: {
              status: { in: ['PENDING', 'IN_PROGRESS'] },
            },
          },
        },
      });

      if (!tournament) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_FOUND);
      }

      // 이미 시작된 토너먼트인지 확인
      if (tournament.status !== 'PENDING') {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_ALREADY_STARTED);
      }

      // 이미 참가 중인지 확인
      const isAlreadyJoined = tournament.participants.some(
        (participant) => participant.id === userId,
      );
      if (isAlreadyJoined) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_ALREADY_JOINED);
      }

      // 토너먼트 타입에 따른 최대 참가자 수 확인
      const maxParticipants = tournament.type === '2P' ? 2 : 4;
      if (tournament.participants.length >= maxParticipants) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_FULL);
      }

      // 토너먼트에 참가
      const updatedTournament = await fastify.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          participants: {
            connect: { id: userId },
          },
        },
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

      // 참가자가 다 모였는지 확인하고, 모였다면 토너먼트 시작
      if (updatedTournament.participants.length === maxParticipants) {
        // 토너먼트 상태 업데이트
        await fastify.prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: 'IN_PROGRESS' },
        });

        // 2P 토너먼트인 경우 매치 1개 생성
        if (tournament.type === '2P') {
          const match = await fastify.prisma.match.create({
            data: {
              tournamentId,
              round: 1,
              status: 'PENDING',
              matchUsers: {
                create: updatedTournament.participants.map((participant) => ({
                  userId: participant.id,
                  score: 0,
                  isWinner: false,
                })),
              },
            },
          });
        }
        // 4P 토너먼트인 경우 예선 매치 2개 생성
        else if (tournament.type === '4P') {
          // 첫 번째 예선 매치 (참가자 1, 2)
          await fastify.prisma.match.create({
            data: {
              tournamentId,
              round: 1,
              status: 'PENDING',
              matchUsers: {
                create: [
                  {
                    userId: updatedTournament.participants[0].id,
                    score: 0,
                    isWinner: false,
                  },
                  {
                    userId: updatedTournament.participants[1].id,
                    score: 0,
                    isWinner: false,
                  },
                ],
              },
            },
          });

          // 두 번째 예선 매치 (참가자 3, 4)
          await fastify.prisma.match.create({
            data: {
              tournamentId,
              round: 1,
              status: 'PENDING',
              matchUsers: {
                create: [
                  {
                    userId: updatedTournament.participants[2].id,
                    score: 0,
                    isWinner: false,
                  },
                  {
                    userId: updatedTournament.participants[3].id,
                    score: 0,
                    isWinner: false,
                  },
                ],
              },
            },
          });
        }
      }
    },

    /**
     * 토너먼트 탈퇴
     */
    async leaveTournament(userId: number, tournamentId: number) {
      // 사용자 확인
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      // 토너먼트 확인
      const tournament = await fastify.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: true,
          matches: {
            where: {
              status: { in: ['PENDING', 'IN_PROGRESS'] },
            },
          },
        },
      });

      if (!tournament) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_FOUND);
      }

      // 이미 시작된 토너먼트인지 확인
      if (tournament.status !== 'PENDING') {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_ALREADY_STARTED);
      }

      // 참가 중인지 확인
      const isJoined = tournament.participants.some((participant) => participant.id === userId);
      if (!isJoined) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_JOINED);
      }

      // 토너먼트에서 탈퇴
      await fastify.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          participants: {
            disconnect: { id: userId },
          },
        },
      });
    },
  });
});
