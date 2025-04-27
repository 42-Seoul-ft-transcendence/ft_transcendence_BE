import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { google } from 'googleapis';
import { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } from '../global/config';

// google.drive(...)가 리턴하는 타입을 그대로 뽑아 옵니다.
type DriveClient = ReturnType<typeof google.drive>;

declare module 'fastify' {
  interface FastifyInstance {
    googleDrive: { drive: DriveClient };
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    if (!GOOGLE_CLIENT_EMAIL) {
      throw new Error('GOOGLE_CLIENT_EMAIL이 설정되어 있지 않습니다');
    }
    if (!GOOGLE_PRIVATE_KEY) {
      throw new Error('GOOGLE_PRIVATE_KEY가 설정되어 있지 않습니다');
    }

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: GOOGLE_CLIENT_EMAIL,
          private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      const driveClient = google.drive({ version: 'v3', auth });
      fastify.decorate('googleDrive', { drive: driveClient });
    } catch (err) {
      console.error('Google Drive 플러그인 초기화 에러:', err);
      throw err;
    }
  },
  {
    name: 'googleDrive',
    fastify: '5.x',
  },
);
