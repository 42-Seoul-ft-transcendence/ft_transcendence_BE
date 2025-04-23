// src/routes/match.ts
import { FastifyInstance } from 'fastify';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../../global/config';

const WIN_SCORE = 11;
const AUTH_TIMEOUT_MS = 10000;

export default async function matchRoutes(fastify: FastifyInstance) {
  fastify.decorate('matchSockets', new Map<string, Map<string, WebSocket>>());
  // 매치 웹소켓 소켓 저장을 위한 맵 초기화
  fastify.addHook('onReady', () => {
    fastify.matchSockets = new Map();
  });

  // WebSocket 연결 설정
  fastify.get('/ws/match/:matchId', { websocket: true }, (connection, request) => {
    const { matchId } = request.params as { matchId: string };
    let isAuthenticated = false;
    let userId: number;

    fastify.log.info(`새로운 웹소켓 연결 요청: 매치 ${matchId}`);

    // 인증 타임아웃 설정
    const authTimeout = setTimeout(() => {
      if (!isAuthenticated) {
        sendError(connection, '인증 시간이 초과되었습니다.');
        connection.close();
      }
    }, AUTH_TIMEOUT_MS);

    // 클라이언트로부터 메시지 수신
    connection.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        // 인증되지 않은 상태에서는 인증 메시지만 허용
        if (!isAuthenticated) {
          await handleUnauthenticatedMessage(data, connection, matchId, fastify);
          if (data.type === 'authenticate' && data.token) {
            try {
              const result = await authenticateUser(data.token, parseInt(matchId), fastify);
              if (result.success) {
                if (result.userId != null) {
                  userId = result.userId;
                }
                isAuthenticated = true;
                clearTimeout(authTimeout);

                registerSocketConnection(userId, matchId, connection, fastify);
                connection.send(
                  JSON.stringify({
                    type: 'authenticated',
                    message: '인증에 성공했습니다.',
                  }),
                );

                await checkGameStart(parseInt(matchId), fastify);
              } else {
                sendError(connection, result.message);
                connection.close();
              }
            } catch (err) {
              fastify.log.error(`토큰 검증 중 오류: ${err}`);
              sendError(connection, '인증에 실패했습니다.');
              connection.close();
            }
          }
        } else {
          // 인증된 상태에서의 메시지 처리
          await handleAuthenticatedMessage(data, userId, parseInt(matchId), fastify);
        }
      } catch (err) {
        fastify.log.error(`메시지 처리 중 오류: ${err}`);
      }
    });

    // 연결 종료 처리
    connection.on('close', () => {
      clearTimeout(authTimeout);

      if (isAuthenticated && userId) {
        handleDisconnection(userId, matchId, fastify);
      }
    });
  });
}

// 인증되지 않은 사용자의 메시지 처리
async function handleUnauthenticatedMessage(
  data: any,
  connection: any,
  matchId: string,
  fastify: FastifyInstance,
) {
  if (data.type !== 'authenticate') {
    sendError(connection, '인증이 필요합니다. authenticate 메시지를 먼저 보내세요.');
  }
}

// 사용자 인증 처리
async function authenticateUser(
  token: string,
  matchId: number,
  fastify: FastifyInstance,
): Promise<{
  success: boolean;
  userId?: number;
  message?: string;
}> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    // 매치 참여 권한 확인
    const matchUser = await fastify.prisma.matchUser.findFirst({
      where: {
        matchId: matchId,
        userId: userId,
      },
      include: {
        match: true,
      },
    });

    if (!matchUser) {
      return { success: false, message: '해당 매치에 참여 권한이 없습니다.' };
    }

    // 매치 상태 확인
    if (matchUser.match.status === 'COMPLETED') {
      return { success: false, message: '이미 종료된 매치입니다.' };
    }

    return { success: true, userId: userId };
  } catch (err) {
    return { success: false, message: '토큰이 유효하지 않습니다.' };
  }
}

// 소켓 연결 등록
function registerSocketConnection(
  userId: number,
  matchId: string,
  socket: any,
  fastify: FastifyInstance,
) {
  if (!fastify.matchSockets.has(matchId)) {
    fastify.matchSockets.set(matchId, new Map());
  }

  const matchSockets = fastify.matchSockets.get(matchId);
  matchSockets?.set(userId.toString(), socket);

  // 다른 플레이어에게 새 플레이어 연결 알림
  notifyOtherPlayers(userId, matchId, 'player_connected', { userId }, fastify);
}

// 게임 시작 조건 확인
async function checkGameStart(matchId: number, fastify: FastifyInstance) {
  const allMatchUsers = await fastify.prisma.matchUser.findMany({
    where: { matchId: matchId },
  });

  const matchSockets = fastify.matchSockets.get(matchId.toString());
  if (!matchSockets) return;

  const connectedCount = matchSockets.size;
  const totalPlayers = allMatchUsers.length;

  // 대기 중 메시지 전송
  broadcastToMatch(
    matchId.toString(),
    {
      type: 'waiting',
      data: {
        connectedPlayers: connectedCount,
        totalPlayers: totalPlayers,
      },
    },
    fastify,
  );

  // 게임 시작 조건 확인
  if (connectedCount === totalPlayers) {
    // 매치 상태 업데이트
    await fastify.prisma.match.update({
      where: { id: matchId },
      data: { status: 'IN_PROGRESS' },
    });

    // 게임 시작 메시지 전송
    broadcastToMatch(
      matchId.toString(),
      {
        type: 'game_start',
        data: {
          matchId: matchId,
          players: allMatchUsers.map((mu) => ({
            userId: mu.userId,
            score: 0,
          })),
        },
      },
      fastify,
    );
  }
}

