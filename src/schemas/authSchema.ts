export const googleAuthSchema = {
  summary: '구글 로그인',
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['googleAccessToken'],
    properties: {
      googleAccessToken: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', default: null },
        refreshToken: { type: 'string', default: null },
        isNewUser: { type: 'boolean' },
        requireTFA: { type: 'boolean' },
      },
    },
  },
};

// 리프레시 토큰 스키마 추가
export const refreshTokenSchema = {
  summary: '액세스 토큰 갱신',
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  },
};
