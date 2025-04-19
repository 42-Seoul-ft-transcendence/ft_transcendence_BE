export const twoFactorSetupSchema = {
  summary: '2FA 설정 초기화',
  tags: ['Auth'],
  response: {
    200: {
      type: 'object',
      properties: {
        secret: { type: 'string' },
        qrCodeUrl: { type: 'string' },
      },
    },
  },
};

export const twoFactorVerifySchema = {
  summary: '2FA 설정 검증 및 활성화',
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['token', 'secret'],
    properties: {
      token: { type: 'string' },
      secret: { type: 'string' },
    },
  },
};

export const twoFactorAuthSchema = {
  summary: '2FA 로그인 검증',
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['userId', 'token'],
    properties: {
      userId: { type: 'number' },
      token: { type: 'string' },
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

export const twoFactorDisableSchema = {
  summary: '2FA 비활성화',
  tags: ['Auth'],
};
