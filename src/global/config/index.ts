// import dotenv from 'dotenv';
// dotenv.config();

// Google OAuth 관련 설정
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// JWT 관련 설정
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const ACCESS_TOKEN_EXPIRES_IN = '7d';
export const REFRESH_TOKEN_EXPIRES_IN = '30d';

export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;

// 유저 프로필 이미지용 Google Drive 관련
export const GDRIVE_FOLDER_ID = process.env.GDRIVE_FOLDER_ID as string;
export const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL as string;
export const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY as string;

// AWS S3 환경 변수 추가
export const AWS_REGION = 'ap-northeast-2';
export const AWS_S3_ACCESS = process.env.AWS_S3_ACCESS as string;
export const AWS_S3_SECRET = process.env.AWS_S3_SECRET as string;
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME as string;
