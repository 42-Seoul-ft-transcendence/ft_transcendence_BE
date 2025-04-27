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
        name: { type: 'string' },
        image: { type: 'string', nullable: true },
        twoFactorEnabled: { type: 'boolean' },
        wins: { type: 'number' },
        losses: { type: 'number' },
      },
    },
  },
};

// 사용자 프로필 수정 스키마
export const updateUserSchema = {
  summary: '사용자 이름 수정',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 30 },
    },
    required: ['name'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        image: { type: 'string', nullable: true },
      },
    },
  },
};

// 사용자 프로필 이미지 업로드 스키마
export const uploadImageSchema = {
  summary: '프로필 이미지 업로드',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            image: { 
              type: 'string', 
              format: 'binary',
              description: '업로드할 이미지 파일'
            },
          },
          required: ['image'],
        },
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        image: { type: 'string' },
      },
    },
  },
};

// 사용자 매치 히스토리 조회 스키마
export const getUserMatchHistorySchema = {
  summary: '사용자 매치 히스토리 조회',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 0 },
      limit: { type: 'number', default: 20 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              myScore: { type: 'number' },
              opponentScore: { type: 'number' },
              isWinner: { type: 'boolean' },
              opponentName: { type: 'string' },
              playedAt: { type: 'string', format: 'date' },
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
