'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Question } from '@/types';
import { QuestionCard } from '@/components/chat/QuestionCard';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    loadQuestions();
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
                onAccept={async (id) => {
                  await api.acceptQuestion(id);
                  await loadQuestions();
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}