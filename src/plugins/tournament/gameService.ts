// src/plugins/tournament/gameService.ts
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException.js';
import { GAME_CONSTANTS, GameState, PaddleDirection } from '../../types/game.js';

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
    async handlePlayerDisconnect(matchId: number, userId: number) {
      // 소켓 삭제
      const sockets = fastify.matchSockets.get(matchId);
      if (sockets) {
        sockets.delete(userId);

        // 게임 상태 확인
        const gameState = fastify.matchStates.get(matchId);
        if (gameState && !gameState.isGameOver) {
          // 게임이 진행 중이었다면 남은 플레이어 승리 처리
          if (gameState.player1.userId === userId) {
            gameState.winner = gameState.player2.userId;
          } else if (gameState.player2.userId === userId) {
            gameState.winner = gameState.player1.userId;
          }
          gameState.isGameOver = true;
          gameState.disconnected = true;
          await fastify.gameService.endGame(matchId);
        }
      }
      fastify.gameService.cleanupMatch(matchId);
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
        isPaused: false,
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

      // 일시정지 상태 체크 및 처리
      if (fastify.gameService.checkPauseState(matchId, gameState)) {
        return; // 일시정지 중이면 여기서 종료
      }

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
     * 일시정지 상태 확인 및 처리
     */
    checkPauseState(matchId: number, gameState: GameState): boolean {
      if (gameState.isPaused) {
        // 일시정지 시간이 지났는지 확인
        if (gameState.pauseEndTime && Date.now() >= gameState.pauseEndTime) {
          // 일시정지 해제
          gameState.isPaused = false;
          delete gameState.pauseEndTime;

          // 공 속도 재설정
          const directionX = Math.random() > 0.5 ? 5 : -5;
          gameState.ball.velocityX = directionX;
          gameState.ball.velocityY = Math.random() * 10 - 5;
        }

        // 일시정지 중에는 공 움직임 업데이트하지 않음
        // 하지만 게임 상태는 계속 브로드캐스트
        fastify.gameService.broadcastGameState(matchId);
        return true; // 일시정지 중임을 반환
      }

      return false; // 일시정지 중이 아님
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

      gameState.isPaused = true;
      gameState.pauseEndTime = Date.now() + 500; // 0.5초 후 재개
    },

    // src/plugins/tournament/gameService.ts
    // Update the endGame method to set up timeout for the final match in 4P tournaments

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
          disconnected: gameState.disconnected || false,
        },
      });

      // 매치 정보 가져오기
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          tournament: true,
          matchUsers: {
            where: { isWinner: true },
            select: { userId: true },
          },
        },
      });

      if (!match) throw new GlobalException(GlobalErrorCode.MATCH_NOT_FOUND);

      // 토너먼트가 4P 타입인 경우
      if (match.tournament.type === '4P') {
        if (match.round === 1) {
          // 라운드 1의 모든 매치가 완료되었는지 확인
          const allRound1Matches = await prisma.match.findMany({
            where: {
              tournamentId: match.tournamentId,
              round: 1,
            },
          });

          const allCompleted = allRound1Matches.every((m) => m.status === 'COMPLETED');

          if (allCompleted) {
            // 라운드 1 승자들 찾기
            const round1Winners = await prisma.matchUser.findMany({
              where: {
                match: {
                  tournamentId: match.tournamentId,
                  round: 1,
                },
                isWinner: true,
              },
              select: { userId: true },
            });

            // 라운드 2 (결승전) 생성
            const finalMatch = await prisma.match.create({
              data: {
                tournamentId: match.tournamentId,
                round: 2,
                status: 'PENDING',
                matchUsers: {
                  create: round1Winners.map((winner) => ({
                    userId: winner.userId,
                    score: 0,
                    isWinner: false,
                  })),
                },
              },
            });

            console.log(`라운드 2 결승전 매치 생성됨: ${finalMatch.id}`);

            // 결승전 매치 연결 타임아웃 설정
            await fastify.gameService.setupMatchConnectionTimeout(finalMatch.id);
          }
        } else if (match.round === 2) {
          // 결승전이 종료되면 토너먼트 상태를 COMPLETED로 변경
          await prisma.tournament.update({
            where: { id: match.tournamentId },
            data: { status: 'COMPLETED' },
          });

          console.log(`토너먼트 ${match.tournamentId} 완료됨`);
        }
      } else if (match.tournament.type === '2P') {
        // 2P 토너먼트는 한 매치만 있으므로 바로 토너먼트 완료 처리
        await prisma.tournament.update({
          where: { id: match.tournamentId },
          data: { status: 'COMPLETED' },
        });

        console.log(`토너먼트 ${match.tournamentId} 완료됨`);
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

    /**
     * 매치 연결 타임아웃 설정
     */
    async setupMatchConnectionTimeout(matchId: number): Promise<void> {
      console.log(`매치 ${matchId}의 연결 타임아웃 설정 (10초)`);

      // 10초 후에 실행될 타임아웃
      setTimeout(async () => {
        // 매치 정보 가져오기
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: {
            matchUsers: true,
          },
        });

        if (!match || match.status === 'COMPLETED') {
          return; // 이미 완료된 매치는 무시
        }

        // 인증된 플레이어 목록 확인
        const authenticated = fastify.playerAuthenticated.get(matchId) || new Set();
        console.log(`매치 ${matchId} 타임아웃 체크: 연결된 플레이어 ${authenticated.size}명`);

        // 연결된 플레이어가 없는 경우
        if (authenticated.size === 0) {
          console.log(`매치 ${matchId}: 양쪽 플레이어 모두 연결되지 않음, 랜덤 승자 결정`);

          // 랜덤으로 승자 선택
          const randomWinnerIndex = Math.floor(Math.random() * match.matchUsers.length);
          const winnerId = match.matchUsers[randomWinnerIndex].userId;

          // 게임 상태 초기화 (아직 초기화되지 않은 경우)
          if (!fastify.matchStates.has(matchId)) {
            await fastify.gameService.initGameState(matchId);
          }

          // 승자 설정 및 게임 종료
          const gameState = fastify.matchStates.get(matchId)!;
          gameState.isGameOver = true;
          gameState.winner = winnerId;
          gameState.disconnected = true;

          // 플레이어 연결 맵 초기화
          if (!fastify.matchSockets.has(matchId)) {
            fastify.matchSockets.set(matchId, new Map());
          }

          // 게임 종료 처리
          await fastify.gameService.endGame(matchId);
        }
        // 한 명만 연결된 경우
        else if (authenticated.size === 1) {
          console.log(`매치 ${matchId}: 한 명만 연결됨, 연결된 플레이어 승리`);

          // 연결된 플레이어를 승자로 설정
          const connectedPlayerId = Array.from(authenticated)[0];

          // 게임 상태 초기화 (아직 초기화되지 않은 경우)
          if (!fastify.matchStates.has(matchId)) {
            await fastify.gameService.initGameState(matchId);
          }

          // 승자 설정 및 게임 종료
          const gameState = fastify.matchStates.get(matchId)!;
          gameState.isGameOver = true;
          gameState.winner = connectedPlayerId;
          gameState.disconnected = true;

          // 게임 종료 처리
          await fastify.gameService.endGame(matchId);
        }
        // 양쪽 다 연결된 경우는 정상 진행
      }, 10000); // 10초 타임아웃
    },
  });
});
