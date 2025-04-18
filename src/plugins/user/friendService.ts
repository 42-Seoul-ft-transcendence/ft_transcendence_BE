import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { GlobalErrorCode, GlobalException } from '../../global/exceptions/globalException';

export default fp(
  async (fastify: FastifyInstance) => {
    // 의존성 확인
    if (!fastify.prisma) {
      throw new Error('Prisma plugin is required for friendService');
    }

    // 헬퍼 함수들
    const validateFriendRequest = async (senderId: number, receiverId: number) => {
      // 자기 자신에게 친구 요청을 보내는지 확인
      if (senderId === receiverId) {
        throw new GlobalException(GlobalErrorCode.FRIEND_SELF_REQUEST);
      }

      // 받는 사람이 존재하는지 확인
      const receiver = await fastify.prisma.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiver) {
        throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
      }
    };

    const checkExistingRelationship = async (senderId: number, receiverId: number) => {
      // 이미 친구 관계인지 확인
      const existingFriendship = await fastify.prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: senderId, friendId: receiverId },
            { userId: receiverId, friendId: senderId },
          ],
        },
      });

      if (existingFriendship) {
        throw new GlobalException(GlobalErrorCode.FRIEND_ALREADY_FRIENDS);
      }
    };

    const createFriendship = async (userId1: number, userId2: number) => {
      // 양방향 친구 관계 생성
      await fastify.prisma.$transaction([
        fastify.prisma.friendship.create({
          data: { userId: userId1, friendId: userId2 },
        }),
        fastify.prisma.friendship.create({
          data: { userId: userId2, friendId: userId1 },
        }),
      ]);
    };

    fastify.decorate('friendService', {
      async sendFriendRequest(senderId: number, receiverName: string) {
        // 1) sender 존재 및 자기 자신 요청 금지
        const sender = await fastify.prisma.user.findUnique({ where: { id: senderId } });
        if (!sender) {
          throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
        }
        if (sender.name === receiverName) {
          throw new GlobalException(GlobalErrorCode.FRIEND_SELF_REQUEST);
        }

        // 2) receiverName → receiverId 조회 및 존재 확인
        const receiver = await fastify.prisma.user.findUnique({ where: { name: receiverName } });
        if (!receiver) {
          throw new GlobalException(GlobalErrorCode.USER_NOT_FOUND);
        }
        const receiverId = receiver.id;

        // 3) 친구 관계 중복 검사
        await validateFriendRequest(senderId, receiverId);
        await checkExistingRelationship(senderId, receiverId);

        // 4) 이미 보낸 요청 확인 (PENDING/DECLINED)
        const existing = await fastify.prisma.friendRequest.findFirst({
          where: { senderId, receiverId },
        });
        if (existing) {
          if (existing.status === 'PENDING') {
            throw new GlobalException(GlobalErrorCode.FRIEND_REQUEST_ALREADY_SENT);
          }
          // DECLINED 이면 재전송
          const updated = await fastify.prisma.friendRequest.update({
            where: { id: existing.id },
            data: { status: 'PENDING', updatedAt: new Date() },
          });
          return { ...updated, message: '친구 요청이 다시 전송되었습니다.' };
        }

        // 5) 역방향 요청 자동 수락
        const reverse = await fastify.prisma.friendRequest.findFirst({
          where: { senderId: receiverId, receiverId: senderId },
        });
        if (reverse?.status === 'PENDING') {
          await createFriendship(senderId, receiverId);
          await fastify.prisma.friendRequest.update({
            where: { id: reverse.id },
            data: { status: 'ACCEPTED' },
          });
          return {
            id: reverse.id,
            senderId,
            receiverId,
            senderName: sender.name,
            receiverName,
            status: 'ACCEPTED',
            createdAt: reverse.createdAt,
            updatedAt: new Date(),
            message: '상대방이 이미 친구 요청을 보냈습니다. 자동으로 친구가 되었습니다.',
          };
        }

        // 6) 새 친구 요청 생성
        const newReq = await fastify.prisma.friendRequest.create({
          data: {
            senderId,
            receiverId,
            senderName: sender.name,
            receiverName,
            status: 'PENDING',
          },
        });
        return { ...newReq, message: '친구 요청이 전송되었습니다.' };
      },

      /**
       * 친구 요청 수락
       */
      async acceptFriendRequest(userId: number, requestId: number) {
        // 친구 요청 확인
        const request = await fastify.prisma.friendRequest.findUnique({
          where: { id: requestId },
        });

        if (!request) {
          throw new GlobalException(GlobalErrorCode.FRIEND_REQUEST_NOT_FOUND);
        }

        // 권한 및 상태 확인
        if (request.receiverId !== userId) {
          throw new GlobalException(GlobalErrorCode.FRIEND_REQUEST_NOT_AUTHORIZED);
        }

        if (request.status !== 'PENDING') {
          throw new GlobalException(GlobalErrorCode.FRIEND_REQUEST_ALREADY_PROCESSED);
        }

        // 친구 관계 생성 및 요청 상태 업데이트
        await createFriendship(request.senderId, request.receiverId);

        await fastify.prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
        });

        return {
          success: true,
          message: '친구 요청이 수락되었습니다.',
        };
      },

      /**
       * 친구 요청 거절
       */
      async declineFriendRequest(userId: number, requestId: number) {
        // 친구 요청 확인
        const request = await fastify.prisma.friendRequest.findUnique({
          where: { id: requestId },
        });

        if (!request) {
          throw new GlobalException(GlobalErrorCode.FRIEND_REQUEST_NOT_FOUND);
        }

        // 권한 및 상태 확인
        if (request.receiverId !== userId) {
          throw new GlobalException(GlobalErrorCode.FRIEND_REQUEST_NOT_AUTHORIZED);
        }

        if (request.status !== 'PENDING') {
          throw new GlobalException(GlobalErrorCode.FRIEND_REQUEST_ALREADY_PROCESSED);
        }

        // 요청 상태 업데이트
        await fastify.prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'DECLINED' },
        });

        return {
          success: true,
          message: '친구 요청이 거절되었습니다.',
        };
      },

      /**
       * 친구 삭제
       */
      async deleteFriend(userId: number, friendId: number) {
        // 자기 자신을 삭제하려는지 확인
        if (userId === friendId) {
          throw new GlobalException(GlobalErrorCode.FRIEND_SELF_DELETE);
        }

        // 친구 관계 확인
        const friendship = await fastify.prisma.friendship.findFirst({
          where: { userId, friendId },
        });

        if (!friendship) {
          throw new GlobalException(GlobalErrorCode.FRIEND_NOT_FOUND);
        }

        // 양방향 친구 관계 삭제
        await fastify.prisma.friendship.deleteMany({
          where: {
            OR: [
              { userId, friendId },
              { userId: friendId, friendId: userId },
            ],
          },
        });

        return {
          success: true,
          message: '친구가 삭제되었습니다.',
        };
      },

      /**
       * 친구 목록 조회
       */
      async getFriends(
        userId: number,
        options: { page?: number; limit?: number; search?: string },
      ) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const skip = (page - 1) * limit;

        // 검색 조건 설정
        const where = options.search ? { friend: { name: { contains: options.search } } } : {};

        // 친구 목록 조회
        const friendships = await fastify.prisma.friendship.findMany({
          where: {
            userId,
            ...where,
          },
          include: {
            friend: {
              select: {
                id: true,
                name: true,
                image: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { friend: { name: 'asc' } },
        });

        // 총 친구 수 조회
        const total = await fastify.prisma.friendship.count({
          where: { userId, ...where },
        });

        return {
          friends: friendships.map((f) => f.friend),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      },

      /**
       * 받은 친구 요청 목록 조회
       */
      async getPendingFriendRequests(userId: number) {
        const requests = await fastify.prisma.friendRequest.findMany({
          where: {
            receiverId: userId,
            status: 'PENDING',
          },
          include: {
            sender: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return { requests };
      },
    });
  },
  {
    name: 'friendService',
  },
);
