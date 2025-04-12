import { FastifyPluginAsync } from 'fastify';
import { googleAuthSchema } from '../schemas/auth';

const authRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/google', {
    schema: googleAuthSchema,
    handler: async (request, reply) => {
      const { googleAccessToken } = request.body as { googleAccessToken: string };

      // 플러그인으로 등록된 서비스 사용
      const googleUser = await fastify.googleAuthService.getGoogleUserInfo(googleAccessToken);
      const { user, isNewUser } = await fastify.googleAuthService.findOrCreateUser(googleUser);
      const { accessToken, refreshToken } = fastify.authService.generateTokens(user.id);

      return reply.send({
        accessToken,
        refreshToken,
        message: isNewUser ? '회원가입 성공' : '로그인 성공',
      });
    },
  });
};

export default authRoute;
