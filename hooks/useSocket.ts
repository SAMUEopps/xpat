'use client';

import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export function useSocket(questionId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    if (questionId) {
      socketInstance.emit('join_question', questionId);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [questionId]);

  return socket;
}