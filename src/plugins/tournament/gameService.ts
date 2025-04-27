// src/plugins/tournament/gameService.ts
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException';
import { GameState, PaddleDirection, GAME_CONSTANTS } from '../../types/game';

// 게임 상수 불러오기
const { WIN_SCORE, PADDLE_HEIGHT, PADDLE_SPEED, CANVAS_HEIGHT, CANVAS_WIDTH, BALL_RADIUS } =
  GAME_CONSTANTS;

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('gameService', {
    /**
     * 매치 참가 권한 검증
     */
    async validateMatchParticipation(matchId: number, userId: number) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          matchUsers: true,
        },
      });

      if (!match) {
        throw new GlobalException(GlobalErrorCode.MATCH_NOT_FOUND);
      }

      if (match.status === 'COMPLETED') {
        throw new GlobalException(GlobalErrorCode.MATCH_ALREADY_COMPLETE);
      }

      // 참가자 확인
      const isParticipant = match.matchUsers.some((mu) => mu.userId === userId);
      if (!isParticipant) {
        throw new GlobalException(GlobalErrorCode.MATCH_NOT_AUTHORIZED);
      }
    },

    /**
     * 플레이어 연결 등록
     */
    async registerPlayerConnection(matchId: number, userId: number, socket: any): Promise<void> {
      // 이 매치의 WebSocket 맵 가져오기 또는 생성
      if (!fastify.matchSockets.has(matchId)) {
        fastify.matchSockets.set(matchId, new Map());
      }
      const sockets = fastify.matchSockets.get(matchId)!;

      // 이 사용자의 WebSocket 저장
      sockets.set(userId, socket);

      // 게임 상태가 없으면 초기화
      if (!fastify.matchStates.has(matchId)) {
        await fastify.gameService.initGameState(matchId);
      }

      // 패들 방향 초기화
      if (!fastify.paddleDirections.has(matchId)) {
        fastify.paddleDirections.set(matchId, new Map());
      }
      fastify.paddleDirections.get(matchId)?.set(userId, 'stop');
    },

    /**
     * 플레이어 인증
     */
    async authenticatePlayer(matchId: number, userId: number): Promise<{ isGameReady: boolean }> {
      // 인증 정보 저장
      if (!fastify.playerAuthenticated.has(matchId)) {
        fastify.playerAuthenticated.set(matchId, new Set());
      }

      const authenticated = fastify.playerAuthenticated.get(matchId)!;
      authenticated.add(userId);

      // 모든 플레이어가 인증되었는지 확인
      const gameState = fastify.matchStates.get(matchId)!;

      return { isGameReady: gameState != null && authenticated.size >= 2 };
    },

    /**
     * 패들 방향 업데이트
     */
    updatePaddleDirection(matchId: number, userId: number, direction: PaddleDirection): void {
      const directions = fastify.paddleDirections.get(matchId);
      if (directions) {
        directions.set(userId, direction);
      }
    },

    /**
     * 플레이어 연결 해제 처리
     */
    handlePlayerDisconnect(matchId: number, userId: number): void {
      // 소켓 삭제
      const sockets = fastify.matchSockets.get(matchId);
      if (sockets) {
        sockets.delete(userId);

        // 모든 플레이어가 나가면 게임 종료
        if (sockets.size === 0) {
          fastify.gameService.cleanupMatch(matchId);
        }
      }
    },

    /**
     * 매치 정리
     */
    cleanupMatch(matchId: number): void {
      // 게임 타이머 정리
      const interval = fastify.gameIntervals.get(matchId);
      if (interval) {
        clearInterval(interval);
        fastify.gameIntervals.delete(matchId);
      }

      // 데이터 정리
      fastify.matchStates.delete(matchId);
      fastify.playerAuthenticated.delete(matchId);
      fastify.paddleDirections.delete(matchId);
      fastify.matchSockets.delete(matchId);
    },

    /**
     * 게임 상태 초기화
     */
    async initGameState(matchId: number): Promise<void> {
      const matchUsers = await prisma.matchUser.findMany({
        where: { matchId: matchId },
      });

      if (matchUsers.length < 2) {
        throw new GlobalException(GlobalErrorCode.SERVER_INTERNAL_ERROR);
      }

      const gameState: GameState = {
        player1: {
          y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
          score: 0,
          userId: matchUsers[0].userId,
        },
        player2: {
          y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
          score: 0,
          userId: matchUsers[1].userId,
        },
        ball: {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          velocityX: 5,
          velocityY: 5,
        },
        isGameOver: false,
      };

      fastify.matchStates.set(matchId, gameState);
      fastify.playerAuthenticated.set(matchId, new Set());
      fastify.paddleDirections.set(matchId, new Map());
    },

    /**
     * 매치 시작
     */
    async startMatch(matchId: number): Promise<void> {
      try {
        // 매치 상태 업데이트
        await prisma.match.update({
          where: { id: matchId },
          data: { status: 'IN_PROGRESS' },
        });

        // 카운트다운 시작
        let countdown = 3;
        const countdownInterval = setInterval(() => {
          fastify.gameService.broadcastToMatch(matchId, {
            type: 'waiting',
            countDown: countdown,
          });

          countdown--;
          if (countdown < 0) {
            clearInterval(countdownInterval);

            // 게임 시작 메시지 전송
            fastify.gameService.broadcastToMatch(matchId, {
              type: 'game_start',
            });

            // 게임 루프 시작
            const interval = setInterval(
              () => fastify.gameService.updateGameLoop(matchId),
              1000 / 60,
            ); // 60fps
            fastify.gameIntervals.set(matchId, interval);
          }
        }, 1000);
      } catch (error) {
        console.error(`게임 시작 실패: ${error.message}`);
        throw error;
      }
    },

    /**
     * 게임 루프 업데이트
     */
    updateGameLoop(matchId: number): void {
      const gameState = fastify.matchStates.get(matchId);
      if (!gameState) return;

      // 패들 이동 업데이트
      fastify.gameService.updatePaddles(matchId, gameState);

      // 공 이동 및 충돌 처리
      fastify.gameService.updateBallPosition(gameState);

      // 득점 체크
      fastify.gameService.checkScoring(matchId, gameState);

      // 게임 종료 체크
      fastify.gameService.checkGameOver(matchId, gameState);

      // 게임 상태 업데이트 메시지 브로드캐스트
      fastify.gameService.broadcastGameState(matchId);
    },

    /**
     * 패들 위치 업데이트
     */
    updatePaddles(matchId: number, gameState: GameState): void {
      const directions = fastify.paddleDirections.get(matchId);
      if (!directions) return;

      // 플레이어 1 패들 업데이트
      if (directions.get(gameState.player1.userId) === 'up') {
        gameState.player1.y = Math.max(0, gameState.player1.y - PADDLE_SPEED);
      } else if (directions.get(gameState.player1.userId) === 'down') {
        gameState.player1.y = Math.min(
          CANVAS_HEIGHT - PADDLE_HEIGHT,
          gameState.player1.y + PADDLE_SPEED,
        );
      }

      // 플레이어 2 패들 업데이트
      if (directions.get(gameState.player2.userId) === 'up') {
        gameState.player2.y = Math.max(0, gameState.player2.y - PADDLE_SPEED);
      } else if (directions.get(gameState.player2.userId) === 'down') {
        gameState.player2.y = Math.min(
          CANVAS_HEIGHT - PADDLE_HEIGHT,
          gameState.player2.y + PADDLE_SPEED,
        );
      }
    },

    /**
     * 공 위치 및 충돌 업데이트
     */
    updateBallPosition(gameState: GameState): void {
      // 공 이동
      gameState.ball.x += gameState.ball.velocityX;
      gameState.ball.y += gameState.ball.velocityY;

      // 위아래 벽 충돌
      if (gameState.ball.y - BALL_RADIUS < 0 || gameState.ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
        gameState.ball.velocityY = -gameState.ball.velocityY;
      }

      // 패들과 충돌 체크
      fastify.gameService.checkPaddleCollisions(gameState);
    },

    /**
     * 패들 충돌 검사
     */
    checkPaddleCollisions(gameState: GameState): void {
      // 플레이어 1 패들 충돌
      if (
        gameState.ball.x - BALL_RADIUS <= 30 && // 패들 위치
        gameState.ball.x - BALL_RADIUS > 20 &&
        gameState.ball.y >= gameState.player1.y &&
        gameState.ball.y <= gameState.player1.y + PADDLE_HEIGHT
      ) {
        gameState.ball.velocityX = -gameState.ball.velocityX;
        const collidePoint =
          (gameState.ball.y - (gameState.player1.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        const angleRad = (Math.PI / 4) * collidePoint;
        const direction = gameState.ball.velocityX > 0 ? 1 : -1;
        gameState.ball.velocityX = direction * Math.cos(angleRad) * 7;
        gameState.ball.velocityY = Math.sin(angleRad) * 7;
      }

      // 플레이어 2 패들 충돌
      if (
        gameState.ball.x + BALL_RADIUS >= CANVAS_WIDTH - 30 && // 패들 위치
        gameState.ball.x + BALL_RADIUS < CANVAS_WIDTH - 20 &&
        gameState.ball.y >= gameState.player2.y &&
        gameState.ball.y <= gameState.player2.y + PADDLE_HEIGHT
      ) {
        gameState.ball.velocityX = -gameState.ball.velocityX;
        const collidePoint =
          (gameState.ball.y - (gameState.player2.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        const angleRad = (Math.PI / 4) * collidePoint;
        const direction = gameState.ball.velocityX > 0 ? 1 : -1;
        gameState.ball.velocityX = direction * Math.cos(angleRad) * 7;
        gameState.ball.velocityY = Math.sin(angleRad) * 7;
      }
    },

    /**
     * 득점 체크
     */
    checkScoring(matchId: number, gameState: GameState): void {
      // 플레이어 2 득점
      if (gameState.ball.x - BALL_RADIUS <= 0) {
        gameState.player2.score += 1;
        fastify.gameService.resetBall(gameState);
      }
      // 플레이어 1 득점
      else if (gameState.ball.x + BALL_RADIUS >= CANVAS_WIDTH) {
        gameState.player1.score += 1;
        fastify.gameService.resetBall(gameState);
      }
    },

    /**
     * 게임 종료 체크
     */
    checkGameOver(matchId: number, gameState: GameState): void {
      if (gameState.player1.score >= WIN_SCORE) {
        gameState.isGameOver = true;
        gameState.winner = gameState.player1.userId;
        fastify.gameService.endGame(matchId);
      } else if (gameState.player2.score >= WIN_SCORE) {
        gameState.isGameOver = true;
        gameState.winner = gameState.player2.userId;
        fastify.gameService.endGame(matchId);
      }
    },

    /**
     * 공 위치 초기화
     */
    resetBall(gameState: GameState): void {
      gameState.ball.x = CANVAS_WIDTH / 2;
      gameState.ball.y = CANVAS_HEIGHT / 2;
      gameState.ball.velocityX = -gameState.ball.velocityX;
      gameState.ball.velocityY = Math.random() * 10 - 5;
    },

    /**
     * 게임 종료 처리
     */
    async endGame(matchId: number): Promise<void> {
      const gameState = fastify.matchStates.get(matchId);
      if (!gameState || !gameState.isGameOver) return;

      const interval = fastify.gameIntervals.get(matchId);
      if (interval) {
        clearInterval(interval);
        fastify.gameIntervals.delete(matchId);
      }

      try {
        // 매치 결과 저장
        await prisma.match.update({
          where: { id: matchId },
          data: { status: 'COMPLETED' },
        });

        // 플레이어 점수 기록
        await fastify.gameService.updateMatchResults(matchId, gameState);

        // 게임 종료 메시지 브로드캐스트
        fastify.gameService.broadcastToMatch(matchId, {
          type: 'game_end',
          data: {
            winner: gameState.winner,
            player1Score: gameState.player1.score,
            player2Score: gameState.player2.score,
          },
        });
      } catch (error) {
        console.error(`게임 종료 처리 실패: ${error.message}`);
      }
    },

    /**
     * 매치 결과 업데이트
     */
    async updateMatchResults(matchId: number, gameState: GameState): Promise<void> {
      // 플레이어 1 결과 업데이트
      await prisma.matchUser.updateMany({
        where: {
          matchId: matchId,
          userId: gameState.player1.userId,
        },
        data: {
          score: gameState.player1.score,
          isWinner: gameState.winner === gameState.player1.userId,
        },
      });

      // 플레이어 2 결과 업데이트
      await prisma.matchUser.updateMany({
        where: {
          matchId: matchId,
          userId: gameState.player2.userId,
        },
        data: {
          score: gameState.player2.score,
          isWinner: gameState.winner === gameState.player2.userId,
        },
      });

      // 플레이어 전체 승패 기록 업데이트
      if (gameState.winner === gameState.player1.userId) {
        await fastify.gameService.updatePlayerStats(
          gameState.player1.userId,
          gameState.player2.userId,
        );
      } else {
        await fastify.gameService.updatePlayerStats(
          gameState.player2.userId,
          gameState.player1.userId,
        );
      }
    },

    /**
     * 플레이어 승패 통계 업데이트
     */
    async updatePlayerStats(winnerId: number, loserId: number): Promise<void> {
      // 승자 통계 업데이트
      await prisma.user.update({
        where: { id: winnerId },
        data: { wins: { increment: 1 } },
      });

      // 패자 통계 업데이트
      await prisma.user.update({
        where: { id: loserId },
        data: { losses: { increment: 1 } },
      });
    },

    /**
     * 게임 상태 브로드캐스트
     */
    broadcastGameState(matchId: number): void {
      const gameState = fastify.matchStates.get(matchId);
      if (!gameState) return;

      const message = {
        type: 'game_update',
        data: {
          player1: {
            y: gameState.player1.y,
            score: gameState.player1.score,
            userId: gameState.player1.userId,
          },
          player2: {
            y: gameState.player2.y,
            score: gameState.player2.score,
            userId: gameState.player2.userId,
          },
          ball: {
            x: gameState.ball.x,
            y: gameState.ball.y,
          },
        },
      };

      fastify.gameService.broadcastToMatch(matchId, message);
    },

    /**
     * 매치에 메시지 브로드캐스트
     */
    broadcastToMatch(matchId: number, message: any): void {
      const sockets = fastify.matchSockets.get(matchId);
      if (!sockets) return;

      sockets.forEach((ws) => {
        if (ws.readyState === 1) {
          // WebSocket.OPEN
          ws.send(JSON.stringify(message));
        }
      });
    },
  });
});
