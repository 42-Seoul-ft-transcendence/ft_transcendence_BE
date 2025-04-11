import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret';

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
      request.url.startsWith('/auth/google') ||
      request.url.startsWith('/documentation') ||
      request.url.startsWith('/documentation/json')
    ) {
      return;
    }

    // 2) Authorization 헤더 확인
    const { authorization } = request.headers;
    if (!authorization) {
      return reply.status(401).send({ message: '인증 토큰이 존재하지 않습니다.' });
    }

    // 3) 'Bearer <token>' 에서 token 추출
    const token = authorization.replace(/^Bearer\s+/, '');
    if (!token) {
      return reply.status(401).send({ message: '인증 토큰 형식이 유효하지 않습니다.' });
    }

    // 4) JWT 검증
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      // 토큰에서 필요한 정보를 request.user 에 세팅
      request.user = { userId: decoded.userId };
    } catch (err) {
      // 만료 or 유효하지 않은 토큰 예외 처리
      return reply.status(401).send({ message: '만료되었거나 유효하지 않은 토큰입니다.' });
    }
  });

  done();
};

export default fp(jwtMiddleware, {
  name: 'jwtMiddleware',
});
