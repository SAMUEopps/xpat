// models/Question.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  tags: string[];
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  assignedExpert?: mongoose.Types.ObjectId;
  matchedExperts: mongoose.Types.ObjectId[];
  expertNotifications: {
    expertId: mongoose.Types.ObjectId;
    sentAt: Date;
    viewedAt?: Date;
    respondedAt?: Date;
    response?: 'accepted' | 'rejected' | 'timeout';
  }[];
  messages: {
    senderId: mongoose.Types.ObjectId;
    content: string;
    timestamp: Date;
    type: 'text' | 'file';
    fileUrl?: string;
    delivered: boolean;
    read: boolean;
    readAt?: Date;
  }[];
  timeToResolution?: number; // In seconds
  userRating?: number;
  expertRating?: number;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  tags: { type: [String], required: true },
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['open', 'assigned', 'in_progress', 'resolved', 'cancelled'], 
    default: 'open' 
  },
  assignedExpert: { type: Schema.Types.ObjectId, ref: 'User' },
  matchedExperts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  expertNotifications: [{
    expertId: { type: Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now },
    viewedAt: Date,
    respondedAt: Date,
    response: { type: String, enum: ['accepted', 'rejected', 'timeout'] }
  }],
  messages: [{
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['text', 'file'], default: 'text' },
    fileUrl: { type: String },
    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    readAt: Date
  }],
  timeToResolution: { type: Number },
  userRating: { type: Number, min: 1, max: 5 },
  expertRating: { type: Number, min: 1, max: 5 },
  resolvedAt: { type: Date },
}, { timestamps: true });

// Indexes for performance
QuestionSchema.index({ status: 1, urgency: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ matchedExperts: 1 });
QuestionSchema.index({ 'expertNotifications.expertId': 1 });
QuestionSchema.index({ 'messages.timestamp': 1 });

export const Question = mongoose.models.Question || 
  mongoose.model<IQuestion>('Question', QuestionSchema);