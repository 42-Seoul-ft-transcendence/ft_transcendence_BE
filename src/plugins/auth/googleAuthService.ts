import fp from 'fastify-plugin';
import fetch from 'node-fetch';
import { GOOGLE_USERINFO_URL } from '../../global/config';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException';
import { GoogleUserInfo } from '../../types/auth';

export default fp(async (fastify) => {
  fastify.decorate('googleAuthService', {
    async getGoogleUserInfo(googleAccessToken: string) {
      const res = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      if (!res.ok) {
        throw new GlobalException(GlobalErrorCode.AUTH_INVALID_TOKEN);
      }

      return (await res.json()) as GoogleUserInfo;
    },

    async findOrCreateUser(googleUserInfo) {
      const existingUser = await fastify.prisma.user.findUnique({
        where: { googleId: googleUserInfo.sub },
      });

      if (existingUser) {
        return { user: existingUser, isNewUser: false };
      }

      const email = googleUserInfo.email;
      const atIndex = email.indexOf('@');
      const name = atIndex !== -1 ? email.slice(0, atIndex) : email;

      const newUser = await fastify.prisma.user.create({
        data: {
          email: googleUserInfo.email,
          name: name,
          googleId: googleUserInfo.sub,
          image: googleUserInfo.picture,
          twoFactorEnabled: false,
        },
      });

      return { user: newUser, isNewUser: true };
    },
  });
});
