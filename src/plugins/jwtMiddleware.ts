import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../global/config';
import { GlobalErrorCode, GlobalException } from '../global/exceptions/globalException';

interface JwtPayload {
  userId: number; // 토큰에 넣을 값
  iat?: number; // issued at
  exp?: number; // expiration
}

const jwtMiddleware: FastifyPluginCallback = (fastify, _options, done) => {
  // request.user 라는 프로퍼티를 추가해줍니다.
  fastify.decorateRequest('user', undefined);

  fastify.addHook('onRequest', async (request, reply) => {
    // 1) 인증이 필요없는 path 예외 처리
    if (
      request.url.startsWith('/ping') ||
      request.url.startsWith('/api/auth/google') ||
      request.url.startsWith('/api/auth/2fa/authenticate') ||
      request.url.startsWith('/documentation') ||
      request.url.startsWith('/documentation/json')
    ) {
      return;
    }

    // 2) Authorization 헤더 확인
    const { authorization } = request.headers;
    if (!authorization) {
      throw new GlobalException(GlobalErrorCode.AUTH_UNAUTHORIZED);
    }

    // 3) 'Bearer <token>' 에서 token 추출
    const token = authorization.replace(/^Bearer\s+/, '');
    if (!token) {
      throw new GlobalException(GlobalErrorCode.AUTH_INVALID_TOKEN);
    }

    // 4) JWT 검증
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      // 토큰에서 필요한 정보를 request.user 에 세팅
      request.user = { id: decoded.userId };
    } catch (err) {
      throw new GlobalException(GlobalErrorCode.AUTH_EXPIRED_TOKEN);
    }
  });

  done();
};

export default fp(jwtMiddleware, {
  name: 'jwtMiddleware',
});
