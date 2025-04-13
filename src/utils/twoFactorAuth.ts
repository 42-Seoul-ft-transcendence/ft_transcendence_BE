import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

/**
 * 새로운 2FA 비밀키 생성
 * @param username 사용자 이름 또는 식별자
 * @param issuer 앱 이름 또는 발급자
 * @returns 비밀키 및 QR 코드 정보
 */
export const generateTwoFactorSecret = async (username: string, issuer = '42 ft_transcendence') => {
  // 새로운 비밀키 생성
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `${issuer}:${username}`,
    issuer,
  });

  // QR 코드 생성
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

  return {
    secret: secret.base32,
    qrCodeUrl,
    otpauthUrl: secret.otpauth_url,
  };
};

/**
 * 2FA 코드 검증
 * @param token 사용자가 입력한 토큰
 * @param secret 사용자의 비밀키
 * @returns 검증 결과 (true/false)
 */
export const verifyTwoFactorToken = (token: string, secret: string): boolean => {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: token.replace(/\s/g, ''),
      window: 1, // 앞뒤 30초 허용 (총 90초 유효)
    });
  } catch (error) {
    return false;
  }
};
