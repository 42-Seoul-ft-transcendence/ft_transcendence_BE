import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { v4 as uuidv4 } from 'uuid';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException.js';
import { GDRIVE_FOLDER_ID } from '../../global/config/index.js';

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('userService', {
    /**
     * 사용자 조회
     */
    async getUserById(userId: number) {
      return fastify.prisma.user
        .findUniqueOrThrow({
          where: { id: userId },
        })
        .catch(() => {
          throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
        });
    },

    /**
     * 사용자 이름 수정
     */
    async updateUserName(userId: number, name: string) {
      // 이름 중복 확인
      const existingUser = await fastify.prisma.user.findFirst({
        where: {
          name,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new GlobalException(GlobalErrorCode.USER_NAME_ALREADY_EXISTS);
      }

      // 사용자 이름 업데이트
      return fastify.prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    },

    /**
     * 사용자 목록 조회 (페이지네이션 및 검색 기능 포함)
     */
    async getUsers(options: { page: number; limit: number; search?: string }) {
      const page = options.page;
      const limit = options.limit;

      // 검색 조건 설정
      const where = options.search
        ? { OR: [{ name: { contains: options.search } }, { email: { contains: options.search } }] }
        : {};

      // 사용자 목록 조회
      const users = await fastify.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          image: true,
          wins: true,
          losses: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      });

      // 총 사용자 수 조회
      const total = await fastify.prisma.user.count({ where });

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },

    /**
     * 사용자 프로필 이미지 업로드
     */
    async uploadUserImage(userId: number, file: MultipartFile) {
      // 1) MIME 타입 검증
      const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowed.includes(file.mimetype)) {
        throw new GlobalException(GlobalErrorCode.UNSUPPORTED_MEDIA_TYPE);
      }

      // 2) 버퍼 생성 및 이름 결정
      const buffer = await file.toBuffer();
      const filename = `${uuidv4()}_${file.filename}`;
      const folderId = GDRIVE_FOLDER_ID ?? '';

      // 3) Google Drive에 업로드
      const fileId = await fastify.googleDriveService.uploadFile(
        filename,
        buffer,
        file.mimetype,
        folderId,
      );
      const imageUrl = `https://drive.google.com/uc?id=${fileId}`;

      // 4) DB에 이미지 URL 저장
      await fastify.prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
      });

      return { image: imageUrl };
    },
  });
});