/**
 * TODO 게임 로직 수정 필요
 */
// 인증된 사용자의 메시지 처리
async function handleAuthenticatedMessage(
  data: any,
  userId: number,
  matchId: number,
  fastify: FastifyInstance,
) {
  switch (data.type) {
    case 'game_update':
      // 게임 상태 업데이트 처리 (패들 이동 등)
      notifyOtherPlayers(userId, matchId.toString(), 'game_update', data.data, fastify);
      break;

    case 'score_update':
      await handleScoreUpdate(userId, matchId, data.data.score, fastify);
      break;

    default:
      fastify.log.warn(`알 수 없는 메시지 타입: ${data.type}`);
  }
}

// 점수 업데이트 처리
async function handleScoreUpdate(
  userId: number,
  matchId: number,
  score: number,
  fastify: FastifyInstance,
) {
  // 점수 업데이트
  await fastify.prisma.matchUser.update({
    where: {
      matchId_userId: {
        matchId: matchId,
        userId: userId,
      },
    },
    data: {
      score: score,
    },
  });

  // 다른 플레이어에게 점수 업데이트 알림
  broadcastToMatch(
    matchId.toString(),
    {
      type: 'score_update',
      data: {
        userId: userId,
        score: score,
      },
    },
    fastify,
  );

  // 게임 종료 조건 확인
  await checkGameEnd(matchId, fastify);
}

// 게임 종료 조건 확인
async function checkGameEnd(matchId: number, fastify: FastifyInstance) {
  const currentMatchUsers = await fastify.prisma.matchUser.findMany({
    where: { matchId: matchId },
  });

  const winner = currentMatchUsers.find((mu) => mu.score >= WIN_SCORE);

  if (winner) {
    await handleGameEnd(matchId, winner.userId, fastify);
  }
}

// 게임 종료 처리
async function handleGameEnd(matchId: number, winnerId: number, fastify: FastifyInstance) {
  // 승자 설정
  await fastify.prisma.matchUser.update({
    where: {
      matchId_userId: {
        matchId: matchId,
        userId: winnerId,
      },
    },
    data: { isWinner: true },
  });

  // 매치 완료로 상태 변경
  await fastify.prisma.match.update({
    where: { id: matchId },
    data: { status: 'COMPLETED' },
  });

  // 게임 종료 메시지 전송
  broadcastToMatch(
    matchId.toString(),
    {
      type: 'game_end',
      data: {
        winnerId: winnerId,
        matchId: matchId,
      },
    },
    fastify,
  );

  // 토너먼트 관련 처리
  await handleTournamentProgress(matchId, fastify);
}

// 토너먼트 진행 상태 처리
async function handleTournamentProgress(matchId: number, fastify: FastifyInstance) {
  const match = await fastify.prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!match) return;

  if (match.tournament.type === '4P' && match.round === 1) {
    // 예선전 매치 확인
    const prelimMatches = await fastify.prisma.match.findMany({
      where: {
        tournamentId: match.tournamentId,
        round: 1,
        status: 'COMPLETED',
      },
      include: {
        matchUsers: {
          where: { isWinner: true },
        },
      },
    });

    // 모든 예선전이 완료되었는지 확인
    if (prelimMatches.length === 2) {
      // 결승전 생성
      await fastify.prisma.match.create({
        data: {
          tournamentId: match.tournamentId,
          round: 2,
          status: 'PENDING',
          matchUsers: {
            create: prelimMatches.map((m) => ({
              userId: m.matchUsers[0].userId,
              score: 0,
              isWinner: false,
            })),
          },
        },
      });
    }
  } else if (match.tournament.type === '4P' && match.round === 2) {
    // 결승전이 끝난 경우 토너먼트 완료 처리
    await fastify.prisma.tournament.update({
      where: { id: match.tournamentId },
      data: { status: 'COMPLETED' },
    });
  } else if (match.tournament.type === '2P') {
    // 2P 토너먼트는 한 매치로 종료
    await fastify.prisma.tournament.update({
      where: { id: match.tournamentId },
      data: { status: 'COMPLETED' },
    });
  }
}

// 연결 종료 처리
function handleDisconnection(userId: number, matchId: string, fastify: FastifyInstance) {
  fastify.log.info(`사용자 ${userId}가 매치 ${matchId}에서 연결 종료`);

  if (fastify.matchSockets && fastify.matchSockets.has(matchId)) {
    const matchSockets = fastify.matchSockets.get(matchId);
    matchSockets?.delete(userId.toString());

    // 나머지 플레이어에게 연결 종료 알림
    notifyOtherPlayers(userId, matchId, 'player_disconnected', { userId }, fastify);

    // 모든 연결이 종료되었다면 맵에서 제거
    if (matchSockets?.size === 0) {
      fastify.matchSockets.delete(matchId);
    }
  }
}

// 오류 메시지 전송
function sendError(socket: any, message?: string) {
  socket.send(
    JSON.stringify({
      type: 'error',
      message: message,
    }),
  );
}

// 다른 플레이어에게 알림
function notifyOtherPlayers(
  userId: number,
  matchId: string,
  type: string,
  data: any,
  fastify: FastifyInstance,
) {
  const matchSockets = fastify.matchSockets.get(matchId);
  if (!matchSockets) return;

  matchSockets.forEach((socket, playerId) => {
    if (playerId !== userId.toString()) {
      socket.send(
        JSON.stringify({
          type: type,
          data: data,
        }),
      );
    }
  });
}

// 매치의 모든 플레이어에게 메시지 전송
function broadcastToMatch(matchId: string, message: any, fastify: FastifyInstance) {
  const matchSockets = fastify.matchSockets.get(matchId);
  if (!matchSockets) return;

  matchSockets.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
}
