import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { S3Client } from '@aws-sdk/client-s3';
import { GlobalException, GlobalErrorCode } from '../global/exceptions/globalException';
import { AWS_REGION, AWS_S3_ACCESS, AWS_S3_SECRET } from '../global/config';

export default fp(
  async (fastify: FastifyInstance) => {
    try {
      // S3 클라이언트 초기화
      const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_S3_ACCESS,
          secretAccessKey: AWS_S3_SECRET,
        },
      });

      // fastify에 S3 클라이언트 데코레이팅
      fastify.decorate('awsS3', {
        s3: s3Client,
      });
    } catch (err) {
      fastify.log.error('AWS S3 플러그인 초기화 에러:', err);
      throw new GlobalException(
        GlobalErrorCode.SERVER_INTERNAL_ERROR,
        err instanceof Error ? err.message : String(err),
      );
    }
  },
  {
    name: 'awsS3',
    fastify: '5.x',
  },
);
