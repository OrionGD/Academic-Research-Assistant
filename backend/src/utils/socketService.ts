import { Server } from 'socket.io';

/**
 * Singleton socket.io instance shared across the application.
 * This breaks the circular dependency between server.ts and controller files.
 */
let _io: Server | null = null;

export function setIo(io: Server) {
  _io = io;
}

export function getIo(): Server | null {
  return _io;
}
