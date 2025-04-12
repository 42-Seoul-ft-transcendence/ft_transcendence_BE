import { FastifyPluginAsync } from 'fastify';
import fetch from 'node-fetch';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { googleAuthSchema } from '../schemas/auth';
import { GOOGLE_USERINFO_URL } from '../config';
import { GoogleUser } from '../types/auth';
import { GlobalErrorCode, GlobalException } from '../exceptions/globalException';

const authRoute: FastifyPluginAsync = async (fastify) => {
  // 프론트가 요청한 OAuth 토큰처리
  fastify.post('/auth/google', {
    schema: googleAuthSchema,
    handler: async (request, reply) => {
      const { googleAccessToken } = request.body as { googleAccessToken: string };

      // 구글 유저 정보 가져오기
      const res = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      // 구글 유저 정보가 없거나 유효하지 않은 경우
      if (!res.ok) {
        throw new GlobalException(GlobalErrorCode.AUTH_INVALID_TOKEN);
      }

      const googleUser = await res.json();
      const { sub: googleId, email, picture } = googleUser as GoogleUser;

      // User.googleId로 유저 조회 (직접 User 모델에서 googleId 검색)
      const existingUser = await fastify.prisma.user.findUnique({
        where: { googleId },
      });

      let user;
      let isNewUser = false;

      if (!existingUser) {
        user = await fastify.prisma.user.create({
          data: {
            email,
            name: googleId,
            googleId,
            image: picture,
            twoFactorEnabled: false,
          },
        });
        isNewUser = true;
      } else {
        user = existingUser;
      }

      // id가 int 타입으로 변경됨에 따라 적절한 타입으로 전달
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      return reply.send({
        accessToken,
        refreshToken,
        message: isNewUser ? '회원가입 성공' : '로그인 성공',
      });
    },
  });
};

export default authRoute;
