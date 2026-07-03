// lib/socket-server.ts
import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Question } from '@/models/Question';
import { User } from '@/models/User';
import { ExpertProfile } from '@/models/ExpertProfile';
import { MatchingEngine } from './matching-engine';
import { connectDB } from './db';

interface ConnectedUser {
  userId: string;
  socketId: string;
  role: 'user' | 'expert';
  lastActive: Date;
  userName?: string;
}

export class SocketManager {
  private io: SocketServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private expertSessions: Map<string, string> = new Map();

  constructor(server: HTTPServer) {
    console.log('🔧 Initializing Socket.IO server...');
    
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    console.log('✅ Socket.IO server initialized');
    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // ==================== AUTHENTICATION ====================
      socket.on('authenticate', async (data: { userId: string }) => {
        try {
          console.log(`🔐 Authenticating user: ${data.userId}`);
          
          // Ensure DB connection
          await connectDB();
          
          const user = await User.findById(data.userId);
          if (!user) {
            console.log(`❌ User not found: ${data.userId}`);
            socket.emit('auth_error', { message: 'User not found' });
            return;
          }

          // Store user connection
          const userInfo: ConnectedUser = {
            userId: data.userId,
            socketId: socket.id,
            role: user.role === 'expert' || user.role === 'both' ? 'expert' : 'user',
            lastActive: new Date(),
            userName: user.name,
          };

          this.connectedUsers.set(socket.id, userInfo);

          // Join user's personal room
          socket.join(`user_${data.userId}`);
          
          // If expert, update availability and join expert rooms
          if (user.role === 'expert' || user.role === 'both') {
            socket.join('expert_room');
            socket.join(`expert_${data.userId}`);
            
            console.log(`✅ Expert ${user.name} (${data.userId}) joined rooms:`);
            console.log(`   - expert_room (global)`);
            console.log(`   - expert_${data.userId} (personal)`);
            
            await ExpertProfile.findOneAndUpdate(
              { userId: data.userId },
              { 
                'availability.status': 'available', 
                'availability.lastActiveAt': new Date() 
              }
            );

            this.io.emit('expert_online', {
              expertId: data.userId,
              userName: user.name,
            });
          }

          socket.emit('authenticated', { 
            success: true, 
            user: { ...user.toObject(), socketId: socket.id } 
          });
          
          console.log(`✅ User ${user.name} authenticated successfully`);
          console.log(`📡 Socket ${socket.id} is in rooms:`, Array.from(socket.rooms));
          
        } catch (error) {
          console.error('❌ Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // ==================== JOIN QUESTION ROOM ====================
      /*socket.on('join_question', async (data: { questionId: string }) => {
        try {
          console.log(`📝 User joining question room: ${data.questionId}`);
          
          const question = await Question.findById(data.questionId)
            .populate('userId', 'name email avatar')
            .populate('assignedExpert', 'name email avatar');
          
          if (!question) {
            console.log(`❌ Question not found: ${data.questionId}`);
            socket.emit('error', { message: 'Question not found' });
            return;
          }

          socket.join(`question_${data.questionId}`);
          console.log(`✅ User joined question_${data.questionId}`);
          
          // Send chat history
          socket.emit('chat_history', {
            questionId: data.questionId,
            messages: question.messages || [],
            question: question,
          });

          // Notify others in the room
          socket.to(`question_${data.questionId}`).emit('user_joined', {
            userId: socket.data.userId,
            questionId: data.questionId,
          });

        } catch (error) {
          console.error('❌ Error joining question:', error);
          socket.emit('error', { message: 'Failed to join question' });
        }
      });*/

      // lib/socket-server.ts - Enhanced join_question handler
socket.on('join_question', async (data: { questionId: string }) => {
  try {
    console.log(`📝 JOIN_QUESTION event received:`, {
      questionId: data.questionId,
      socketId: socket.id,
      userId: this.connectedUsers.get(socket.id)?.userId,
    });
    
    const question = await Question.findById(data.questionId)
      .populate('userId', 'name email avatar')
      .populate('assignedExpert', 'name email avatar');
    
    if (!question) {
      console.log(`❌ Question not found: ${data.questionId}`);
      socket.emit('error', { message: 'Question not found' });
      return;
    }

    // Join the room
    socket.join(`question_${data.questionId}`);
    console.log(`✅ Socket ${socket.id} joined question_${data.questionId}`);
    
    // Log all rooms this socket is in
    console.log(`📡 Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
    
    // Send chat history
    const historyData = {
      questionId: data.questionId,
      messages: question.messages || [],
      question: question,
    };
    
    console.log(`📚 Sending chat history with ${question.messages?.length || 0} messages`);
    socket.emit('chat_history', historyData);

    // Notify others in the room
    socket.to(`question_${data.questionId}`).emit('user_joined', {
      userId: this.connectedUsers.get(socket.id)?.userId,
      questionId: data.questionId,
    });

  } catch (error) {
    console.error('❌ Error joining question:', error);
    socket.emit('error', { message: 'Failed to join question' });
  }
});

      // ==================== SEND MESSAGE (CRITICAL) ====================
      socket.on('send_message', async (data: {
        questionId: string;
        content: string;
        type?: 'text' | 'file' | 'image';
        fileUrl?: string;
      }) => {
        console.log('📨 SEND_MESSAGE event received:', {
          questionId: data.questionId,
          content: data.content?.substring(0, 50),
          type: data.type,
          socketId: socket.id,
        });
        
        try {
          const { questionId, content, type = 'text', fileUrl } = data;
          
          // Get sender info
          const senderInfo = this.connectedUsers.get(socket.id);
          console.log('👤 Sender info:', senderInfo ? {
            userId: senderInfo.userId,
            userName: senderInfo.userName,
            role: senderInfo.role,
          } : 'NOT FOUND');
          
          if (!senderInfo) {
            console.log('❌ Sender not authenticated');
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          // Find question
          const question = await Question.findById(questionId);
          console.log('📄 Question found:', question ? 'YES' : 'NO');
          
          if (!question) {
            console.log('❌ Question not found:', questionId);
            socket.emit('error', { message: 'Question not found' });
            return;
          }

          // Check if user has access to this question
          const isOwner = question.userId.toString() === senderInfo.userId;
          const isExpert = question.assignedExpert?.toString() === senderInfo.userId;
          
          if (!isOwner && !isExpert) {
            console.log('❌ User does not have access to this question');
            socket.emit('error', { message: 'You do not have access to this conversation' });
            return;
          }

          // Create message
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

          const savedMessage = question.messages[question.messages.length - 1];
          console.log('✅ Message saved with ID:', savedMessage._id);

          // Broadcast to everyone in the question room
          const roomName = `question_${questionId}`;
          console.log(`📢 Broadcasting to room: ${roomName}`);
          
          this.io.to(roomName).emit('new_message', {
            questionId,
            message: {
              ...savedMessage.toObject(),
              _id: savedMessage._id,
            },
          });

          console.log('✅ Message broadcasted successfully');

          // Send delivery confirmation to sender
          socket.emit('message_delivered', {
            messageId: savedMessage._id,
            questionId,
          });

          // Update question status if first message from expert
          if (question.assignedExpert?.toString() === senderInfo.userId && 
              question.status === 'assigned') {
            question.status = 'in_progress';
            await question.save();
            this.io.to(`question_${questionId}`).emit('status_update', {
              questionId,
              status: 'in_progress',
            });
            console.log('📊 Question status updated to: in_progress');
          }

        } catch (error) {
          console.error('❌ Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // ==================== MARK MESSAGE AS READ ====================
      socket.on('mark_read', async (data: { questionId: string; messageId: string }) => {
        try {
          console.log(`📖 Marking message as read: ${data.messageId}`);
          
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
          
          console.log('✅ Message marked as read');
        } catch (error) {
          console.error('❌ Error marking message as read:', error);
        }
      });

      // ==================== TYPING INDICATOR ====================
      socket.on('typing', (data: { questionId: string; isTyping: boolean }) => {
        const { questionId, isTyping } = data;
        const userInfo = this.connectedUsers.get(socket.id);
        
        if (userInfo) {
          socket.to(`question_${questionId}`).emit('user_typing', {
            questionId,
            userId: userInfo.userId,
            userName: userInfo.userName,
            isTyping,
          });
          
          console.log(`⌨️ Typing event: ${userInfo.userName} is ${isTyping ? 'typing' : 'stopped'}`);
        }
      });

      // ==================== EXPERT ACCEPTS QUESTION ====================
      socket.on('accept_question', async (data: { questionId: string }) => {
        try {
          console.log(`📨 Expert accepting question: ${data.questionId}`);
          
          const { questionId } = data;
          const expertInfo = this.connectedUsers.get(socket.id);
          
          if (!expertInfo) {
            console.log('❌ Expert not authenticated');
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const question = await Question.findById(questionId)
            .populate('userId', 'name email avatar');
          
          if (!question) {
            console.log('❌ Question not found');
            socket.emit('error', { message: 'Question not found' });
            return;
          }

          if (question.status !== 'open') {
            console.log('❌ Question not open:', question.status);
            socket.emit('error', { message: 'Question already assigned or resolved' });
            return;
          }

          // Assign expert
          question.assignedExpert = expertInfo.userId as any;
          question.status = 'assigned';
          
          // Update notification
          const notification = question.expertNotifications.find(
            (n: any) => n.expertId.toString() === expertInfo.userId
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
            expertName: expertInfo.userName || 'Expert',
          });

          // Notify the user
          const userSocketId = this.getUserSocketId(question.userId.toString());
          if (userSocketId) {
            this.io.to(userSocketId).emit('question_accepted', {
              questionId,
              expertId: expertInfo.userId,
              expertName: expertInfo.userName || 'Expert',
              message: `An expert has accepted your question!`,
            });
          }

          // Notify other experts that question is taken
          this.io.to('expert_room').emit('question_closed', { 
            questionId,
            acceptedBy: expertInfo.userId 
          });

          console.log(`✅ Question ${questionId} accepted by expert ${expertInfo.userName}`);

        } catch (error) {
          console.error('❌ Error accepting question:', error);
          socket.emit('error', { message: 'Failed to accept question' });
        }
      });

      // ==================== EXPERT REJECTS QUESTION ====================
      socket.on('reject_question', async (data: { questionId: string }) => {
        try {
          console.log(`📨 Expert rejecting question: ${data.questionId}`);
          
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
            (n: any) => n.expertId.toString() === expertInfo.userId
          );
          if (notification) {
            notification.respondedAt = new Date();
            notification.response = 'rejected';
          }
          await question.save();

          // Check if we need to find more experts
          const pendingNotifications = question.expertNotifications.filter(
            (n: any) => n.response === undefined
          );

          if (pendingNotifications.length === 0 && question.status === 'open') {
            const matches = await MatchingEngine.findMatches(questionId, 3);
            for (const match of matches.matches) {
              this.notifyExpert(questionId, match.expertId);
            }
          }

        } catch (error) {
          console.error('❌ Error rejecting question:', error);
          socket.emit('error', { message: 'Failed to reject question' });
        }
      });

      // ==================== UPDATE AVAILABILITY ====================
      socket.on('update_availability', async (data: { 
        status: 'available' | 'busy' | 'offline' 
      }) => {
        try {
          const userInfo = this.connectedUsers.get(socket.id);
          if (!userInfo) return;

          console.log(`🔄 Updating availability for ${userInfo.userName}: ${data.status}`);

          await ExpertProfile.findOneAndUpdate(
            { userId: userInfo.userId },
            { 
              'availability.status': data.status,
              'availability.lastActiveAt': new Date(),
            }
          );

          if (data.status === 'available') {
            socket.join('expert_room');
          } else {
            socket.leave('expert_room');
          }

          this.io.emit('expert_status_change', {
            expertId: userInfo.userId,
            status: data.status,
            userName: userInfo.userName,
          });

        } catch (error) {
          console.error('❌ Error updating availability:', error);
        }
      });

      // ==================== DISCONNECT ====================
      socket.on('disconnect', async () => {
        const userInfo = this.connectedUsers.get(socket.id);
        if (userInfo) {
          console.log(`🔴 User ${userInfo.userName} disconnected`);

          if (userInfo.role === 'expert') {
            await ExpertProfile.findOneAndUpdate(
              { userId: userInfo.userId },
              { 'availability.status': 'offline' }
            );
            
            this.io.emit('expert_offline', {
              expertId: userInfo.userId,
              userName: userInfo.userName,
            });
          }

          this.connectedUsers.delete(socket.id);
          
          const activeQuestionId = this.expertSessions.get(userInfo.userId);
          if (activeQuestionId) {
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

  // ==================== HELPER METHODS ====================
  
  private getUserSocketId(userId: string): string | undefined {
    for (const [socketId, user] of this.connectedUsers) {
      if (user.userId === userId) {
        return socketId;
      }
    }
    return undefined;
  }

  private notifyExpert(questionId: string, expertId: string) {
    const socketId = this.getUserSocketId(expertId);
    if (socketId) {
      this.io.to(socketId).emit('new_question_notification', {
        questionId,
        urgency: 'medium',
        timestamp: new Date(),
      });
      console.log(`📨 Notified expert ${expertId} about question ${questionId}`);
    }
  }

  public notifyExperts(questionId: string, expertIds: string[]) {
    for (const expertId of expertIds) {
      this.notifyExpert(questionId, expertId);
    }
  }

  public getIO() {
    return this.io;
  }
}

export function setupSocketServer(server: HTTPServer) {
  console.log('🔧 Setting up Socket.IO server...');
  const manager = new SocketManager(server);
  console.log('✅ Socket.IO server setup complete');
  return manager;
}