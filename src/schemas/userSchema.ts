// 사용자 정보 조회 스키마
export const getUserSchema = {
  summary: '사용자 정보 조회',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        name: { type: 'string' },
        image: { type: 'string', nullable: true },
        twoFactorEnabled: { type: 'boolean' },
        wins: { type: 'number' },
        losses: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
};

// 다른 사용자 정보 조회 스키마
export const getUserByIdSchema = {
  summary: '특정 사용자 정보 조회',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'number' },
    },
  },
  response: {
    200: {
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
};

// 사용자 프로필 수정 스키마
export const updateUserSchema = {
  summary: '사용자 프로필 수정',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 30 },
      image: { type: 'string', nullable: true },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        name: { type: 'string' },
        image: { type: 'string', nullable: true },
        updatedAt: { type: 'string', format: 'date-time' },
        message: { type: 'string' },
      },
    },
  },
};

// 사용자 목록 조회 스키마
export const getUsersSchema = {
  summary: '사용자 목록 조회',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 1 },
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
