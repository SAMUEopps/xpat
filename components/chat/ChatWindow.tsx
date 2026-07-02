// // 'use client';

// // import { useState, useEffect, useRef } from 'react';
// // import { useSocket } from '@/hooks/useSocket';
// // import { MessageBubble } from './MessageBubble';
// // import { SendIcon } from '@/components/icons';

// // interface Message {
// //   senderId: string;
// //   content: string;
// //   timestamp: Date;
// //   type: 'text' | 'file';
// //   fileUrl?: string;
// // }

// // interface ChatWindowProps {
// //   questionId: string;
// //   userId: string;
// //   expertId?: string;
// //   messages: Message[];
// //   onSendMessage: (content: string) => void;
// // }

// // export function ChatWindow({ 
// //   questionId, 
// //   userId, 
// //   expertId, 
// //   messages: initialMessages,
// //   onSendMessage 
// // }: ChatWindowProps) {
// //   const [messages, setMessages] = useState(initialMessages);
// //   const [newMessage, setNewMessage] = useState('');
// //   const [isTyping, setIsTyping] = useState(false);
// //   const messagesEndRef = useRef<HTMLDivElement>(null);
// //   const socket = useSocket(questionId);

// //   useEffect(() => {
// //     if (socket) {
// //       socket.on('new_message', (data) => {
// //         setMessages(prev => [...prev, data.message]);
// //         scrollToBottom();
// //       });

// //       return () => {
// //         socket.off('new_message');
// //       };
// //     }
// //   }, [socket]);

// //   const scrollToBottom = () => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
// //   };

// //   const handleSend = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!newMessage.trim()) return;

// //     onSendMessage(newMessage);
// //     setNewMessage('');
// //   };

// //   return (
// //     <div className="flex flex-col h-full bg-gray-50">
// //       {/* Chat header */}
// //       <div className="px-4 py-3 bg-white border-b border-gray-200">
// //         <div className="flex items-center space-x-3">
// //           <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
// //             {expertId ? 'E' : 'U'}
// //           </div>
// //           <div>
// //             <p className="font-medium text-gray-900">
// //               {expertId ? 'Expert' : 'User'}
// //             </p>
// //             {isTyping && (
// //               <p className="text-sm text-gray-500">Typing...</p>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Messages */}
// //       <div className="flex-1 overflow-y-auto p-4 space-y-3">
// //         {messages.map((msg, index) => (
// //           <MessageBubble
// //             key={index}
// //             message={msg}
// //             isOwn={msg.senderId === userId}
// //           />
// //         ))}
// //         <div ref={messagesEndRef} />
// //       </div>

// //       {/* Input */}
// //       <form onSubmit={handleSend} className="px-4 py-3 bg-white border-t border-gray-200">
// //         <div className="flex items-center space-x-2">
// //           <input
// //             type="text"
// //             value={newMessage}
// //             onChange={(e) => setNewMessage(e.target.value)}
// //             placeholder="Type a message..."
// //             className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// //           />
// //           <button
// //             type="submit"
// //             disabled={!newMessage.trim()}
// //             className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
// //           >
// //             <SendIcon className="w-5 h-5" />
// //           </button>
// //         </div>
// //       </form>
// //     </div>
// //   );
// // }

// // components/chat/ChatWindow.tsx
// 'use client';

// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useRealTime } from '@/hooks/useRealTime';
// import { useAuth } from '@/hooks/useAuth';
// import { format } from 'date-fns';
// import toast from 'react-hot-toast';

// interface Message {
//   _id?: string;
//   senderId: string;
//   content: string;
//   timestamp: Date;
//   type: 'text' | 'file';
//   fileUrl?: string;
//   delivered: boolean;
//   read: boolean;
// }

// interface ChatWindowProps {
//   questionId: string;
//   expertId?: string;
//   userId?: string;
//   initialMessages: Message[];
//   onStatusUpdate?: (status: string) => void;
// }

