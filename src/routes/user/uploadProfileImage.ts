import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { uploadImageSchema } from '../../schemas/user/userSchema';
import { GDRIVE_FOLDER_ID } from '../../global/config';
import { MultipartFile } from '@fastify/multipart';

const userImageRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/me/image',
    { schema: uploadImageSchema, preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const body = request.body as { image: MultipartFile | MultipartFile[] };
        const data = Array.isArray(body.image) ? body.image[0] : body.image;

        if (!data) {
          throw fastify.httpErrors.badRequest('파일이 업로드되지 않았습니다.');
        }

        // 파일 MIME 타입 검증
        const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowed.includes(data.mimetype)) {
          throw fastify.httpErrors.unsupportedMediaType('PNG/JPG만 업로드 가능합니다.');
        }

        const buffer = await data.toBuffer(); // 스트림 → 버퍼 변환

        const filename = `${uuidv4()}_${data.filename}`;

        const driveRes = await fastify.googleDrive.drive.files.create({
          requestBody: {
            name: filename,
            parents: [GDRIVE_FOLDER_ID ?? ''],
          },
          media: {
            mimeType: data.mimetype,
            body: Readable.from(buffer),
          },
          fields: 'id',
        });

        if (!driveRes?.data?.id) {
          throw fastify.httpErrors.internalServerError('파일 ID를 가져올 수 없습니다.');
        }
        const fileId = driveRes.data.id;

        await fastify.googleDrive.drive.permissions.create({
          fileId,
          requestBody: { role: 'reader', type: 'anyone' },
        });

        const imageUrl = `https://drive.google.com/uc?id=${fileId}`;

        await fastify.prisma.user.update({
          where: { id: userId },
          data: { image: imageUrl },
        });

        return reply.send({ image: imageUrl });
      } catch (error) {
        throw error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.');
      }
    },
  );
};

export default userImageRoute;
