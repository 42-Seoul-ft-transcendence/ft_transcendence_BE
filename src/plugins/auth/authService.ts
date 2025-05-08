import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException.js';

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('authService', {
    /**
     * 사용자 ID로 액세스 토큰과 리프레시 토큰 생성
     */
    generateTokens(userId: number) {
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId);

      return {
        accessToken,
        refreshToken,
      };
    },

    /**
     * 리프레시 토큰으로 새 토큰 세트 발급
     */
    async refreshTokens(refreshToken: string) {
      // 리프레시 토큰 검증
      const userId = verifyRefreshToken(refreshToken);

      if (!userId) {
        throw new GlobalException(GlobalErrorCode.AUTH_INVALID_TOKEN);
      }

      // 사용자가 여전히 존재하는지 확인
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      // 새 토큰 세트 발급
      const newAccessToken = generateAccessToken(userId);
      const newRefreshToken = generateRefreshToken(userId);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    },
  });
});
