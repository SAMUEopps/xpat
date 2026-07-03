// models/Message.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  delivered: boolean;
  deliveredAt?: Date;
  read: boolean;
  readAt?: Date;
  deleted: boolean;
  deletedAt?: Date;
  replyTo?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true 
  },
  questionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Question', 
    required: true 
  },
  senderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  delivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ questionId: 1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ read: 1 });

export const Message = mongoose.models.Message || 
  mongoose.model<IMessage>('Message', MessageSchema);