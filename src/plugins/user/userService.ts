import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException';

export default fp(async (fastify: FastifyInstance) => {
  // 의존성 확인
  if (!fastify.prisma) {
    throw new Error('Prisma plugin is required for userService');
  }

  fastify.decorate('userService', {
    /**
     * 현재 로그인한 사용자 정보 조회
     */
    async getCurrentUser(userId: number) {
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          twoFactorEnabled: true,
          wins: true,
          losses: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      return user;
    },

    /**
     * 특정 사용자 정보 조회 (제한된 정보)
     */
    async getUserById(userId: number) {
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          image: true,
          wins: true,
          losses: true,
        },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      return user;
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
      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          updatedAt: true,
        },
      });

      return updatedUser;
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
