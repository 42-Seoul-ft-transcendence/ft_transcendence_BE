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

export const setup2FASchema = {
  summary: '2FA 설정',
  tags: ['Auth'],
  response: {
    200: {
      type: 'object',
      properties: {
        secret: { type: 'string' },
        qrCode: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

export const enable2FASchema = {
  summary: '2FA 활성화',
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

export const verify2FASchema = {
  summary: '2FA 검증',
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['userId', 'token'],
    properties: {
      userId: { type: 'string' },
      token: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};