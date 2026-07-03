
// components/chat/ChatWindow.tsx - Fix the user name display
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRealTime } from '@/hooks/useRealTime';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface Message {
  _id?: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  delivered: boolean;
  read: boolean;
}

interface ChatWindowProps {
  questionId: string;
  expertId?: string;
  userId?: string;
  initialMessages: Message[];
  onStatusUpdate?: (status: string) => void;
}

export function ChatWindow({
  questionId,
  expertId,
  userId,
  initialMessages,
  onStatusUpdate,
}: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('🔍 ChatWindow mounted with:', {
    questionId,
    expertId,
    userId,
    user: user?.id,
    userName: user?.name,
    initialMessagesCount: initialMessages?.length || 0,
  });

  // Determine the other user's name
  useEffect(() => {
    if (!user) return;
    
    // If we're the expert, the other user is the question owner
    if (user.id === expertId) {
      setOtherUserName('User');
    } 
    // If we're the owner, the other user is the expert
    else if (user.id === userId) {
      setOtherUserName('Expert');
    }
    // If we're neither (shouldn't happen)
    else {
      setOtherUserName('Other');
    }
    
    console.log('👤 Other user name set to:', otherUserName);
  }, [user, expertId, userId]);

  const {
    isConnected,
    sendMessage,
    markMessageAsRead,
    sendTyping,
  } = useRealTime({
    questionId,
    userId: user?.id,
    onNewMessage: (message) => {
      console.log('💬 NEW MESSAGE RECEIVED in ChatWindow:', {
        message,
        currentMessages: messages.length,
        isOwn: message.senderId === user?.id,
      });
      
      setMessages((prev) => {
        // Avoid duplicates
        if (message._id && prev.some(m => m._id === message._id)) {
          console.log('⚠️ Duplicate message detected, skipping:', message._id);
          return prev;
        }
        const newMessages = [...prev, message];
        console.log('✅ Messages updated, new count:', newMessages.length);
        return newMessages;
      });
      scrollToBottom();
      
      // Auto mark read if it's not our message
      if (message.senderId !== user?.id && message._id) {
        console.log('📖 Marking message as read:', message._id);
        markMessageAsRead({
          questionId,
          messageId: message._id,
        });
      }
    },
    onStatusUpdate: (data) => {
      console.log('📊 Status update in chat:', data);
      onStatusUpdate?.(data.status);
    },
    onTyping: (data) => {
      console.log('⌨️ Typing event received:', data);
      if (data.userId !== user?.id) {
        setOtherUserTyping(data.isTyping);
      }
    },
  });

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 100);
  }, []);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Mark unread messages as read
  useEffect(() => {
    if (!user) return;

    const unread = messages.filter(
      (m) => m.senderId !== user.id && !m.read && m._id
    );

    if (unread.length > 0) {
      console.log(`📖 Marking ${unread.length} unread messages as read`);
      unread.forEach((m) => {
        markMessageAsRead({
          questionId,
          messageId: m._id!,
        });
      });
    }
  }, [messages, user, questionId, markMessageAsRead]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      console.log('🚀 SEND BUTTON CLICKED', {
        newMessage: newMessage.trim(),
        user: user?.id,
        userName: user?.name,
        isSending,
        isConnected,
        questionId,
      });
      
      if (!newMessage.trim()) {
        console.log('❌ Empty message, ignoring');
        return;
      }
      
      if (!user) {
        console.log('❌ No user, ignoring');
        toast.error('Please login to send messages');
        return;
      }
      
      if (isSending) {
        console.log('⏳ Already sending, ignoring');
        return;
      }

      const content = newMessage.trim();
      setNewMessage('');
      setIsSending(true);

      // Optimistic UI update
      const tempMessage: Message = {
        senderId: user.id,
        content,
        timestamp: new Date(),
        type: 'text',
        delivered: false,
        read: false,
      };

      console.log('📤 Adding optimistic message:', tempMessage);
      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      console.log('📤 Sending message via socket...');
      const ok = sendMessage({
        questionId,
        content,
        type: 'text',
      });

      console.log('📤 Send result:', ok);
      setIsSending(false);

      if (!ok) {
        console.log('❌ Failed to send message');
        toast.error('Failed to send message');
        // Remove optimistic message
        setMessages((prev) => prev.filter(m => m !== tempMessage));
      } else {
        console.log('✅ Message sent successfully');
        toast.success('Message sent!');
      }
    },
    [newMessage, user, questionId, sendMessage, scrollToBottom, isSending]
  );

  const handleTyping = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      console.log('⌨️ Typing:', value);
      setNewMessage(value);

      if (sendTyping) {
        sendTyping({ questionId, isTyping: true });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        console.log('⌨️ Stopped typing');
        sendTyping?.({ questionId, isTyping: false });
      }, 1500);
    },
    [questionId, sendTyping]
  );

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const isOwnMessage = (senderId: string) => senderId === user?.id;

  console.log('🎨 Rendering ChatWindow with:', {
    isConnected,
    messagesCount: messages.length,
    otherUserTyping,
    otherUserName,
    userId: user?.id,
    expertId,
    questionOwnerId: userId,
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {otherUserName ? otherUserName[0] : '?'}
          </div>
          <div>
            <p className="font-medium">{otherUserName || 'User'}</p>
            <p className="text-xs text-gray-500">
              {otherUserTyping
                ? 'Typing...'
                : isConnected
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            isConnected
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const own = isOwnMessage(msg.senderId);
            return (
              <div
                key={msg._id || i}
                className={`flex ${own ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    own
                      ? 'bg-blue-500 text-white'
                      : 'bg-white shadow'
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <div className="flex justify-end space-x-1 text-xs mt-1 opacity-70">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {own && (
                      <span>
                        {msg.delivered
                          ? msg.read
                            ? '✓✓'
                            : '✓'
                          : '⌛'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t bg-white flex gap-2"
      >
        <input
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!isConnected || isSending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending || !isConnected}
          className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}