import fp from 'fastify-plugin';
import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../global/config/index.js';
import { GlobalErrorCode, GlobalException } from '../global/exceptions/globalException.js';

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

  fastify.decorate('authenticate', authenticate);
  done();
};

export default fp(jwtMiddleware, {
  name: 'jwtMiddleware',
});
