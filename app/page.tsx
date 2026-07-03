

// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Question } from '@/types';
import { QuestionCard } from '@/components/chat/QuestionCard';
import { ExpertDashboard } from '@/components/ExpertDashboard';
import { useRealTime } from '@/hooks/useRealTime';
import toast from 'react-hot-toast';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'user' | 'expert'>(
    user?.role === 'expert' || user?.role === 'both' ? 'expert' : 'user'
  );

  // Determine if user is an expert
  const isExpert = user?.role === 'expert' || user?.role === 'both';
  const isBoth = user?.role === 'both';

  // Real-time updates for user questions
  const { isConnected } = useRealTime({
    userId: user?.id,
    onNewMessage: () => {
      // Refresh questions when new message arrives
      loadQuestions();
    },
    onStatusUpdate: () => {
      loadQuestions();
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    // Load questions based on role
    if (user && !isExpert) {
      loadQuestions();
    }
  }, [user, loading, filter]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getQuestions(filter);
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptQuestion = async (id: string) => {
    try {
      await api.acceptQuestion(id);
      toast.success('Question accepted!');
      await loadQuestions();
    } catch (error) {
      toast.error('Failed to accept question');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                ExpertLoop
              </Link>
              <span className="ml-2 text-xs text-green-600 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/ask')}
                className="btn-primary"
              >
                Ask Question
              </button>
              
              <Link href="/profile" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Tabs for Both Role */}
        {isBoth && (
          <div className="flex space-x-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('expert')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'expert'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎯 Expert Dashboard
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'user'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 My Questions
            </button>
          </div>
        )}

        {/* Expert Dashboard View */}
        {(isExpert && (activeTab === 'expert' || !isBoth)) && (
          <div className="animate-fadeIn">
            <ExpertDashboard />
          </div>
        )}

        {/* User Questions View */}
        {(!isExpert || (isBoth && activeTab === 'user')) && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['all', 'open', 'assigned', 'in_progress', 'resolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Questions List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No questions yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to ask a question or wait for others
                </p>
                <button
                  onClick={() => router.push('/ask')}
                  className="btn-primary"
                >
                  Ask a Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard
                    key={question._id}
                    question={question}
                    showAccept={user.role === 'expert' || user.role === 'both'}
                    onAccept={handleAcceptQuestion}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}