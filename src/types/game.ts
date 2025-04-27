// src/types/game.ts

// 패들 방향 타입
export type PaddleDirection = 'up' | 'down' | 'stop';

// 게임 상태 인터페이스
export interface GameState {
  player1: {
    y: number;
    score: number;
    userId: number;
  };
  player2: {
    y: number;
    score: number;
    userId: number;
  };
  ball: {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
  };
  isGameOver: boolean;
  winner?: number;
  disconnected?: boolean;
}

// 게임 설정 상수
export const GAME_CONSTANTS = {
  WIN_SCORE: 5,
  AUTH_TIMEOUT_MS: 10000,
  PADDLE_HEIGHT: 100,
  PADDLE_SPEED: 10,
  CANVAS_HEIGHT: 530,
  CANVAS_WIDTH: 1440,
  BALL_RADIUS: 10,
};
