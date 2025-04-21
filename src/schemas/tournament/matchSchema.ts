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

// 매치 생성 스키마
export const createMatchSchema = {
  summary: '매치 생성',
  tags: ['Match'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['player2Id'],
    properties: {
      player2Id: { type: 'number' },
      tournamentMatchId: { type: 'number' },
    },
  },
  response: {
    200: {
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
};

// 매치 상세 조회 스키마
export const getMatchSchema = {
  summary: '매치 상세 조회',
  tags: ['Match'],
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
        ...matchResponseProps,
        players: {
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
        tournamentMatch: {
          type: 'object',
          nullable: true,
          properties: {
            tournament: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                type: { type: 'string' },
              },
            },
          },
        },
        gameLogs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
              event: { type: 'string' },
              data: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  },
};

// 매치 상태 조회 스키마
export const getMatchStateSchema = {
  summary: '매치 상태 조회',
  tags: ['Match'],
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
        status: { type: 'string' },
        player1Score: { type: 'number' },
        player2Score: { type: 'number' },
        gameState: {
          type: ['object', 'null'],
          additionalProperties: true,
        },
        players: {
          type: 'array',
          items: {
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
};

// 매치 상태 업데이트 스키마
export const updateMatchStateSchema = {
  summary: '매치 상태 업데이트',
  tags: ['Match'],
  security: [{ bearerAuth: [] }],
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
      status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'] },
      player1Score: { type: 'number', minimum: 0 },
      player2Score: { type: 'number', minimum: 0 },
      gameState: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        status: { type: 'string' },
        player1Score: { type: 'number' },
        player2Score: { type: 'number' },
        gameState: {
          type: ['object', 'null'],
          additionalProperties: true,
        },
        players: {
          type: 'array',
          items: {
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
};

// 사용자 매치 히스토리 조회 스키마
export const getUserMatchHistorySchema = {
  summary: '사용자 매치 히스토리 조회',
  tags: ['Match'],
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
