import { FastifyPluginAsync } from 'fastify';
import { googleAuthSchema } from '../schemas/authSchema';

const authRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/google', {
    schema: googleAuthSchema,
    handler: async (request, reply) => {
      const { googleAccessToken } = request.body as { googleAccessToken: string };

      // 구글 유저 정보 가져오기
      const googleUser = await fastify.googleAuthService.getGoogleUserInfo(googleAccessToken);
      const { user, isNewUser } = await fastify.googleAuthService.findOrCreateUser(googleUser);

      // 2FA가 활성화되어 있는지 확인
      if (user.twoFactorEnabled) {
        return reply.send({
          requireTwoFactor: true,
          userId: user.id,
          message: '2단계 인증이 필요합니다.',
        });
      }

      // 2FA가 없거나 새 사용자인 경우 바로 토큰 발급
      const { accessToken, refreshToken } = fastify.authService.generateTokens(user.id);

      return reply.send({
        accessToken,
        refreshToken,
        requireTwoFactor: false,
        message: isNewUser ? '회원가입 성공' : '로그인 성공',
      });
    },
  });
};

export default authRoute;
