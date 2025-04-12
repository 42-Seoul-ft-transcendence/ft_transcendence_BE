export const googleAuthSchema = {
  summary: '구글 로그인',
  description: "message = {'2단계 인증이 필요합니다.' | '회원가입 성공' | '로그인 성공'}",
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
        userId: { type: 'string' },
        message: { type: 'string' },
        requireTFA: { type: 'boolean' },
      },
    },
  },
};
