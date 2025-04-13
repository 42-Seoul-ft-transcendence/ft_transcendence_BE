import fp from 'fastify-plugin';
import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../global/config';
import { GlobalErrorCode, GlobalException } from '../global/exceptions/globalException';

const jwtMiddleware: FastifyPluginCallback = (fastify, _options, done) => {
  // request.user 라는 프로퍼티를 추가해줍니다.
  fastify.decorateRequest('user');

  // 인증 함수 생성 - 라우트에서 직접 사용 가능
  const authenticate = async (request: FastifyRequest) => {
    const { authorization } = request.headers;
    if (!authorization) {
      throw new GlobalException(GlobalErrorCode.AUTH_UNAUTHORIZED);
    }

    const token = authorization.replace(/^Bearer\s+/, '');
    if (!token) {
      throw new GlobalException(GlobalErrorCode.AUTH_INVALID_TOKEN);
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      request.user = { id: decoded.userId };
    } catch (err) {
      throw new GlobalException(GlobalErrorCode.AUTH_EXPIRED_TOKEN);
    }
  };

  fastify.addHook('onRequest', async (request) => {
    // 1) 인증이 필요없는 path 예외 처리
    if (
      request.url.startsWith('/ping') ||
      request.url.startsWith('/api/auth/refresh') ||
      request.url.startsWith('/api/auth/login/google') ||
      request.url.startsWith('/api/auth/2fa/authenticate') ||
      request.url.startsWith('/documentation') ||
      request.url.startsWith('/documentation/json')
    ) {
      return;
    }

    await authenticate(request);
  });

  fastify.decorate('authenticate', authenticate);
  done();
};

export default fp(jwtMiddleware, {
  name: 'jwtMiddleware',
});
