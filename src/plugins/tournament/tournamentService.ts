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
              wins: true,
              losses: true,
            },
          },
          matches: {
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
            },
          },
        },
      });

      if (!tournament) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_FOUND);
      }

      return tournament;
    },

    /**
     * 토너먼트 참가
     */
    async joinTournament(userId: number, tournamentId: number) {
      // 토너먼트 존재 확인
      const tournament = await fastify.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: true,
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
      const isAlreadyJoined = tournament.participants.some((p) => p.id === userId);
      if (isAlreadyJoined) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_ALREADY_JOINED);
      }

      // 참가자 수 제한 확인
      const maxParticipants = tournament.type === '2P' ? 8 : 16; // 예시 제한
      if (tournament.participants.length >= maxParticipants) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_FULL);
      }

      // 토너먼트 참가
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

      return updatedTournament;
    },

    /**
     * 토너먼트 탈퇴
     */
    async leaveTournament(userId: number, tournamentId: number) {
      // 토너먼트 존재 확인
      const tournament = await fastify.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: true,
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
      const isJoined = tournament.participants.some((p) => p.id === userId);
      if (!isJoined) {
        throw new GlobalException(GlobalErrorCode.TOURNAMENT_NOT_JOINED);
      }

      // 토너먼트 탈퇴
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
