// models/Conversation.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  questionId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    timestamp: Date;
  };
  unreadCount: Map<string, number>;
  status: 'active' | 'resolved' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  questionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Question', 
    required: true,
    unique: true 
  },
  participants: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }],
  lastMessage: {
    content: { type: String },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

// Indexes
ConversationSchema.index({ questionId: 1 });
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ status: 1 });

export const Conversation = mongoose.models.Conversation || 
  mongoose.model<IConversation>('Conversation', ConversationSchema);