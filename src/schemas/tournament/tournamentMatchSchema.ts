// 토너먼트 매치 공통 응답 속성
const tournamentMatchResponseProps = {
  id: { type: 'number' },
  round: { type: 'number' },
  matchOrder: { type: 'number' },
  status: { type: 'string' },
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

// 매치 정보
const matchSchema = {
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
};

// 토너먼트 매치 목록 조회 스키마
export const getTournamentMatchesSchema = {
  summary: '토너먼트 매치 목록 조회',
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
        tournamentId: { type: 'number' },
        matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ...tournamentMatchResponseProps,
              players: {
                type: 'array',
                items: simplePlayerSchema,
              },
              match: matchSchema,
            },
          },
        },
      },
    },
  },
};

// 토너먼트 대진표 조회 스키마
export const getTournamentBracketSchema = {
  summary: '토너먼트 대진표 조회',
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
        tournamentId: { type: 'number' },
        tournament: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            type: { type: 'string' },
            status: { type: 'string' },
            participants: {
              type: 'array',
              items: simplePlayerSchema,
            },
          },
        },
        rounds: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                ...tournamentMatchResponseProps,
                players: {
                  type: 'array',
                  items: simplePlayerSchema,
                },
                match: matchSchema,
                previousMatches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// 토너먼트 매치 상세 조회 스키마
export const getTournamentMatchSchema = {
  summary: '토너먼트 매치 상세 조회',
  tags: ['Tournament'],
  params: {
    type: 'object',
    required: ['id', 'matchId'],
    properties: {
      id: { type: 'number' },
      matchId: { type: 'number' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        ...tournamentMatchResponseProps,
        players: {
          type: 'array',
          items: simplePlayerSchema,
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
        nextMatch: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number' },
            round: { type: 'number' },
            matchOrder: { type: 'number' },
          },
        },
        previousMatches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              round: { type: 'number' },
              matchOrder: { type: 'number' },
            },
          },
        },
      },
    },
  },
};

// 토너먼트 매치 시작 스키마
export const startTournamentMatchSchema = {
  summary: '토너먼트 매치 시작',
  tags: ['Tournament'],
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id', 'matchId'],
    properties: {
      id: { type: 'number' },
      matchId: { type: 'number' },
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
        startTime: { type: 'string', format: 'date-time', nullable: true },
        endTime: { type: 'string', format: 'date-time', nullable: true },
        players: {
          type: 'array',
          items: simplePlayerSchema,
        },
      },
    },
  },
};

// 토너먼트 매치 완료 스키마
export const completeTournamentMatchSchema = {
  summary: '토너먼트 매치 완료',
  tags: ['Tournament'],
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id', 'matchId'],
    properties: {
      id: { type: 'number' },
      matchId: { type: 'number' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        matchId: { type: 'number' },
        status: { type: 'string' },
        winnerId: { type: 'number', nullable: true },
        nextMatchId: { type: 'number', nullable: true },
      },
    },
  },
};
