import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import { GOOGLE_USERINFO_URL } from '../config';
import { GoogleUser } from '../types/auth';
import { GlobalErrorCode, GlobalException } from '../exceptions/globalException';

export class GoogleAuthService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Google 액세스 토큰으로 사용자 정보 조회
   */
  async getGoogleUserInfo(googleAccessToken: string): Promise<GoogleUser> {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!res.ok) {
      throw new GlobalException(GlobalErrorCode.AUTH_INVALID_TOKEN);
    }

    return (await res.json()) as GoogleUser;
  }

  /**
   * Google 사용자 정보로 로그인 또는 회원가입 처리
   */
  async findOrCreateUser(googleUser: GoogleUser) {
    const { sub: googleId, email, picture } = googleUser;

    // Google ID로 사용자 조회
    const existingUser = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (existingUser) {
      return { user: existingUser, isNewUser: false };
    }

    // 새 사용자 생성
    const newUser = await this.prisma.user.create({
      data: {
        email,
        name: googleId,
        googleId,
        image: picture,
        twoFactorEnabled: false,
      },
    });

    return { user: newUser, isNewUser: true };
  }
}
