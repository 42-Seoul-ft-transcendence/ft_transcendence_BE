import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { google } from 'googleapis';
import { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } from '../global/config';

export default fp(
  async (fastify: FastifyInstance) => {
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
