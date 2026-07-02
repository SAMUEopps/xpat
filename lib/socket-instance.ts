// lib/socket-instance.ts
import { SocketManager } from './socket-server';

let socketInstance: SocketManager | null = null;

export function setSocketInstance(instance: SocketManager) {
  socketInstance = instance;
}

export function getSocketInstance(): SocketManager | null {
  return socketInstance;
}