import fp from 'fastify-plugin';
import fetch from 'node-fetch';
import { GOOGLE_USERINFO_URL } from '../../global/config';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException';

export default fp(async (fastify) => {
  fastify.decorate('googleAuthService', {
    async getGoogleUserInfo(googleAccessToken: string) {
      const res = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      if (!res.ok) {
        throw new GlobalException(GlobalErrorCode.AUTH_INVALID_TOKEN);
      }

      return await res.json();
    },

    async findOrCreateUser(googleUser) {
      const { sub: googleId, email, picture } = googleUser;

      const existingUser = await fastify.prisma.user.findUnique({
        where: { googleId },
      });

      if (existingUser) {
        return { user: existingUser, isNewUser: false };
      }

      const newUser = await fastify.prisma.user.create({
        data: {
          email,
          name: googleId,
          googleId,
          image: picture,
          twoFactorEnabled: false,
        },
      });

      return { user: newUser, isNewUser: true };
    },
  });
});
