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
