import { FastifyPluginAsync } from 'fastify';
import fetch from 'node-fetch';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { googleAuthSchema } from '../schemas/auth';

const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

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
        return reply.code(401).send({ message: 'Invalid Google access token' });
      }

      const googleUser = await res.json();
      const { sub: googleId, email, name, picture } = googleUser as GoogleUser;

      // Authentication.googleId로 유저 조회
      let auth = await fastify.prisma.authentication.findUnique({
        where: { googleId },
        include: { user: true },
      });

      let user;
      let isNewUser = false;

      if (!auth) {
        // 기존에 유저가 없을시 회원가입
        user = await fastify.prisma.user.create({
          data: {
            email,
            username: email.split('@')[0], // 기본 유저네임 생성
            passwordHash: '', // 구글 로그인 시 비밀번호 없음
            avatarUrl: picture,
            authentication: {
              create: {
                googleId,
                tfaEnabled: false,
              },
            },
          },
          include: { authentication: true },
        });
        isNewUser = true;
      } else {
        user = auth.user;
      }

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
