import { FastifyPluginAsync } from 'fastify';
import {
  twoFactorSetupSchema,
  twoFactorVerifySchema,
  twoFactorAuthSchema,
  twoFactorDisableSchema,
} from '../schemas/twoFactorAuthSchema';
import { GlobalErrorCode, GlobalException } from '../global/exceptions/globalException';

const twoFactorAuthRoute: FastifyPluginAsync = async (fastify) => {
  // 2FA 설정 초기화 (QR 코드 생성)
  fastify.get('/auth/2fa/setup', {
    schema: twoFactorSetupSchema,
    handler: async (request, reply) => {
      if (!request.user || !request.user.id) {
        throw new GlobalException(GlobalErrorCode.AUTH_UNAUTHORIZED);
      }
      const userId = request.user?.id;

      const setupResult = await fastify.twoFactorAuthService.setupTwoFactor(userId);
      return reply.send(setupResult);
    },
  });

  // 2FA 설정 검증 및 활성화
  fastify.post('/auth/2fa/verify', {
    schema: twoFactorVerifySchema,
    handler: async (request, reply) => {
      if (!request.user || !request.user.id) {
        throw new GlobalException(GlobalErrorCode.AUTH_UNAUTHORIZED);
      }
      const userId = request.user?.id;
      const { token, secret } = request.body as { token: string; secret: string };

      const verifyResult = await fastify.twoFactorAuthService.verifyAndEnableTwoFactor(
        userId,
        token,
        secret,
      );

      return reply.send(verifyResult);
    },
  });

  // 2FA 로그인 검증 (로그인 프로세스의 2단계)
  fastify.post('/auth/2fa/authenticate', {
    schema: twoFactorAuthSchema,
    handler: async (request, reply) => {
      const { userId, token } = request.body as { userId: number; token: string };

      const authResult = await fastify.twoFactorAuthService.verifyTwoFactorAuth(userId, token);
      return reply.send(authResult);
    },
  });

  // 2FA 비활성화
  fastify.delete('/auth/2fa', {
    schema: twoFactorDisableSchema,
    handler: async (request, reply) => {
      if (!request.user || !request.user.id) {
        throw new GlobalException(GlobalErrorCode.AUTH_UNAUTHORIZED);
      }

      const userId = request.user.id;
      const disableResult = await fastify.twoFactorAuthService.disableTwoFactor(userId);
      return reply.send(disableResult);
    },
  });
};

export default twoFactorAuthRoute;
