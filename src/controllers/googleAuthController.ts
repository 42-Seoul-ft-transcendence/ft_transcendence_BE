import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { GoogleAuthService } from '../services/googleAuthService';
import { AuthService } from '../services/authService';

export class GoogleAuthController {
  private googleAuthService: GoogleAuthService;
  private authService: AuthService;

  constructor(prisma: PrismaClient) {
    this.googleAuthService = new GoogleAuthService(prisma);
    this.authService = new AuthService();
  }

  /**
   * Google 로그인 처리 핸들러
   */
  async handleGoogleLogin(request: FastifyRequest, reply: FastifyReply) {
    const { googleAccessToken } = request.body as { googleAccessToken: string };

    // Google 사용자 정보 가져오기
    const googleUser = await this.googleAuthService.getGoogleUserInfo(googleAccessToken);

    // 사용자 찾기 또는 생성
    const { user, isNewUser } = await this.googleAuthService.findOrCreateUser(googleUser);

    // 토큰 생성
    const { accessToken, refreshToken } = this.authService.generateTokens(user.id);

    // 응답 반환
    return reply.send({
      accessToken,
      refreshToken,
      message: isNewUser ? '회원가입 성공' : '로그인 성공',
    });
  }
}
