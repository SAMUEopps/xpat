// import { Server as SocketServer } from 'socket.io';
// import { Server as HTTPServer } from 'http';
// import { Question } from '@/models/Question';
// import { User } from '@/models/User';

// export function setupSocketServer(server: HTTPServer) {
//   const io = new SocketServer(server, {
//     cors: {
//       origin: process.env.NEXT_PUBLIC_APP_URL,
//       methods: ['GET', 'POST'],
//     },
//   });

//   io.on('connection', (socket) => {
//     console.log('User connected:', socket.id);

//     // Join user's room
//     socket.on('join', (userId: string) => {
//       socket.join(`user_${userId}`);
//       console.log(`User ${userId} joined their room`);
//     });

//     // Join question room for chat
//     socket.on('join_question', (questionId: string) => {
//       socket.join(`question_${questionId}`);
//       console.log(`User joined question ${questionId}`);
//     });

//     // Send message
//     socket.on('send_message', async (data: {
//       questionId: string;
//       senderId: string;
//       content: string;
//       type?: 'text' | 'file';
//       fileUrl?: string;
//     }) => {
//       try {
//         const { questionId, senderId, content, type = 'text', fileUrl } = data;

//         // Save message to database
//         const question = await Question.findById(questionId);
//         if (!question) throw new Error('Question not found');

//         question.messages.push({
//           senderId: senderId as any,
//           content,
//           timestamp: new Date(),
//           type: type as any,
//           fileUrl,
//         });

//         await question.save();

//         // Broadcast to everyone in the question room
//         io.to(`question_${questionId}`).emit('new_message', {
//           questionId,
//           message: {
//             senderId,
//             content,
//             timestamp: new Date(),
//             type,
//             fileUrl,
//           },
//         });

//         // Notify if question is assigned
//         if (question.assignedExpert) {
//           const expert = await User.findById(question.assignedExpert);
//           if (expert) {
//             io.to(`user_${expert._id}`).emit('new_message_notification', {
//               questionId,
//               message: content,
//               from: senderId,
//             });
//           }
//         }

//       } catch (error) {
//         console.error('Error sending message:', error);
//         socket.emit('error', { message: 'Failed to send message' });
//       }
//     });

//     // Expert accepts question
//     socket.on('accept_question', async (data: {
//       questionId: string;
//       expertId: string;
//     }) => {
//       try {
//         const { questionId, expertId } = data;

//         const question = await Question.findById(questionId);
//         if (!question) throw new Error('Question not found');

//         if (question.status !== 'open') {
//           throw new Error('Question already assigned');
//         }

//         question.assignedExpert = expertId as any;
//         question.status = 'assigned';
//         await question.save();

//         // Notify expert and user
//         io.to(`user_${expertId}`).emit('question_accepted', { questionId });
//         io.to(`user_${question.userId}`).emit('question_accepted', { 
//           questionId,
//           expertId 
//         });

//         // Join both to the question room
//         io.to(`user_${expertId}`).emit('join_question', questionId);
//         io.to(`user_${question.userId}`).emit('join_question', questionId);

//       } catch (error) {
//         console.error('Error accepting question:', error);
//         socket.emit('error', { message: 'Failed to accept question' });
//       }
//     });

//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);
//     });
//   });

//   return io;
// }

// lib/socket-server.ts
import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Question } from '@/models/Question';
import { User } from '@/models/User';
import { ExpertProfile } from '@/models/ExpertProfile';
import { MatchingEngine } from './matching-engine';

interface ConnectedUser {
  userId: string;
  socketId: string;
  role: 'user' | 'expert';
  lastActive: Date;
}

export class SocketManager {
  private io: SocketServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private expertSessions: Map<string, string> = new Map(); // expertId -> questionId

