// import mongoose, { Schema, Document } from 'mongoose';

// export interface IExpertProfile extends Document {
//   userId: mongoose.Types.ObjectId;
//   title: string;
//   bio: string;
//   primaryExpertise: string[];  // Limited to 2-3
//   secondarySkills: string[];   // Up to 10
//   yearsOfExperience: number;
//   hourlyRate?: number;
//   availability: {
//     status: 'available' | 'busy' | 'offline';
//     maxQuestionsPerDay: number;
//     currentQuestionsToday: number;
//   };
//   rating: number;
//   totalSessions: number;
//   responseTime: number; // Average in seconds
//   badges: string[];
//   isActive: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const ExpertProfileSchema = new Schema<IExpertProfile>({
//   userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   title: { type: String, required: true },
//   bio: { type: String, required: true },
//   primaryExpertise: { 
//     type: [String], 
//     required: true, 
//     validate: [(array: string | any[]) => array.length <= 3, 'Maximum 3 primary expertise allowed'] 
//   },
//   secondarySkills: { 
//     type: [String], 
//     validate: [(array: string | any[]) => array.length <= 10, 'Maximum 10 secondary skills allowed'] 
//   },
//   yearsOfExperience: { type: Number, default: 0 },
//   hourlyRate: { type: Number },
//   availability: {
//     status: { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' },
//     maxQuestionsPerDay: { type: Number, default: 5 },
//     currentQuestionsToday: { type: Number, default: 0 },
//   },
//   rating: { type: Number, default: 0 },
//   totalSessions: { type: Number, default: 0 },
//   responseTime: { type: Number, default: 0 },
//   badges: { type: [String], default: [] },
//   isActive: { type: Boolean, default: true },
// }, { timestamps: true });

// export const ExpertProfile = mongoose.models.ExpertProfile || 
//   mongoose.model<IExpertProfile>('ExpertProfile', ExpertProfileSchema);

// models/ExpertProfile.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IExpertProfile extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  bio: string;
  primaryExpertise: string[];  // Limited to 2-3
  secondarySkills: string[];   // Up to 10
  yearsOfExperience: number;
  hourlyRate?: number;
  availability: {
    status: 'available' | 'busy' | 'offline';
    maxQuestionsPerDay: number;
    currentQuestionsToday: number;
    lastActiveAt: Date;
  };
  rating: number;
  totalSessions: number;
  responseTime: number; // Average in seconds
  badges: string[];
  isActive: boolean;
  // Track expertise performance
  expertiseStats: {
    tag: string;
    questionsSolved: number;
    averageRating: number;
    averageResponseTime: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ExpertProfileSchema = new Schema<IExpertProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  bio: { type: String, required: true },
  primaryExpertise: { 
    type: [String], 
    required: true, 
    validate: [(array: string | any[]) => array.length <= 3, 'Maximum 3 primary expertise allowed'] 
  },
  secondarySkills: { 
    type: [String], 
    validate: [(array: string | any[]) => array.length <= 10, 'Maximum 10 secondary skills allowed'] 
  },
  yearsOfExperience: { type: Number, default: 0 },
  hourlyRate: { type: Number },
  availability: {
    status: { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' },
    maxQuestionsPerDay: { type: Number, default: 5 },
    currentQuestionsToday: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now }
  },
  rating: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  responseTime: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  expertiseStats: [{
    tag: String,
    questionsSolved: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }
  }]
}, { timestamps: true });

// Indexes for matching performance
ExpertProfileSchema.index({ 'availability.status': 1, 'availability.currentQuestionsToday': 1 });
ExpertProfileSchema.index({ primaryExpertise: 1 });
ExpertProfileSchema.index({ rating: -1 });

export const ExpertProfile = mongoose.models.ExpertProfile || 
  mongoose.model<IExpertProfile>('ExpertProfile', ExpertProfileSchema);