/**
 * 전역 에러 코드 열거형
 */
export enum GlobalErrorCode {
  // 인증 관련 에러
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_INVALID_TOKEN = 'AUTH_002',
  AUTH_EXPIRED_TOKEN = 'AUTH_003',
  AUTH_UNAUTHORIZED = 'AUTH_004',

  // 2FA 관련 에러
  TWO_FACTOR_ALREADY_ENABLED = 'TWO_FACTOR_ALREADY_ENABLED',
  TWO_FACTOR_NOT_ENABLED = 'TWO_FACTOR_NOT_ENABLED',
  TWO_FACTOR_INVALID_TOKEN = 'TWO_FACTOR_INVALID_TOKEN',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',

  // 사용자 관련 에러
  USER_NOT_FOUND = 'USER_001',
  USER_ALREADY_EXISTS = 'USER_002',
  USER_INVALID_DATA = 'USER_003',

  // 외부 API 관련 에러
  API_EXTERNAL_ERROR = 'API_001',
  API_GOOGLE_ERROR = 'API_002',

  // 서버 관련 에러
  SERVER_INTERNAL_ERROR = 'SERVER_001',
  SERVER_DATABASE_ERROR = 'SERVER_002',

  // 유효성 검사 관련 에러
  VALIDATION_ERROR = 'VAL_001',

  // 라우트 관련 에러
  ROUTE_NOT_FOUND = 'ROUTE_001',

  // 기본 에러
  UNKNOWN_ERROR = 'ERR_001',
}

/**
 * 에러 코드, 상태 코드, 메시지를 통합한 매핑
 */
export const ErrorDef: Record<GlobalErrorCode, { statusCode: number; message: string }> = {
  // 인증 관련
  [GlobalErrorCode.AUTH_INVALID_CREDENTIALS]: {
    statusCode: 401,
    message: '아이디 또는 비밀번호가 일치하지 않습니다',
  },
  [GlobalErrorCode.AUTH_INVALID_TOKEN]: {
    statusCode: 401,
    message: '유효하지 않은 토큰입니다',
  },
  [GlobalErrorCode.AUTH_EXPIRED_TOKEN]: {
    statusCode: 401,
    message: '만료된 토큰입니다',
  },
  [GlobalErrorCode.AUTH_UNAUTHORIZED]: {
    statusCode: 403,
    message: '권한이 없습니다',
  },

  // 2FA 관련 에러 매핑
  [GlobalErrorCode.TWO_FACTOR_ALREADY_ENABLED]: {
    statusCode: 400,
    message: '2단계 인증이 이미 활성화되어 있습니다.',
  },
  [GlobalErrorCode.TWO_FACTOR_NOT_ENABLED]: {
    statusCode: 400,
    message: '2단계 인증이 활성화되어 있지 않습니다.',
  },
  [GlobalErrorCode.TWO_FACTOR_INVALID_TOKEN]: {
    statusCode: 401,
    message: '유효하지 않은 2단계 인증 코드입니다.',
  },
  [GlobalErrorCode.TWO_FACTOR_REQUIRED]: {
    statusCode: 401,
    message: '2단계 인증이 필요합니다.',
  },

  // 사용자 관련
  [GlobalErrorCode.USER_NOT_FOUND]: {
    statusCode: 404,
    message: '사용자를 찾을 수 없습니다',
  },
  [GlobalErrorCode.USER_ALREADY_EXISTS]: {
    statusCode: 409,
    message: '이미 존재하는 사용자입니다',
  },
  [GlobalErrorCode.USER_INVALID_DATA]: {
    statusCode: 400,
    message: '유효하지 않은 사용자 정보입니다',
  },

  // 외부 API 관련
  [GlobalErrorCode.API_EXTERNAL_ERROR]: {
    statusCode: 502,
    message: '외부 API 호출 중 오류가 발생했습니다',
  },
  [GlobalErrorCode.API_GOOGLE_ERROR]: {
    statusCode: 502,
    message: 'Google API 호출 중 오류가 발생했습니다',
  },

  // 서버 관련
  [GlobalErrorCode.SERVER_INTERNAL_ERROR]: {
    statusCode: 500,
    message: '서버 오류가 발생했습니다',
  },
  [GlobalErrorCode.SERVER_DATABASE_ERROR]: {
    statusCode: 500,
    message: '데이터베이스 오류가 발생했습니다',
  },

  // 유효성 검사 관련
  [GlobalErrorCode.VALIDATION_ERROR]: {
    statusCode: 400,
    message: '입력값이 유효하지 않습니다',
  },

  // 라우트 관련
  [GlobalErrorCode.ROUTE_NOT_FOUND]: {
    statusCode: 404,
    message: '요청한 리소스를 찾을 수 없습니다',
  },

  // 기본 에러
  [GlobalErrorCode.UNKNOWN_ERROR]: {
    statusCode: 500,
    message: '알 수 없는 오류가 발생했습니다',
  },
};

/**
 * API 에러 응답 인터페이스
 */
export interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: any;
}

/**
 * 전역 예외 클래스
 */
export class GlobalException extends Error {
  statusCode: number;
  errorCode: string;
  details?: any;

  constructor(errorCode: GlobalErrorCode, details?: any) {
    const errorDefinition = ErrorDef[errorCode];

    // 정의된 에러 메시지 사용
    super(errorDefinition.message);

    this.errorCode = errorCode;
    this.statusCode = errorDefinition.statusCode;
    this.details = details;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}
