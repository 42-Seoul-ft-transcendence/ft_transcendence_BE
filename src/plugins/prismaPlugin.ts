import fp from 'fastify-plugin';
import prisma from '../global/db/prisma.js';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prismaPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate('prisma', prisma);
});

export default prismaPlugin;

// 타입 보강
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
