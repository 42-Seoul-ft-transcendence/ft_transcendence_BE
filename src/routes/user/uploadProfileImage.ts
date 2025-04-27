import { FastifyPluginAsync } from 'fastify';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { uploadImageSchema } from '../../schemas/user/userSchema';
import { GDRIVE_FOLDER_ID } from '../../global/config';

const userImageRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/me/image',
    { schema: uploadImageSchema, preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        // 파일 추출 및 에러 처리
        let data;
        try {
          data = await request.file({ limits: { fileSize: 100 * 1024 * 1024 } });
          if (!data) {
            throw fastify.httpErrors.badRequest('파일이 업로드되지 않았습니다.');
          }
        } catch (error) {
          throw fastify.httpErrors.badRequest('파일 업로드 중 오류가 발생했습니다.');
        }

        // 파일 MIME 타입 검증
        const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowed.includes(data.mimetype)) {
          throw fastify.httpErrors.unsupportedMediaType('PNG/JPG만 업로드 가능합니다.');
        }

        // 스트림 → Buffer 변환
        const buffer = await data.toBuffer().catch(() => {
          throw fastify.httpErrors.internalServerError('파일 처리 중 오류가 발생했습니다.');
        });

        // 기존 코드
        // const filename = `${uuidv4()}${path.extname(data.filename)}`;

        // 절대경로(전체 경로) 포함
        const filename = `${uuidv4()}_${data.filename}`;

        // Google Drive 업로드
        const driveRes = await fastify.googleDrive.drive.files
          .create({
            requestBody: {
              name: filename,
              parents: [GDRIVE_FOLDER_ID ?? ''],
            },
            media: {
              mimeType: data.mimetype,
              body: Readable.from(buffer),
            },
            fields: 'id',
          })
          .catch(() => {
            throw fastify.httpErrors.internalServerError(
              'Google Drive 업로드 중 오류가 발생했습니다.',
            );
          });

        if (!driveRes?.data?.id) {
          throw fastify.httpErrors.internalServerError('파일 ID를 가져올 수 없습니다.');
        }
        const fileId = driveRes.data.id;

        // 공개 권한 설정
        await fastify.googleDrive.drive.permissions
          .create({
            fileId,
            requestBody: { role: 'reader', type: 'anyone' },
          })
          .catch(() => {
            throw fastify.httpErrors.internalServerError('권한 설정 중 오류가 발생했습니다.');
          });

        const imageUrl = `https://drive.google.com/uc?id=${fileId}`;

        // DB 업데이트
        try {
          await fastify.prisma.user.update({
            where: { id: userId },
            data: { image: imageUrl },
          });
        } catch (err) {
          // 실제 에러 로그로 남깁니다
          fastify.log.error({ err }, 'Prisma user.update() failed');
          throw fastify.httpErrors.internalServerError(
            '데이터베이스 업데이트 중 오류가 발생했습니다.',
          );
        }

        return reply.send({ image: imageUrl });
      } catch (error) {
        throw error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.');
      }
    },
  );
};

export default userImageRoute;
