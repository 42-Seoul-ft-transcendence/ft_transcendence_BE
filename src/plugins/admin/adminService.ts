import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { ADMIN_PASSWORD } from '../../global/config';

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate('adminAuthService', {
      /**
       * 사용자 ID와 어드민 비밀번호로 액세스 토큰 생성 (테스트용)
       * @param userId 사용자 ID
       * @param adminPassword 어드민 비밀번호
       * @returns 액세스 토큰과 리프레시 토큰
       */
      async generateTokenForUser(userId: number, adminPassword: string) {
        // 어드민 비밀번호 검증
        if (adminPassword !== ADMIN_PASSWORD) {
          throw new GlobalException(GlobalErrorCode.AUTH_INVALID_ADMIN_PASSWORD);
        }

        // 사용자가 존재하는지 확인
        const user = await fastify.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
        }

        // 토큰 생성
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        return {
          userId,
          userName: user.name,
          accessToken,
          refreshToken,
          message: '테스트용 토큰이 생성되었습니다',
        };
      },
    });
  },
  {
    name: 'adminAuthService',
  },
);
