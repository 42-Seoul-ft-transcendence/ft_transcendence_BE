import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { GlobalException, GlobalErrorCode } from '../../global/exceptions/globalException';

export default fp(async (fastify: FastifyInstance) => {
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
