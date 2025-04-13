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

    const checkExistingRequest = async (senderId: number, receiverId: number) => {
      // 이미 친구 요청이 존재하는지 확인
      return fastify.prisma.friendRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId,
            receiverId,
          },
        },
      });
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
      /**
       * 친구 요청 보내기
       */
      async sendFriendRequest(senderId: number, receiverId: number) {
        // 기본 유효성 검사
        await validateFriendRequest(senderId, receiverId);
        await checkExistingRelationship(senderId, receiverId);

        // 이미 친구 요청이 존재하는지 확인
        const existingRequest = await checkExistingRequest(senderId, receiverId);

        if (existingRequest) {
          if (existingRequest.status === 'PENDING') {
            throw new GlobalException(GlobalErrorCode.FRIEND_REQUEST_ALREADY_SENT);
          } else if (existingRequest.status === 'DECLINED') {
            // 거절된 요청이 있으면 다시 보낼 수 있도록 상태 업데이트
            const updatedRequest = await fastify.prisma.friendRequest.update({
              where: { id: existingRequest.id },
              data: { status: 'PENDING', updatedAt: new Date() },
            });

            return {
              ...updatedRequest,
              message: '친구 요청이 다시 전송되었습니다.',
            };
          }
        }

        // 반대 방향으로 이미 요청이 있는지 확인
        const reverseRequest = await checkExistingRequest(receiverId, senderId);

        if (reverseRequest && reverseRequest.status === 'PENDING') {
          // 상대방이 이미 나에게 친구 요청을 보냈으면 자동으로 수락
          await createFriendship(senderId, receiverId);

          // 요청 상태 업데이트
          await fastify.prisma.friendRequest.update({
            where: { id: reverseRequest.id },
            data: { status: 'ACCEPTED' },
          });

          return {
            id: reverseRequest.id,
            senderId,
            receiverId,
            status: 'ACCEPTED',
            createdAt: new Date(),
            message: '상대방이 이미 친구 요청을 보냈습니다. 자동으로 친구가 되었습니다.',
          };
        }

        // 새 친구 요청 생성
        const newRequest = await fastify.prisma.friendRequest.create({
          data: {
            senderId,
            receiverId,
            status: 'PENDING',
          },
        });

        return {
          ...newRequest,
          message: '친구 요청이 전송되었습니다.',
        };
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
