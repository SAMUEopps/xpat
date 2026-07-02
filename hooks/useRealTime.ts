// // hooks/useRealTime.ts
// 'use client';

// import { useEffect, useState, useRef, useCallback } from 'react';
// import { io, Socket } from 'socket.io-client';

// interface Message {
//   _id?: string;
//   senderId: string;
//   content: string;
//   timestamp: Date;
//   type: 'text' | 'file';
//   fileUrl?: string;
//   delivered: boolean;
//   read: boolean;
//   readAt?: Date;
// }

// interface UseRealTimeOptions {
//   questionId?: string;
//   userId?: string;
//   onNewMessage?: (message: Message) => void;
//   onStatusUpdate?: (data: any) => void;
//   onExpertAssigned?: (data: any) => void;
//   onQuestionAccepted?: (data: any) => void;
// }

// export function useRealTime({
//   questionId,
//   userId,
//   onNewMessage,
//   onStatusUpdate,
//   onExpertAssigned,
//   onQuestionAccepted,
// }: UseRealTimeOptions = {}) {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const socketRef = useRef<Socket | null>(null);

//   useEffect(() => {
//     const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
//       transports: ['websocket'],
//       autoConnect: true,
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//     });

//     socketRef.current = socketInstance;
//     setSocket(socketInstance);

//     socketInstance.on('connect', () => {
//       console.log('Socket connected');
//       setIsConnected(true);
      
//       // Authenticate if userId is available
//       if (userId) {
//         socketInstance.emit('authenticate', { userId });
//       }
//     });

//     socketInstance.on('authenticated', (data) => {
//       console.log('Socket authenticated');
//       setIsAuthenticated(true);
      
//       // Join question room if provided
//       if (questionId) {
//         socketInstance.emit('join_question', { questionId });
//       }
//     });

//     socketInstance.on('auth_error', (error) => {
//       console.error('Socket auth error:', error);
//       setIsAuthenticated(false);
//     });

//     socketInstance.on('new_message', (data) => {
//       console.log('New message received:', data);
//       if (onNewMessage) {
//         onNewMessage(data.message);
//       }
//     });

//     socketInstance.on('message_delivered', (data) => {
//       console.log('Message delivered:', data);
//     });

//     socketInstance.on('message_read', (data) => {
//       console.log('Message read:', data);
//     });

//     socketInstance.on('status_update', (data) => {
//       console.log('Status update:', data);
//       if (onStatusUpdate) {
//         onStatusUpdate(data);
//       }
//     });

//     socketInstance.on('expert_assigned', (data) => {
//       console.log('Expert assigned:', data);
//       if (onExpertAssigned) {
//         onExpertAssigned(data);
//       }
//     });

//     socketInstance.on('question_accepted', (data) => {
//       console.log('Question accepted:', data);
//       if (onQuestionAccepted) {
//         onQuestionAccepted(data);
//       }
//     });

//     socketInstance.on('new_question_notification', (data) => {
//       console.log('New question notification:', data);
//     });

//     socketInstance.on('disconnect', () => {
//       console.log('Socket disconnected');
//       setIsConnected(false);
//       setIsAuthenticated(false);
//     });

//     socketInstance.on('connect_error', (error) => {
//       console.error('Socket connection error:', error);
//     });

//     return () => {
//       socketInstance.disconnect();
//     };
//   }, [userId, questionId]);

//   // Re-authenticate if userId changes
//   useEffect(() => {
//     if (socket && userId && isConnected) {
//       socket.emit('authenticate', { userId });
//     }
//   }, [socket, userId, isConnected]);

//   // Join question room if questionId changes
//   useEffect(() => {
//     if (socket && questionId && isAuthenticated) {
//       socket.emit('join_question', { questionId });
//     }
//   }, [socket, questionId, isAuthenticated]);

//   const sendMessage = useCallback((data: {
//     questionId: string;
//     content: string;
//     type?: 'text' | 'file';
//     fileUrl?: string;
//   }) => {
//     if (socket && isAuthenticated) {
//       socket.emit('send_message', data);
//       return true;
//     }
//     return false;
//   }, [socket, isAuthenticated]);

//   const markMessageAsRead = useCallback((data: {
//     questionId: string;
//     messageId: string;
//   }) => {
//     if (socket && isAuthenticated) {
//       socket.emit('mark_read', data);
//       return true;
//     }
//     return false;
//   }, [socket, isAuthenticated]);

//   const acceptQuestion = useCallback((data: { questionId: string }) => {
//     if (socket && isAuthenticated) {
//       socket.emit('accept_question', data);
//       return true;
//     }
//     return false;
//   }, [socket, isAuthenticated]);

