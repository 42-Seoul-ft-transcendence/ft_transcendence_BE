import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException';

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('userService', {
    /**
     * 사용자 조회
     */
    async getUserById(userId: number) {
      return fastify.prisma.user
        .findUniqueOrThrow({
          where: { id: userId },
        })
        .catch(() => {
          throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
        });
    },

    /**
     * 사용자 프로필 수정
     */
    async updateUser(userId: number, userData: { name?: string; image?: string | null }) {
      // 이름이 제공된 경우 중복 확인
      if (userData.name) {
        const existingUser = await fastify.prisma.user.findFirst({
          where: {
            name: userData.name,
            id: { not: userId },
          },
        });

        if (existingUser) {
          throw new GlobalException(GlobalErrorCode.USER_NAME_ALREADY_EXISTS);
        }
      }

      // 사용자 정보 업데이트
      return fastify.prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    },

    /**
     * 사용자 목록 조회 (페이지네이션 및 검색 기능 포함)
     */
    async getUsers(options: { page?: number; limit?: number; search?: string }) {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      // 검색 조건 설정
      const where = options.search
        ? {
            OR: [{ name: { contains: options.search } }, { email: { contains: options.search } }],
          }
        : {};

      // 사용자 목록 조회
      const users = await fastify.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          image: true,
          wins: true,
          losses: true,
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      });

      // 총 사용자 수 조회
      const total = await fastify.prisma.user.count({ where });

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
  });
});