// export function ChatWindow({ 
//   questionId, 
//   expertId, 
//   userId,
//   initialMessages,
//   onStatusUpdate,
// }: ChatWindowProps) {
//   const { user } = useAuth();
//   const [messages, setMessages] = useState<Message[]>(initialMessages);
//   const [newMessage, setNewMessage] = useState('');
//   const [isTyping, setIsTyping] = useState(false);
//   const [otherUserTyping, setOtherUserTyping] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const {
//     isConnected,
//     isAuthenticated,
//     sendMessage,
//     markMessageAsRead,
//     sendTyping,
//   } = useRealTime({
//     questionId,
//     userId: user?.id,
//     onNewMessage: (message) => {
//       setMessages(prev => [...prev, message]);
//       scrollToBottom();
//       // Auto-mark as read if we're the recipient
//       if (message.senderId !== user?.id) {
//         markMessageAsRead({ questionId, messageId: message._id! });
//       }
//     },
//     onStatusUpdate: (data) => {
//       if (onStatusUpdate) {
//         onStatusUpdate(data.status);
//       }
//     },
//   });

//   const scrollToBottom = () => {
//     setTimeout(() => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, 100);
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Mark initial messages as read
//   useEffect(() => {
//     if (messages.length > 0 && user) {
//       const unreadMessages = messages.filter(
//         msg => msg.senderId !== user.id && !msg.read
//       );
//       for (const msg of unreadMessages) {
//         if (msg._id) {
//           markMessageAsRead({ questionId, messageId: msg._id });
//         }
//       }
//     }
//   }, [messages, user, questionId, markMessageAsRead]);

//   const handleSendMessage = useCallback(async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newMessage.trim() || !user) return;

//     const content = newMessage.trim();
//     setNewMessage('');
//     setIsSending(true);

//     // Optimistically add message
//     const tempMessage: Message = {
//       senderId: user.id,
//       content,
//       timestamp: new Date(),
//       type: 'text',
//       delivered: false,
//       read: false,
//     };
//     setMessages(prev => [...prev, tempMessage]);
//     scrollToBottom();

//     const success = sendMessage({
//       questionId,
//       content,
//       type: 'text',
//     });

//     setIsSending(false);

//     if (!success) {
//       // Handle failure - maybe show retry option
//       toast.error('Failed to send message');
//     }
//   }, [newMessage, user, questionId, sendMessage]);

//   const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//     setNewMessage(e.target.value);
    
//     if (!isTyping) {
//       setIsTyping(true);
//       sendTyping({ questionId, isTyping: true });
//     }

//     // Clear existing timeout
//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//     }

//     // Set timeout to stop typing indicator
//     typingTimeoutRef.current = setTimeout(() => {
//       setIsTyping(false);
//       sendTyping({ questionId, isTyping: false });
//     }, 2000);
//   }, [questionId, sendTyping]);

//   // Clean up typing timeout
//   useEffect(() => {
//     return () => {
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Subscribe to typing events
//   useEffect(() => {
//     const socket = useRealTime().socket;
//     if (socket) {
//       socket.on('user_typing', (data) => {
//         if (data.userId !== user?.id && data.questionId === questionId) {
//           setOtherUserTyping(data.isTyping);
//         }
//       });
//     }
//   }, []);

//   const isOwnMessage = (senderId: string) => senderId === user?.id;

