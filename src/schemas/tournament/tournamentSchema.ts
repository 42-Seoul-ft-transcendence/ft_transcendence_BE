// 플레이어 응답 스키마
const playerResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    image: { type: 'string', nullable: true },
  },
};

// 매치 플레이어 응답 스키마
const matchPlayerResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    image: { type: 'string', nullable: true },
    score: { type: 'number' },
    isWinner: { type: 'boolean' },
  },
};

// 매치 응답 스키마
const matchResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    round: { type: 'number' },
    status: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    players: {
      type: 'array',
      items: matchPlayerResponseSchema,
    },
  },
};

// 토너먼트 공통 응답 속성
const tournamentResponseProps = {
  id: { type: 'number' },
  name: { type: 'string' },
  type: { type: 'string' },
};

// 간단한 참가자 정보
const simpleParticipantSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    image: { type: 'string', nullable: true },
  },
};

// 토너먼트 목록 조회 스키마
export const getTournamentsSchema = {
  summary: '토너먼트 목록 조회',
  description: 'PENDING 상태의 2P or 4P 토너먼트를 조회합니다',
  tags: ['Tournament'],
  querystring: {
    type: 'object',
    required: ['type'],
    properties: {
      page: { type: 'number', default: 0 },
      limit: { type: 'number', default: 20 },
      type: { type: 'string', enum: ['2P', '4P'] },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        tournaments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ...tournamentResponseProps,
              participants: {
                type: 'array',
                items: simpleParticipantSchema,
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

// 토너먼트 생성 스키마
export const createTournamentSchema = {
  summary: '토너먼트 생성',
  tags: ['Tournament'],
  security: [{ bearerAuth: [] }], // 토너먼트 생성에는 인증 필요
  body: {
    type: 'object',
    required: ['name', 'type'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      type: { type: 'string', enum: ['2P', '4P'] },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        ...tournamentResponseProps,
        participants: {
          type: 'array',
          items: simpleParticipantSchema,
        },
      },
    },
  },
};

// 토너먼트 상세 조회 스키마
export const getTournamentSchema = {
  summary: '토너먼트 상세 조회',
  tags: ['Tournament'],
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
        type: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        participants: {
          type: 'array',
          items: playerResponseSchema,
        },
        matches: {
          type: 'array',
          items: matchResponseSchema,
        },
      },
    },
  },
};

// 토너먼트 참가 스키마
export const joinTournamentSchema = {
  summary: '토너먼트 참가',
  tags: ['Tournament'],
  security: [{ bearerAuth: [] }], // 토너먼트 참가에는 인증 필요
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
        ...tournamentResponseProps,
        participants: {
          type: 'array',
          items: simpleParticipantSchema,
        },
      },
    },
  },
};

// 토너먼트 탈퇴 스키마
export const leaveTournamentSchema = {
  summary: '토너먼트 탈퇴',
  tags: ['Tournament'],
  security: [{ bearerAuth: [] }], // 토너먼트 탈퇴에는 인증 필요
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'number' },
    },
  },
};
