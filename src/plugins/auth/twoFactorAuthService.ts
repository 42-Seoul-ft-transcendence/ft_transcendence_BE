import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { generateTwoFactorSecret, verifyTwoFactorToken } from '../../utils/twoFactorAuth';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { decrypt, encrypt } from '../../utils/encryption';

interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

interface TwoFactorVerifyResponse {
  success: boolean;
  backupCodes?: string[];
}

interface TwoFactorAuthResponse {
  accessToken: string;
  refreshToken: string;
}

export default fp(async (fastify: FastifyInstance) => {
  const prisma = fastify.prisma as PrismaClient;

  fastify.decorate('twoFactorAuthService', {
    /**
     * 2FA 설정 초기화 - QR 코드 및 비밀키 생성
     */
    async setupTwoFactor(userId: number): Promise<TwoFactorSetupResponse> {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      // 이미 2FA가 활성화된 경우
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        throw new GlobalException(GlobalErrorCode.TWO_FACTOR_ALREADY_ENABLED);
      }

      const { secret, qrCodeUrl } = await generateTwoFactorSecret(user.email);

      return {
        secret,
        qrCodeUrl,
      };
    },

    /**
     * 2FA 설정 검증 및 활성화
     */
    async verifyAndEnableTwoFactor(
      userId: number,
      token: string,
      secret: string,
    ): Promise<TwoFactorVerifyResponse> {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      // 토큰 검증
      const isValid = verifyTwoFactorToken(token, secret);

      if (!isValid) {
        throw new GlobalException(GlobalErrorCode.TWO_FACTOR_INVALID_TOKEN);
      }

      // 사용자 정보 업데이트
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: encrypt(secret),
          // 백업 코드 저장 로직은 필요시 추가
        },
      });

      return {
        success: true,
      };
    },

    /**
     * 2FA 로그인 검증
     */
    async verifyTwoFactorAuth(userId: number, token: string): Promise<TwoFactorAuthResponse> {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new GlobalException(GlobalErrorCode.TWO_FACTOR_NOT_ENABLED);
      }

      // 토큰 검증
      const decryptedSecret = decrypt(user.twoFactorSecret);
      const isValid = verifyTwoFactorToken(token, decryptedSecret);

      if (!isValid) {
        throw new GlobalException(GlobalErrorCode.TWO_FACTOR_INVALID_TOKEN);
      }

      // 로그인 성공 - 토큰 발급
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      return {
        accessToken,
        refreshToken,
      };
    },

    /**
     * 2FA 비활성화
     */
    async disableTwoFactor(userId: number): Promise<{ success: boolean }> {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }

      if (!user.twoFactorEnabled) {
        throw new GlobalException(GlobalErrorCode.TWO_FACTOR_NOT_ENABLED);
      }

      // 2FA 비활성화
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      return { success: true };
    },
  });
});