//   return (
//     <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden">
//       {/* Chat Header */}
//       <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
//         <div className="flex items-center space-x-3">
//           <div className="relative">
//             <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
//               {expertId ? 'E' : 'U'}
//             </div>
//             {isConnected && (
//               <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
//             )}
//           </div>
//           <div>
//             <p className="font-medium text-gray-900">
//               {expertId ? 'Expert' : 'User'}
//             </p>
//             <div className="flex items-center space-x-2">
//               {otherUserTyping ? (
//                 <p className="text-sm text-gray-500 animate-pulse">Typing...</p>
//               ) : (
//                 <p className="text-sm text-gray-500">
//                   {isConnected ? 'Online' : 'Offline'}
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center space-x-2">
//           <span className={`px-2 py-1 text-xs rounded-full ${
//             isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
//           }`}>
//             {isConnected ? 'Connected' : 'Disconnected'}
//           </span>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
//         {messages.length === 0 ? (
//           <div className="text-center py-12 text-gray-500">
//             <p className="text-6xl mb-4">💬</p>
//             <p>No messages yet</p>
//             <p className="text-sm">Start the conversation</p>
//           </div>
//         ) : (
//           messages.map((msg, index) => {
//             const isOwn = isOwnMessage(msg.senderId);
//             return (
//               <div
//                 key={msg._id || index}
//                 className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
//                   <div
//                     className={`rounded-lg px-4 py-2 ${
//                       isOwn
//                         ? 'bg-blue-500 text-white'
//                         : 'bg-white text-gray-900 shadow-sm'
//                     }`}
//                   >
//                     <p className="text-sm break-words">{msg.content}</p>
//                     <div className="flex items-center justify-end space-x-1 mt-1">
//                       <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
//                         {format(new Date(msg.timestamp), 'HH:mm')}
//                       </span>
//                       {isOwn && (
//                         <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
//                           {msg.delivered ? (msg.read ? '✓✓' : '✓') : '⌛'}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <form onSubmit={handleSendMessage} className="px-4 py-3 bg-white border-t border-gray-200">
//         <div className="flex items-center space-x-2">
//           <input
//             ref={inputRef}
//             type="text"
//             value={newMessage}
//             onChange={handleTyping}
//             placeholder={isConnected ? "Type a message..." : "Connecting..."}
//             className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//             disabled={!isConnected || isSending}
//           />
//           <button
//             type="submit"
//             disabled={!newMessage.trim() || !isConnected || isSending}
//             className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//             </svg>
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRealTime } from '@/hooks/useRealTime';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Message {
  _id?: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file';
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

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * REALTIME HOOK (single source of truth)
   */
  const {
    socket,
    isConnected,
    sendMessage,
    markMessageAsRead,
    sendTyping,
  } = useRealTime({
    questionId,
    userId: user?.id,

    onNewMessage: (message) => {
      setMessages((prev) => [...prev, message]);

      scrollToBottom();

      // Auto mark read if it's not our message
      if (message.senderId !== user?.id && message._id) {
        markMessageAsRead({
          questionId,
          messageId: message._id,
        });
      }
    },

    onStatusUpdate: (data) => {
      onStatusUpdate?.(data.status);
    },
  });

  /**
   * Scroll helper
   */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 100);
  }, []);

  /**
   * Scroll on new messages
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Mark unread messages as read
   */
  useEffect(() => {
    if (!user) return;

    const unread = messages.filter(
      (m) => m.senderId !== user.id && !m.read && m._id
    );

    unread.forEach((m) => {
      markMessageAsRead({
        questionId,
        messageId: m._id!,
      });
    });
  }, [messages, user, questionId, markMessageAsRead]);

  /**
   * HANDLE SEND MESSAGE
   */
  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newMessage.trim() || !user) return;

      const content = newMessage.trim();
      setNewMessage('');
      setIsSending(true);

      // optimistic UI update
      const tempMessage: Message = {
        senderId: user.id,
        content,
        timestamp: new Date(),
        type: 'text',
        delivered: false,
        read: false,
      };

      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      const ok = sendMessage({
        questionId,
        content,
        type: 'text',
      });

      setIsSending(false);

      if (!ok) {
        toast.error('Failed to send message');
      }
    },
    [newMessage, user, questionId, sendMessage, scrollToBottom]
  );

  /**
   * HANDLE TYPING
   */
  const handleTyping = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);

      if (sendTyping) {
        sendTyping({ questionId, isTyping: true });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping?.({ questionId, isTyping: false });
      }, 1500);
    },
    [questionId, sendTyping]
  );

  /**
   * SOCKET: typing listener (FIXED)
   */
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: any) => {
      if (
        data.questionId === questionId &&
        data.userId !== user?.id
      ) {
        setOtherUserTyping(data.isTyping);
      }
    };

    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('user_typing', handleTyping);
    };
  }, [socket, questionId, user?.id]);

  /**
   * cleanup typing timeout
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const isOwnMessage = (senderId: string) =>
    senderId === user?.id;

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden">

      {/* HEADER */}
      <div className="px-4 py-3 bg-white border-b flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {expertId ? 'E' : 'U'}
          </div>

          <div>
            <p className="font-medium">
              {expertId ? 'Expert' : 'User'}
            </p>
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

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No messages yet
          </div>
        ) : (
          messages.map((msg, i) => {
            const own = isOwnMessage(msg.senderId);

            return (
              <div
                key={msg._id || i}
                className={`flex ${
                  own ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    own
                      ? 'bg-blue-500 text-white'
                      : 'bg-white shadow'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>

                  <div className="flex justify-end space-x-1 text-xs mt-1">
                    <span>
                      {format(new Date(msg.timestamp), 'HH:mm')}
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

      {/* INPUT */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t bg-white flex gap-2"
      >
        <input
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 text-sm"
          disabled={!isConnected || isSending}
        />

        <button
          disabled={!newMessage.trim() || isSending}
          className="bg-blue-500 text-white px-4 py-2 rounded-full"
        >
          Send
        </button>
      </form>
    </div>
  );
}