  constructor(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ["websocket", "polling"], // 🔥 ADD THIS
      allowEIO3: true, // helps compatibility
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Authentication handler
      socket.on('authenticate', async (data: { userId: string }) => {
        try {
          const user = await User.findById(data.userId);
          if (!user) {
            socket.emit('auth_error', { message: 'User not found' });
            return;
          }

          // Store user connection
          this.connectedUsers.set(socket.id, {
            userId: data.userId,
            socketId: socket.id,
            role: user.role === 'expert' || user.role === 'both' ? 'expert' : 'user',
            lastActive: new Date(),
          });

          // Join user's personal room
          socket.join(`user_${data.userId}`);
          
          // If expert, update availability
          if (user.role === 'expert' || user.role === 'both') {
            await ExpertProfile.findOneAndUpdate(
              { userId: data.userId },
              { 'availability.status': 'available', 'availability.lastActiveAt': new Date() }
            );
          }

          socket.emit('authenticated', { success: true, user });
          console.log(`User ${data.userId} authenticated successfully`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Join question room for chat
      socket.on('join_question', async (data: { questionId: string }) => {
        try {
          const question = await Question.findById(data.questionId)
            .populate('userId', 'name email')
            .populate('assignedExpert', 'name email');
          
          if (!question) {
            socket.emit('error', { message: 'Question not found' });
            return;
          }

          socket.join(`question_${data.questionId}`);
          
          // Send chat history
          socket.emit('chat_history', {
            questionId: data.questionId,
            messages: question.messages,
          });

          // Notify others in the room
          socket.to(`question_${data.questionId}`).emit('user_joined', {
            userId: socket.data.userId,
            questionId: data.questionId,
          });

          console.log(`User joined question ${data.questionId}`);
        } catch (error) {
          console.error('Error joining question:', error);
          socket.emit('error', { message: 'Failed to join question' });
        }
      });

      // Send message with delivery/read receipts
      socket.on('send_message', async (data: {
        questionId: string;
        content: string;
        type?: 'text' | 'file';
        fileUrl?: string;
      }) => {
        try {
          const { questionId, content, type = 'text', fileUrl } = data;
          const senderInfo = this.connectedUsers.get(socket.id);
          
          if (!senderInfo) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const question = await Question.findById(questionId);
          if (!question) {
            socket.emit('error', { message: 'Question not found' });
            return;
          }

          // Create message with delivery tracking
          const message = {
            senderId: senderInfo.userId as any,
            content,
            timestamp: new Date(),
            type: type as any,
            fileUrl,
            delivered: false,
            read: false,
          };

          question.messages.push(message);
          await question.save();

          // Get the saved message with ID
          const savedMessage = question.messages[question.messages.length - 1];

          // Broadcast to everyone in the question room
          this.io.to(`question_${questionId}`).emit('new_message', {
            questionId,
            message: {
              ...savedMessage,
              _id: savedMessage._id,
            },
          });

          // Send delivery confirmation to sender
          socket.emit('message_delivered', {
            messageId: savedMessage._id,
            questionId,
          });

          // Track if it's a response to a question
          if (question.status === 'assigned') {
            // Update expert response time if this is from expert
            const expertId = question.assignedExpert?.toString();
            if (expertId && senderInfo.userId === expertId) {
              await this.updateExpertResponseTime(expertId);
            }
          }

          // Update question status if first message from expert
          if (question.assignedExpert?.toString() === senderInfo.userId && question.status === 'assigned') {
            question.status = 'in_progress';
            await question.save();
            this.io.to(`question_${questionId}`).emit('status_update', {
              questionId,
              status: 'in_progress',
            });
          }

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Mark message as read
      socket.on('mark_read', async (data: { questionId: string; messageId: string }) => {
        try {
          const { questionId, messageId } = data;
          const userInfo = this.connectedUsers.get(socket.id);
          
          if (!userInfo) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          await Question.findOneAndUpdate(
            { 
              _id: questionId,
              'messages._id': messageId,
            },
            { 
              $set: { 
                'messages.$.read': true,
                'messages.$.readAt': new Date(),
              }
            }
          );

          this.io.to(`question_${questionId}`).emit('message_read', {
            questionId,
            messageId,
            readBy: userInfo.userId,
            readAt: new Date(),
          });
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });

      // Expert accepts question
      socket.on('accept_question', async (data: { questionId: string }) => {
        try {
          const { questionId } = data;
          const expertInfo = this.connectedUsers.get(socket.id);
          
          if (!expertInfo) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const question = await Question.findById(questionId)
            .populate('userId', 'name email avatar');
          
          if (!question) {
            socket.emit('error', { message: 'Question not found' });
            return;
          }

          if (question.status !== 'open') {
            socket.emit('error', { message: 'Question already assigned or resolved' });
            return;
          }

          // Assign expert
          question.assignedExpert = expertInfo.userId as any;
          question.status = 'assigned';
          
          // Update notification status
          const notification = question.expertNotifications.find(
            n => n.expertId.toString() === expertInfo.userId
          );
          if (notification) {
            notification.respondedAt = new Date();
            notification.response = 'accepted';
          }

          await question.save();

          // Store active session
          this.expertSessions.set(expertInfo.userId, questionId);

          // Update expert's current questions count
          await ExpertProfile.findOneAndUpdate(
            { userId: expertInfo.userId },
            { $inc: { 'availability.currentQuestionsToday': 1 } }
          );

          // Join expert to question room
          socket.join(`question_${questionId}`);
          
          // Notify everyone
          this.io.to(`question_${questionId}`).emit('expert_assigned', {
            questionId,
            expertId: expertInfo.userId,
            expertName: socket.data.userName || 'Expert',
          });

          // Notify the user
          const userSocketId = this.getUserSocketId(question.userId.toString());
          if (userSocketId) {
            this.io.to(userSocketId).emit('question_accepted', {
              questionId,
              expertId: expertInfo.userId,
              message: `An expert has accepted your question!`,
            });
            // Auto-join user to chat room
            this.io.to(userSocketId).emit('join_question', questionId);
          }

          // Notify other experts that question is taken
          this.io.emit('question_closed', { questionId });

        } catch (error) {
          console.error('Error accepting question:', error);
          socket.emit('error', { message: 'Failed to accept question' });
        }
      });

      // Expert rejects question
      socket.on('reject_question', async (data: { questionId: string }) => {
        try {
          const { questionId } = data;
          const expertInfo = this.connectedUsers.get(socket.id);
          
          if (!expertInfo) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const question = await Question.findById(questionId);
          if (!question) {
            socket.emit('error', { message: 'Question not found' });
            return;
          }

          // Update notification
          const notification = question.expertNotifications.find(
            n => n.expertId.toString() === expertInfo.userId
          );
          if (notification) {
            notification.respondedAt = new Date();
            notification.response = 'rejected';
          }
          await question.save();

          // Check if we need to find more experts
          const pendingNotifications = question.expertNotifications.filter(
            n => n.response === undefined
          );

          if (pendingNotifications.length === 0 && question.status === 'open') {
            // Find more experts
            await MatchingEngine.findMatches(questionId, 3);
          }

        } catch (error) {
          console.error('Error rejecting question:', error);
          socket.emit('error', { message: 'Failed to reject question' });
        }
      });

      // Typing indicator
      socket.on('typing', (data: { questionId: string; isTyping: boolean }) => {
        const { questionId, isTyping } = data;
        socket.to(`question_${questionId}`).emit('user_typing', {
          questionId,
          userId: socket.data.userId,
          isTyping,
        });
      });

      // Update expert availability
      socket.on('update_availability', async (data: { status: 'available' | 'busy' | 'offline' }) => {
        try {
          const userInfo = this.connectedUsers.get(socket.id);
          if (!userInfo) return;

          await ExpertProfile.findOneAndUpdate(
            { userId: userInfo.userId },
            { 
              'availability.status': data.status,
              'availability.lastActiveAt': new Date(),
            }
          );

          // Broadcast availability change
          this.io.emit('expert_status_change', {
            expertId: userInfo.userId,
            status: data.status,
          });

        } catch (error) {
          console.error('Error updating availability:', error);
        }
      });

      // Disconnect handler
      socket.on('disconnect', async () => {
        const userInfo = this.connectedUsers.get(socket.id);
        if (userInfo) {
          console.log(`User ${userInfo.userId} disconnected`);

          // Update expert availability
          if (userInfo.role === 'expert') {
            await ExpertProfile.findOneAndUpdate(
              { userId: userInfo.userId },
              { 'availability.status': 'offline' }
            );
          }

          this.connectedUsers.delete(socket.id);
          
          // Check if expert was in an active session
          const activeQuestionId = this.expertSessions.get(userInfo.userId);
          if (activeQuestionId) {
            // Notify user that expert went offline
            this.io.to(`question_${activeQuestionId}`).emit('expert_offline', {
              questionId: activeQuestionId,
              expertId: userInfo.userId,
            });
          }
          this.expertSessions.delete(userInfo.userId);
        }
      });
    });
  }

  // Helper methods
  private getUserSocketId(userId: string): string | undefined {
    for (const [socketId, user] of this.connectedUsers) {
      if (user.userId === userId) {
        return socketId;
      }
    }
    return undefined;
  }

  private async updateExpertResponseTime(expertId: string) {
    try {
      const profile = await ExpertProfile.findOne({ userId: expertId });
      if (profile) {
        // Simple moving average update
        const avgResponseTime = (profile.responseTime * 0.7 + 30 * 0.3); // Assume 30s response
        await ExpertProfile.findOneAndUpdate(
          { userId: expertId },
          { responseTime: Math.round(avgResponseTime) }
        );
      }
    } catch (error) {
      console.error('Error updating response time:', error);
    }
  }

  // Public methods
  public notifyExperts(questionId: string, expertIds: string[]) {
    for (const expertId of expertIds) {
      const socketId = this.getUserSocketId(expertId);
      if (socketId) {
        this.io.to(socketId).emit('new_question_notification', {
          questionId,
          urgency: 'medium', // This would come from the question
          timestamp: new Date(),
        });
      }
    }
  }

  public getIO() {
    return this.io;
  }
}

export function setupSocketServer(server: HTTPServer) {
  return new SocketManager(server);
}

