// Google OAuth 관련 설정
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// JWT 관련 설정
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';
