// Google OAuth 관련 설정
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// JWT 관련 설정
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const ACCESS_TOKEN_EXPIRES_IN = '1h';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';

export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;
