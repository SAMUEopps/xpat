
// lib/socket-instance.ts
import { SocketManager } from './socket-server';

// Use global to persist across hot reloads
declare global {
  var __socketManager: SocketManager | null;
  var __io: any;
}

let socketInstance: SocketManager | null = null;

export function setSocketInstance(instance: SocketManager) {
  // Store both locally and globally
  socketInstance = instance;
  global.__socketManager = instance;
  
  console.log('✅ Socket instance set globally');
  console.log('📡 Socket instance ID:', instance ? 'SET' : 'NULL');
}

export function getSocketInstance(): SocketManager | null {
  // Try to get from local first, then global
  if (socketInstance) {
    return socketInstance;
  }
  
  if (global.__socketManager) {
    socketInstance = global.__socketManager;
    console.log('📡 Retrieved socket instance from global');
    return socketInstance;
  }
  
  console.warn('⚠️ Socket instance not available yet - returning null');
  return null;
}

// ✅ NEW: Get IO directly
export function getIO() {
  const manager = getSocketInstance();
  if (!manager) {
    console.error('❌ Cannot get IO - socket manager not available');
    return null;
  }
  return manager.getIO();
}

export function checkSocketInstance(): boolean {
  const exists = !!(socketInstance || global.__socketManager);
  console.log(`🔍 Socket instance exists: ${exists}`);
  return exists;
}