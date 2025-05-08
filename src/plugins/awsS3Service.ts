import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { GlobalException, GlobalErrorCode } from '../global/exceptions/globalException';
import { v4 as uuidv4 } from 'uuid';
import path from 'node:path';
import { AWS_REGION, AWS_S3_BUCKET_NAME } from '../global/config';
import { MultipartFile } from '@fastify/multipart';

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('awsS3Service', {
    /**
     * 파일을 S3에 업로드합니다.
     * @param fileName 파일 이름
     * @param buffer 파일 데이터
     * @param mimeType 파일 MIME 타입
     * @param folder 저장할 폴더 경로 (선택사항)
     * @returns 업로드된 파일의 URL
     */
    async uploadFile(
      fileName: string,
      buffer: Buffer,
      mimeType: string,
      folder?: string,
    ): Promise<string> {
      try {
        // 키 생성 (폴더가 있으면 포함)
        const key = folder ? `${folder}/${fileName}` : fileName;

        const command = new PutObjectCommand({
          Bucket: AWS_S3_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        });

        await fastify.awsS3.s3.send(command);

        // S3 URL 반환
        return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
      } catch (err) {
        fastify.log.error('S3 파일 업로드 에러:', err);
        throw new GlobalException(
          GlobalErrorCode.SERVER_INTERNAL_ERROR,
          err instanceof Error ? err.message : String(err),
        );
      }
    },

    /**
     * 사용자 이미지를 S3에 업로드합니다.
     * @param userId 사용자 ID
     * @param file MultipartFile 형식의 파일
     * @returns 업로드된 이미지 URL
     */
    async uploadUserImage(userId: number, file: MultipartFile): Promise<string> {
      try {
        // MIME 타입 검증
        const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowed.includes(file.mimetype)) {
          throw new GlobalException(GlobalErrorCode.UNSUPPORTED_MEDIA_TYPE);
        }

        const buffer = await file.toBuffer();
        const fileExtension = path.extname(file.filename);
        const fileName = `${uuidv4()}${fileExtension}`;

        // 사용자 이미지 폴더 경로
        const folderPath = `user-images/${userId}`;

        // S3에 이미지 업로드
        return await fastify.awsS3Service.uploadFile(fileName, buffer, file.mimetype, folderPath);
      } catch (err) {
        throw new GlobalException(
          GlobalErrorCode.SERVER_INTERNAL_ERROR,
          '이미지 업로드 중 오류가 발생했습니다.',
        );
      }
    },
  });
});
