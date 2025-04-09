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
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        message: { type: 'string' },
        userId: { type: 'string' },
        requireTFA: { type: 'boolean' },
      },
    },
  },
};
