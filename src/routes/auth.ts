import { FastifyPluginAsync } from 'fastify';
import { googleAuthSchema } from '../schemas/auth';
import { GoogleAuthController } from '../controllers/googleAuthController';

const authRoute: FastifyPluginAsync = async (fastify) => {
  // 컨트롤러 인스턴스 생성
  const googleAuthController = new GoogleAuthController(fastify.prisma);

  // 프론트가 요청한 OAuth 토큰처리
  fastify.post('/auth/google', {
    schema: googleAuthSchema,
    handler: googleAuthController.handleGoogleLogin,
  });
};

export default authRoute;
