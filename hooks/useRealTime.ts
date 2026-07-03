
// hooks/useRealTime.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id?: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  delivered: boolean;
  read: boolean;
  readAt?: Date;
}

interface Question {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  urgency: 'low' | 'medium' | 'high';
  status: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface UseRealTimeOptions {
  questionId?: string;
  userId?: string;
  onNewMessage?: (message: Message) => void;
  onStatusUpdate?: (data: any) => void;
  onExpertAssigned?: (data: any) => void;
  onQuestionAccepted?: (data: any) => void;
  onNewQuestion?: (question: Question) => void;
  onExpertOnline?: (data: any) => void;
  onExpertOffline?: (data: any) => void;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
}

export function useRealTime({
  questionId,
  userId,
  onNewMessage,
  onStatusUpdate,
  onExpertAssigned,
  onQuestionAccepted,
  onNewQuestion,
  onExpertOnline,
  onExpertOffline,
  onTyping,
}: UseRealTimeOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (socketRef.current) return;

    const socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
      {
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      }
    );

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Socket connected with ID:', socketInstance.id);
      
      if (userId) {
        socketInstance.emit('authenticate', { userId });
      }
    });

    socketInstance.on('authenticated', (data) => {
      setIsAuthenticated(true);
      console.log('✅ Socket authenticated for user:', data.user?.name);

      if (questionId) {
        socketInstance.emit('join_question', { questionId });
      }
    });

    socketInstance.on('auth_error', (err) => {
      console.error('❌ Socket auth error:', err);
      setIsAuthenticated(false);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
      console.log('🔴 Socket disconnected');
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
    });

    // ✅ FIX: Core events with proper data handling
    socketInstance.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      if (data.message) {
        onNewMessage?.(data.message);
      }
    });

    socketInstance.on('status_update', (data) => {
      console.log('📊 Status update:', data);
      onStatusUpdate?.(data);
    });

    socketInstance.on('expert_assigned', (data) => {
      console.log('👨‍💼 Expert assigned:', data);
      onExpertAssigned?.(data);
    });

    socketInstance.on('question_accepted', (data) => {
      console.log('✅ Question accepted:', data);
      onQuestionAccepted?.(data);
    });

    socketInstance.on('new_question_notification', (data) => {
      console.log('📢 New question notification:', data);
      onNewQuestion?.(data.question);
    });

    socketInstance.on('expert_online', (data) => {
      console.log('🟢 Expert online:', data);
      onExpertOnline?.(data);
    });

    socketInstance.on('expert_offline', (data) => {
      console.log('🔴 Expert offline:', data);
      onExpertOffline?.(data);
    });

    socketInstance.on('user_typing', (data) => {
      onTyping?.(data);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, []); // Empty dependency array - only run once

  // Re-authenticate when userId changes
  useEffect(() => {
    if (!socketRef.current || !userId || !isConnected) return;
    socketRef.current.emit('authenticate', { userId });
  }, [userId, isConnected]);

  // Join question room when ready
  useEffect(() => {
    if (!socketRef.current || !questionId || !isAuthenticated) return;
    socketRef.current.emit('join_question', { questionId });
  }, [questionId, isAuthenticated]);

  // ✅ FIX: Emit helpers with better error handling
  /*const sendMessage = useCallback(
    (data: {
      questionId: string;
      content: string;
      type?: 'text' | 'file' | 'image';
      fileUrl?: string;
    }) => {
      if (!socketRef.current) {
        console.error('❌ Socket not connected');
        return false;
      }
      if (!isAuthenticated) {
        console.error('❌ Not authenticated');
        return false;
      }
      
      console.log('📤 Sending message:', data);
      socketRef.current.emit('send_message', data);
      return true;
    },
    [isAuthenticated]
  );*/

  // hooks/useRealTime.ts - Add logging to sendMessage
const sendMessage = useCallback(
  (data: {
    questionId: string;
    content: string;
    type?: 'text' | 'file' | 'image';
    fileUrl?: string;
  }) => {
    console.log('📤 useRealTime.sendMessage called:', {
      data,
      socketExists: !!socketRef.current,
      isAuthenticated,
      socketId: socketRef.current?.id,
    });
    
    if (!socketRef.current) {
      console.error('❌ Socket not connected in useRealTime');
      return false;
    }
    if (!isAuthenticated) {
      console.error('❌ Not authenticated in useRealTime');
      return false;
    }
    
    console.log('📤 Emitting send_message event...');
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
      if (!socketRef.current) return false;
      console.log('📨 Accepting question:', data);
      socketRef.current.emit('accept_question', data);
      return true;
    },
    []
  );

  const rejectQuestion = useCallback(
    (data: { questionId: string }) => {
      if (!socketRef.current) return false;
      socketRef.current.emit('reject_question', data);
      return true;
    },
    []
  );

  const updateAvailability = useCallback(
    (data: { status: 'available' | 'busy' | 'offline' }) => {
      if (!socketRef.current) return false;
      socketRef.current.emit('update_availability', data);
      return true;
    },
    []
  );

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