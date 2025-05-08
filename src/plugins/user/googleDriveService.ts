import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Readable } from 'stream';
import { GlobalErrorCode } from '../../global/exceptions/globalException.js';
import { GlobalException } from '../../global/exceptions/globalException.js';

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate('googleDriveService', {
      async uploadFile(name: string, buffer: Buffer, mimeType: string, folderId: string) {
        const driveRes = await fastify.googleDrive.drive.files.create({
          requestBody: { name, parents: [folderId] },
          media: { mimeType, body: Readable.from(buffer) },
          fields: 'id',
        });
        if (!driveRes.data?.id) {
          throw new GlobalException(GlobalErrorCode.DRIVE_FILE_ID_NOT_FOUND);
        }
        const fileId = driveRes.data.id;
        await fastify.googleDrive.drive.permissions.create({
          fileId,
          requestBody: { role: 'reader', type: 'anyone' },
        });
        return fileId;
      },
    });
  },
  {
    name: 'googleDriveService',
    fastify: '5.x',
  },
);
