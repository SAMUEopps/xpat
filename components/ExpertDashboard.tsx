// components/ExpertDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRealTime } from '@/hooks/useRealTime';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { QuestionCard } from './chat/QuestionCard';

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
    avatar?: string;
  };
  createdAt: string;
  expertNotifications?: any[];
}

export function ExpertDashboard() {
  const { user } = useAuth();
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<Question[]>([]);

  const {
    isConnected,
    isAuthenticated,
    acceptQuestion,
    rejectQuestion,
    updateAvailability,
  } = useRealTime({
    userId: user?.id,
    onQuestionAccepted: (data) => {
      toast.success('You accepted a question!');
      loadQuestions();
    },
    onStatusUpdate: (data) => {
      if (data.status === 'resolved' || data.status === 'cancelled') {
        loadQuestions();
      }
    },
  });

  useEffect(() => {
    if (user) {
      loadQuestions();
      loadExpertStatus();
    }
  }, [user]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      // Load available questions (open questions matched with this expert)
      const allQuestions = await api.getQuestions('all');
      
      // Filter questions
      const openQuestions = allQuestions.filter(
        (q: Question) => q.status === 'open' && 
        q.expertNotifications?.some((n: any) => n.expertId === user?.id && !n.response)
      );
      
      setAvailableQuestions(openQuestions);

      // Load assigned questions
      const assignedQuestions = allQuestions.filter(
        (q: Question) => q.assignedExpert?._id === user?.id && 
        q.status !== 'resolved' && q.status !== 'cancelled'
      );
      setMyQuestions(assignedQuestions);

    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpertStatus = async () => {
    try {
      const profile = await api.getExpertProfile();
      if (profile) {
        setIsOnline(profile.availability?.status === 'available');
      }
    } catch (error) {
      console.error('Failed to load expert status:', error);
    }
  };

  const handleAcceptQuestion = async (questionId: string) => {
    try {
      acceptQuestion({ questionId });
      toast.success('Question accepted! You can now chat with the user.');
      loadQuestions();
    } catch (error) {
      toast.error('Failed to accept question');
    }
  };

  const handleRejectQuestion = async (questionId: string) => {
    try {
      rejectQuestion({ questionId });
      toast('Question rejected');
      loadQuestions();
    } catch (error) {
      toast.error('Failed to reject question');
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = isOnline ? 'offline' : 'available';
      updateAvailability({ status: newStatus });
      setIsOnline(!isOnline);
      toast.success(`You are now ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (!user || (user.role !== 'expert' && user.role !== 'both')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You need to be an expert to access this dashboard.</p>
        <button className="btn-primary mt-4" onClick={() => window.location.href = '/setup/expert'}>
          Become an Expert
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isOnline ? 'Available' : 'Offline'}
            </span>
          </div>
        </div>
        <button
          onClick={toggleOnlineStatus}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isOnline
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Incoming Requests */}
      {availableQuestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 mr-2">
              {availableQuestions.length}
            </span>
            Incoming Requests
          </h3>
          <div className="space-y-3">
            {availableQuestions.map((question) => (
              <QuestionCard
                key={question._id}
                question={question}
                showAccept={true}
                onAccept={handleAcceptQuestion}
              />
            ))}
          </div>
        </div>
      )}

      {/* My Active Questions */}
      {myQuestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            My Active Questions
          </h3>
          <div className="space-y-3">
            {myQuestions.map((question) => (
              <QuestionCard
                key={question._id}
                question={question}
                showAccept={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && availableQuestions.length === 0 && myQuestions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🕊️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No questions right now
          </h3>
          <p className="text-gray-600 mb-4">
            {isOnline 
              ? "You're online and ready to help. Questions will appear here."
              : "Go online to start receiving questions."}
          </p>
          {!isOnline && (
            <button
              onClick={toggleOnlineStatus}
              className="btn-primary"
            >
              Go Online
            </button>
          )}
        </div>
      )}
    </div>
  );
}