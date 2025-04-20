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
        ...tournamentResponseProps,
        participants: {
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
        matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              round: { type: 'number' },
              matchOrder: { type: 'number' },
              status: { type: 'string' },
              players: {
                type: 'array',
                items: simpleParticipantSchema,
              },
              match: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'number' },
                  status: { type: 'string' },
                  player1Score: { type: 'number' },
                  player2Score: { type: 'number' },
                  startTime: { type: 'string', format: 'date-time', nullable: true },
                  endTime: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
      },
    },
  },
};

// 토너먼트 수정 스키마
export const updateTournamentSchema = {
  summary: '토너먼트 수정',
  tags: ['Tournament'],
  security: [{ bearerAuth: [] }], // 토너먼트 수정에는 인증 필요
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'number' },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
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
