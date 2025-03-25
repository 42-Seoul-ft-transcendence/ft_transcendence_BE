import { PrismaClient } from '@prisma/client';

// PrismaClient 인스턴스를 싱글톤으로 생성
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// 전역 타입 선언
declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// 개발 중 핫 리로딩 시 여러 인스턴스 생성 방지를 위한 글로벌 변수 사용
const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
