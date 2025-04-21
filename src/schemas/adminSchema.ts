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

// 매치 목록 조회 스키마
export const getMatchesSchema = {
  summary: '매치 목록 조회',
  tags: ['Admin'],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 0 },
      limit: { type: 'number', default: 20 },
      status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'] },
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
              tournamentId: { type: 'number' },
              tournamentName: { type: 'string' },
              tournamentType: { type: 'string' },
              round: { type: 'number' },
              status: { type: 'string' },
              players: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    userId: { type: 'number' },
                    userName: { type: 'string' },
                    userImage: { type: 'string', nullable: true },
                    score: { type: 'number' },
                    isWinner: { type: 'boolean' },
                  },
                },
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
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
