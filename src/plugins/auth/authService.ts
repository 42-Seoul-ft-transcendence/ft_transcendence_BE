import fp from 'fastify-plugin';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';

export default fp(async (fastify) => {
  fastify.decorate('authService', {
    generateTokens(userId: number) {
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId);
      return { accessToken, refreshToken };
    },
  });
});
