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
  TWO_FACTOR_ALREADY_ENABLED = 'AUTH_005',
  TWO_FACTOR_NOT_ENABLED = 'AUTH_006',
  TWO_FACTOR_INVALID_TOKEN = 'AUTH_007',
  TWO_FACTOR_REQUIRED = 'AUTH_008',

  // 어드민 비밀번호 관련 에러
  AUTH_INVALID_ADMIN_PASSWORD = 'AUTH_009',

  // 사용자 관련 에러
  USER_NOT_FOUND = 'USER_001',
  USER_ALREADY_EXISTS = 'USER_002',
  USER_INVALID_DATA = 'USER_003',
  USER_NAME_ALREADY_EXISTS = 'USER_004',

  // 친구 관련 에러
  FRIEND_SELF_REQUEST = 'FRIEND_001',
  FRIEND_ALREADY_FRIENDS = 'FRIEND_002',
  FRIEND_REQUEST_ALREADY_SENT = 'FRIEND_003',
  FRIEND_REQUEST_NOT_FOUND = 'FRIEND_004',
  FRIEND_REQUEST_NOT_AUTHORIZED = 'FRIEND_005',
  FRIEND_REQUEST_ALREADY_PROCESSED = 'FRIEND_006',
  FRIEND_NOT_FOUND = 'FRIEND_007',
  FRIEND_SELF_DELETE = 'FRIEND_008',

  // 토너먼트 관련 에러
  TOURNAMENT_NOT_FOUND = 'TOURNAMENT_001',
  TOURNAMENT_INVALID_TYPE = 'TOURNAMENT_002',
  TOURNAMENT_NOT_AUTHORIZED = 'TOURNAMENT_003',
  TOURNAMENT_INVALID_STATUS_TRANSITION = 'TOURNAMENT_004',
  TOURNAMENT_ALREADY_STARTED = 'TOURNAMENT_005',
  TOURNAMENT_ALREADY_JOINED = 'TOURNAMENT_006',
  TOURNAMENT_NOT_JOINED = 'TOURNAMENT_007',
  TOURNAMENT_FULL = 'TOURNAMENT_008',

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

  // 어드민 인증 관련 에러 매핑
  [GlobalErrorCode.AUTH_INVALID_ADMIN_PASSWORD]: {
    statusCode: 401,
    message: '어드민 비밀번호가 올바르지 않습니다.',
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
  [GlobalErrorCode.USER_NAME_ALREADY_EXISTS]: {
    statusCode: 409,
    message: '이미 사용 중인 이름입니다.',
  },

  // 친구 관련 에러 매핑
  [GlobalErrorCode.FRIEND_SELF_REQUEST]: {
    statusCode: 400,
    message: '자기 자신에게 친구 요청을 보낼 수 없습니다.',
  },
  [GlobalErrorCode.FRIEND_ALREADY_FRIENDS]: {
    statusCode: 400,
    message: '이미 친구 관계입니다.',
  },
  [GlobalErrorCode.FRIEND_REQUEST_ALREADY_SENT]: {
    statusCode: 400,
    message: '이미 친구 요청을 보냈습니다.',
  },
  [GlobalErrorCode.FRIEND_REQUEST_NOT_FOUND]: {
    statusCode: 404,
    message: '친구 요청을 찾을 수 없습니다.',
  },
  [GlobalErrorCode.FRIEND_REQUEST_NOT_AUTHORIZED]: {
    statusCode: 403,
    message: '이 친구 요청에 대한 권한이 없습니다.',
  },
  [GlobalErrorCode.FRIEND_REQUEST_ALREADY_PROCESSED]: {
    statusCode: 400,
    message: '이미 처리된 친구 요청입니다.',
  },
  [GlobalErrorCode.FRIEND_NOT_FOUND]: {
    statusCode: 404,
    message: '친구 관계를 찾을 수 없습니다.',
  },
  [GlobalErrorCode.FRIEND_SELF_DELETE]: {
    statusCode: 400,
    message: '자기 자신을 친구 목록에서 삭제할 수 없습니다.',
  },

  // 토너먼트 관련 에러 매핑
  [GlobalErrorCode.TOURNAMENT_NOT_FOUND]: {
    statusCode: 404,
    message: '토너먼트를 찾을 수 없습니다.',
  },
  [GlobalErrorCode.TOURNAMENT_INVALID_TYPE]: {
    statusCode: 400,
    message: '유효하지 않은 토너먼트 유형입니다.',
  },
  [GlobalErrorCode.TOURNAMENT_NOT_AUTHORIZED]: {
    statusCode: 403,
    message: '이 토너먼트에 대한 권한이 없습니다.',
  },
  [GlobalErrorCode.TOURNAMENT_INVALID_STATUS_TRANSITION]: {
    statusCode: 400,
    message: '유효하지 않은 토너먼트 상태 변경입니다.',
  },
  [GlobalErrorCode.TOURNAMENT_ALREADY_STARTED]: {
    statusCode: 400,
    message: '이미 시작된 토너먼트입니다.',
  },
  [GlobalErrorCode.TOURNAMENT_ALREADY_JOINED]: {
    statusCode: 400,
    message: '이미 참가 중인 토너먼트입니다.',
  },
  [GlobalErrorCode.TOURNAMENT_NOT_JOINED]: {
    statusCode: 400,
    message: '참가하지 않은 토너먼트입니다.',
  },
  [GlobalErrorCode.TOURNAMENT_FULL]: {
    statusCode: 400,
    message: '토너먼트 참가 인원이 가득 찼습니다.',
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

  constructor(errorCode: GlobalErrorCode, details?: string) {
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
