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
          tournament: {
            select: {
              name: true,
              type: true,
            },
          },
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
          createdAt: 'desc', // 최신 매치부터 표시
        },
        take: limit,
      });

      // 총 매치 수 계산
      const totalMatches = await fastify.prisma.match.count({ where });
      const totalPages = Math.ceil(totalMatches / limit);

      // 응답 데이터 구성
      const formattedMatches = matches.map((match) => ({
        id: match.id,
        tournamentId: match.tournamentId,
        tournamentName: match.tournament.name,
        tournamentType: match.tournament.type,
        round: match.round,
        status: match.status,
        players: match.matchUsers.map((mu) => ({
          userId: mu.user.id,
          userName: mu.user.name,
          userImage: mu.user.image,
          score: mu.score,
          isWinner: mu.isWinner,
        })),
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      }));

      return {
        matches: formattedMatches,
        total: totalMatches,
        page,
        limit,
        totalPages,
      };
    },

    /**
     * 사용자 매치 히스토리 조회
     */
    async getUserMatchHistory(userId: number, options: { page: number; limit: number }) {
      const { page, limit } = options;

      // 사용자 확인
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      // 사용자가 참여한 모든 매치 가져오기
      const userMatches = await fastify.prisma.matchUser.findMany({
        where: { userId: userId },
        include: { match: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      // 총 매치 수 계산
      const totalMatches = await fastify.prisma.matchUser.count({
        where: { userId: userId },
      });

      // 각 매치에서 상대방 정보 가져오기
      const matchesWithOpponents = await Promise.all(
        userMatches.map(async (userMatch) => {
          // 각 매치에서 상대방 찾기 (2인 매치 기준)
          const opponent = await fastify.prisma.matchUser.findFirst({
            where: {
              matchId: userMatch.match.id,
              userId: { not: userId }, // 현재 사용자가 아닌 사용자
            },
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          });

          return {
            id: userMatch.match.id,
            myScore: userMatch.score,
            opponentScore: opponent ? opponent.score : 0,
            isWinner: userMatch.isWinner,
            opponentName: opponent ? opponent.user.name : '알 수 없음',
            playedAt: userMatch.match.updatedAt,
          };
        }),
      );

      const totalPages = Math.ceil(totalMatches / limit);

      return {
        matches: matchesWithOpponents,
        total: totalMatches,
        page,
        limit,
        totalPages,
      };
    },
  });
});
