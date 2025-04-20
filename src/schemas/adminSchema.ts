export const generateAdminTokenSchema = {
  summary: '어드민 권한으로 사용자 토큰 생성 (테스트용)',
  tags: ['Admin'],
  body: {
    type: 'object',
    required: ['userId', 'adminPassword'],
    properties: {
      userId: { type: 'number' },
      adminPassword: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        userName: { type: 'string' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

// 사용자 목록 조회 스키마
export const getUsersSchema = {
  summary: '사용자 목록 조회 (테스트용)',
  tags: ['Admin'],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 0 },
      limit: { type: 'number', default: 10 },
      search: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              image: { type: 'string', nullable: true },
              wins: { type: 'number' },
              losses: { type: 'number' },
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
