import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_EXPIRES_IN, JWT_SECRET, REFRESH_TOKEN_EXPIRES_IN } from '../global/config';
import { GlobalErrorCode, GlobalException } from '../global/exceptions/globalException';

interface JwtPayload {
  userId: number;
  iat?: number; // issued at
  exp?: number; // expiration
}

export function generateAccessToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function generateRefreshToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * JWT 토큰 검증
 * @param token JWT 토큰
 * @returns 디코딩된 페이로드 또는 null (유효하지 않은 경우)
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new GlobalException(GlobalErrorCode.AUTH_INVALID_TOKEN);
  }
}

/**
 * 리프레시 토큰 검증
 * @param refreshToken 리프레시 토큰
 * @returns 유효한 경우 사용자 ID, 아니면 null
 */
export function verifyRefreshToken(refreshToken: string): number | null {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload;
    return decoded.userId;
  } catch (error) {
    throw new GlobalException(GlobalErrorCode.AUTH_INVALID_TOKEN);
  }
}