//   const rejectQuestion = useCallback((data: { questionId: string }) => {
//     if (socket && isAuthenticated) {
//       socket.emit('reject_question', data);
//       return true;
//     }
//     return false;
//   }, [socket, isAuthenticated]);

//   const updateAvailability = useCallback((data: {
//     status: 'available' | 'busy' | 'offline';
//   }) => {
//     if (socket && isAuthenticated) {
//       socket.emit('update_availability', data);
//       return true;
//     }
//     return false;
//   }, [socket, isAuthenticated]);

//   const sendTyping = useCallback((data: {
//     questionId: string;
//     isTyping: boolean;
//   }) => {
//     if (socket && isAuthenticated) {
//       socket.emit('typing', data);
//       return true;
//     }
//     return false;
//   }, [socket, isAuthenticated]);

//   return {
//     socket,
//     isConnected,
//     isAuthenticated,
//     sendMessage,
//     markMessageAsRead,
//     acceptQuestion,
//     rejectQuestion,
//     updateAvailability,
//     sendTyping,
//   };
// }

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id?: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file';
  fileUrl?: string;
  delivered: boolean;
  read: boolean;
  readAt?: Date;
}

interface UseRealTimeOptions {
  questionId?: string;
  userId?: string;

  onNewMessage?: (message: Message) => void;
  onStatusUpdate?: (data: any) => void;
  onExpertAssigned?: (data: any) => void;
  onQuestionAccepted?: (data: any) => void;
}

export function useRealTime({
  questionId,
  userId,
  onNewMessage,
  onStatusUpdate,
  onExpertAssigned,
  onQuestionAccepted,
}: UseRealTimeOptions = {}) {
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Create socket ONCE
   */
  useEffect(() => {
    if (socketRef.current) return;

    /*const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );*/

    const socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
    {
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
    }
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);

      if (userId) {
        socket.emit('authenticate', { userId });
      }
    });

    socket.on('authenticated', () => {
      setIsAuthenticated(true);

      if (questionId) {
        socket.emit('join_question', { questionId });
      }
    });

    socket.on('auth_error', (err) => {
      console.error('Socket auth error:', err);
      setIsAuthenticated(false);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    /**
     * Core events
     */
    socket.on('new_message', (data) => {
      onNewMessage?.(data.message);
    });

    socket.on('status_update', (data) => {
      onStatusUpdate?.(data);
    });

    socket.on('expert_assigned', (data) => {
      onExpertAssigned?.(data);
    });

    socket.on('question_accepted', (data) => {
      onQuestionAccepted?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // IMPORTANT: run once only

  /**
   * Re-authenticate when userId changes
   */
  useEffect(() => {
    if (!socketRef.current || !userId || !isConnected) return;

    socketRef.current.emit('authenticate', { userId });
  }, [userId, isConnected]);

  /**
   * Join question room when ready
   */
  useEffect(() => {
    if (!socketRef.current || !questionId || !isAuthenticated) return;

    socketRef.current.emit('join_question', { questionId });
  }, [questionId, isAuthenticated]);

  /**
   * Emit helpers (safe wrappers)
   */
  const sendMessage = useCallback(
    (data: {
      questionId: string;
      content: string;
      type?: 'text' | 'file';
      fileUrl?: string;
    }) => {
      if (!socketRef.current || !isAuthenticated) return false;

      socketRef.current.emit('send_message', data);
      return true;
    },
    [isAuthenticated]
  );

  const markMessageAsRead = useCallback(
    (data: { questionId: string; messageId: string }) => {
      if (!socketRef.current || !isAuthenticated) return false;

      socketRef.current.emit('mark_read', data);
      return true;
    },
    [isAuthenticated]
  );

  const sendTyping = useCallback(
    (data: { questionId: string; isTyping: boolean }) => {
      if (!socketRef.current || !isAuthenticated) return false;

      socketRef.current.emit('typing', data);
      return true;
    },
    [isAuthenticated]
  );

  const acceptQuestion = useCallback(
    (data: { questionId: string }) => {
      socketRef.current?.emit('accept_question', data);
      return true;
    },
    []
  );

  const rejectQuestion = useCallback(
    (data: { questionId: string }) => {
      socketRef.current?.emit('reject_question', data);
      return true;
    },
    []
  );

  const updateAvailability = useCallback(
    (data: {
      status: 'available' | 'busy' | 'offline';
    }) => {
      socketRef.current?.emit('update_availability', data);
      return true;
    },
    []
  );

  /**
   * Expose socket safely
   */
  const socket = socketRef.current;

  return {
    socket,
    isConnected,
    isAuthenticated,
    sendMessage,
    markMessageAsRead,
    sendTyping,
    acceptQuestion,
    rejectQuestion,
    updateAvailability,
  };
}