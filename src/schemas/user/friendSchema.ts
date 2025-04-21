// 친구 요청 보내기 스키마
export const sendFriendRequestSchema = {
  summary: '친구 요청 보내기',
  tags: ['Friend'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['receiverName'],
    properties: {
      receiverName: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        senderId: { type: 'number' },
        receiverId: { type: 'number' },
        status: { type: 'string' },
      },
    },
  },
};

// 친구 요청 응답 스키마 (수락/거절)
export const respondFriendRequestSchema = {
  summary: '친구 요청 응답 (수락/거절)',
  description: '요청에 대한 응답 (accept: 수락, decline: 거절)',
  tags: ['Friend'],
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['requestId'],
    properties: {
      requestId: { type: 'number' },
    },
  },
  body: {
    type: 'object',
    required: ['action'],
    properties: {
      action: { type: 'string', enum: ['accept', 'decline'] },
    },
  },
};

// 친구 삭제 스키마
export const deleteFriendSchema = {
  summary: '친구 삭제',
  tags: ['Friend'],
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['friendId'],
    properties: {
      friendId: { type: 'number' },
    },
  },
};

// 친구 목록 조회 스키마
export const getFriendsSchema = {
  summary: '친구 목록 조회',
  tags: ['Friend'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 0 },
      limit: { type: 'number', default: 20 },
      search: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        friends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              image: { type: 'string', nullable: true },
              isOnline: { type: 'boolean' },
              lastSeen: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  },
};

// 받은 친구 요청 목록 조회 스키마
export const getPendingFriendRequestsSchema = {
  summary: '받은 친구 요청 목록 조회',
  tags: ['Friend'],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        requests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              sender: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  image: { type: 'string', nullable: true },
                },
              },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
};
