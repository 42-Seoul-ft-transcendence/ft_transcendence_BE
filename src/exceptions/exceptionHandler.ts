import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ErrorDef, ErrorResponse, GlobalErrorCode, GlobalException } from './globalException';

// Fastify 유효성 검사 오류를 위한 확장 인터페이스
interface ValidationError extends Error {
  validation?: any[];
  validationContext?: string;
}

/**
 * 전역 에러 핸들러
 */
export function exceptionHandler(
  error: Error | FastifyError | GlobalException | ValidationError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.error(error);

  // GlobalException 인스턴스인 경우
  if (error instanceof GlobalException) {
    const response: ErrorResponse = {
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
    };

    if (error.details) {
      response.details = error.details;
    }

    return reply.code(error.statusCode).send(response);
  }

  // Fastify 검증 에러 처리 - validation 속성이 있는지 확인
  if ('validation' in error && error.validation) {
    const errorInfo = ErrorDef[GlobalErrorCode.VALIDATION_ERROR];
    const response: ErrorResponse = {
      statusCode: errorInfo.statusCode,
      errorCode: GlobalErrorCode.VALIDATION_ERROR,
      message: errorInfo.message,
      details: error.validation,
    };

    return reply.code(errorInfo.statusCode).send(response);
  }

  // 기타 모든 에러는 500 Internal Server Error로 처리
  const errorInfo = ErrorDef[GlobalErrorCode.SERVER_INTERNAL_ERROR];
  const response: ErrorResponse = {
    statusCode: errorInfo.statusCode,
    errorCode: GlobalErrorCode.SERVER_INTERNAL_ERROR,
    message:
      process.env.NODE_ENV === 'production'
        ? errorInfo.message
        : error.message || errorInfo.message,
  };

  return reply.code(errorInfo.statusCode).send(response);
}
