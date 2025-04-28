import { FastifyPluginAsync } from 'fastify';
import {
  twoFactorSetupSchema,
  twoFactorVerifySchema,
  twoFactorAuthSchema,
  twoFactorDisableSchema,
} from '../../schemas/auth/twoFactorAuthSchema';

const twoFactorAuthRoute: FastifyPluginAsync = async (fastify) => {
  // 2FA 설정 초기화 (QR 코드 생성)
  fastify.get('/2fa/setup', {
    schema: twoFactorSetupSchema,
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const userId = request.user.id;
      const setupResult = await fastify.twoFactorAuthService.setupTwoFactor(userId);
      return reply.send(setupResult);
    },
  });

  // 2FA 설정 검증 및 활성화
  fastify.post('/2fa/verify', {
    schema: twoFactorVerifySchema,
    preHandler: fastify.authenticate,
    handler: async (request) => {
      const userId = request.user.id;
      const { token, secret } = request.body as { token: string; secret: string };
      await fastify.twoFactorAuthService.verifyAndEnableTwoFactor(userId, token, secret);
    },
  });

  // 2FA 로그인 검증 (로그인 프로세스의 2단계)
  fastify.post('/2fa/authenticate', {
    schema: twoFactorAuthSchema,
    handler: async (request, reply) => {
      const { userId, token } = request.body as { userId: number; token: string };

      const authResult = await fastify.twoFactorAuthService.verifyTwoFactorAuth(userId, token);
      return reply.send(authResult);
    },
  });

  // 2FA 비활성화
  fastify.delete('/2fa', {
    schema: twoFactorDisableSchema,
    preHandler: fastify.authenticate,
    handler: async (request) => {
      const userId = request.user.id;
      await fastify.twoFactorAuthService.disableTwoFactor(userId);
    },
  });
};

export default twoFactorAuthRoute;
