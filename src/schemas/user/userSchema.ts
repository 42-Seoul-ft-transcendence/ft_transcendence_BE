// 매치 공통 응답 속성
const matchResponseProps = {
  id: { type: 'number' },
  status: { type: 'string' },
  player1Score: { type: 'number' },
  player2Score: { type: 'number' },
  date: { type: 'string', format: 'date', nullable: true },
};

// 간단한 플레이어 정보
const simplePlayerSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    image: { type: 'string', nullable: true },
  },
};

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
        name: { type: 'string' },
        image: { type: 'string', nullable: true },
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
              ...matchResponseProps,
              players: {
                type: 'array',
                items: simplePlayerSchema,
              },
              tournamentMatch: {
                type: 'object',
                nullable: true,
                properties: {
                  tournament: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      name: { type: 'string' },
                    },
                  },
                },
              },
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
