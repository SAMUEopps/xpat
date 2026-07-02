export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'expert' | 'both';
  isVerified: boolean;
  avatar?: string;
  createdAt: string;
}

export interface Question {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  userId: User;
  assignedExpert?: User;
  messages: Message[];
  timeToResolution?: number;
  userRating?: number;
  expertRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'file';
  fileUrl?: string;
}

export interface ExpertProfile {
  _id: string;
  userId: User;
  title: string;
  bio: string;
  primaryExpertise: string[];
  secondarySkills: string[];
  yearsOfExperience: number;
  hourlyRate?: number;
  availability: {
    status: 'available' | 'busy' | 'offline';
    maxQuestionsPerDay: number;
    currentQuestionsToday: number;
  };
  rating: number;
  totalSessions: number;
  responseTime: number;
  badges: string[];
  isActive: boolean;
}