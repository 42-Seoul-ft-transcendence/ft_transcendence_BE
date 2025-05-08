// src/routes/tournament/match.ts
import { FastifyInstance } from 'fastify';
import { verifyToken } from '../../utils/jwt.js';

export default async function matchRoutes(fastify: FastifyInstance) {
  // WebSocket 연결 설정
  fastify.get('/ws/match/:matchId', { websocket: true }, async (connection, request) => {
    const { matchId } = request.params as { matchId: string };
    let userId: number;
    let isGameReady: { isGameReady: boolean };
    let isAuthorized = false;

    // 메시지 처리
    connection.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'authenticate' && !isAuthorized) {
          // 유저 인증 및 등록 처리
          userId = verifyToken(data.token);

          // 매치 참가 권한 검증
          await fastify.gameService.validateMatchParticipation(parseInt(matchId), userId);

          // 플레이어 연결 등록 및 게임 세팅
          await fastify.gameService.registerPlayerConnection(parseInt(matchId), userId, connection);

          // 플레이어 인증
          isGameReady = await fastify.gameService.authenticatePlayer(parseInt(matchId), userId);

          isAuthorized = true;

          connection.send(
            JSON.stringify({
              type: 'authenticated',
            }),
          );

          // 두 플레이어 모두 인증되면 게임 시작
          if (isGameReady.isGameReady) {
            await fastify.gameService.startMatch(parseInt(matchId));
          }
        } else if (data.type === 'move_paddle' && isAuthorized) {
          // 패들 이동 처리
          fastify.gameService.updatePaddleDirection(parseInt(matchId), userId, data.data);
        } else {
          fastify.log.warn(`알 수 없는 메시지 타입: ${data.type}`);
        }
      } catch (error) {
        fastify.log.error(`WebSocket 연결 오류: ${error.message}`);
        connection.send(
          JSON.stringify({
            type: 'error',
            message: error.message as string | '서버 오류가 발생했습니다.',
          }),
        );
        connection.close();
      }
    });

    // 연결 종료 처리
    connection.on('close', () => {
      fastify.gameService.handlePlayerDisconnect(parseInt(matchId), userId);
    });
  });
}
