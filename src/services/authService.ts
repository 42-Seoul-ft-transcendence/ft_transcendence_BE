import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

export class AuthService {
  /**
   * 사용자 ID로 접근 토큰과 리프레시 토큰 생성
   */
  generateTokens(userId: number) {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
    };
  }
}
