// src/plugins/socket.ts
import { Server } from 'socket.io';

let io: Server;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
}

export const SocketServer = {
  to: (socketId: string) => io.to(socketId),
  emit: (event: string, data: any) => io.emit(event, data),
  getIO: () => io,
};
