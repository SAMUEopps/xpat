// app/questions/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { ChatWindow } from '@/components/chat/ChatWindow';
import toast from 'react-hot-toast';

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [question, setQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadQuestion();
  }, [user, params.id]);

  const loadQuestion = async () => {
    setIsLoading(true);
    try {
      const data = await api.getQuestion(params.id as string);
      setQuestion(data);
    } catch (error) {
      toast.error('Failed to load question');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = (status: string) => {
    setQuestion((prev: any) => ({ ...prev, status }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Question not found</p>
      </div>
    );
  }

  const isExpert = question.assignedExpert?._id === user?.id;
  const isOwner = question.userId._id === user?.id;
  const canChat = isExpert || isOwner;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Question Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  question.status === 'open' ? 'bg-green-100 text-green-800' :
                  question.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                  question.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  question.status === 'resolved' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {question.status}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  question.urgency === 'high' ? 'bg-red-100 text-red-800' :
                  question.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {question.urgency}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(question.createdAt).toLocaleDateString()}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{question.title}</h1>
            <p className="text-gray-700">{question.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {question.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span>Asked by {question.userId.name}</span>
              {question.assignedExpert && (
                <>
                  <span className="mx-2">•</span>
                  <span>Assigned to {question.assignedExpert.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Chat */}
          {canChat ? (
            <div className="h-[500px]">
              <ChatWindow
                questionId={question._id}
                expertId={question.assignedExpert?._id}
                userId={question.userId._id}
                initialMessages={question.messages || []}
                onStatusUpdate={handleStatusUpdate}
              />
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>You don't have access to this conversation.</p>
              {question.status === 'open' && (
                <p className="mt-2 text-sm">Wait for an expert to accept your question.</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {(isOwner || isExpert) && question.status !== 'resolved' && question.status !== 'cancelled' && (
          <div className="mt-6 flex justify-end space-x-3">
            {isOwner && (
              <button
                onClick={async () => {
                  if (confirm('Mark this question as resolved?')) {
                    await api.updateQuestion(question._id, { status: 'resolved' });
                    toast.success('Question marked as resolved');
                    router.push('/');
                  }
                }}
                className="btn-primary"
              >
                Mark as Resolved
              </button>
            )}
            {isOwner && (
              <button
                onClick={async () => {
                  if (confirm('Cancel this question?')) {
                    await api.updateQuestion(question._id, { status: 'cancelled' });
                    toast.success('Question cancelled');
                    router.push('/');
                  }
                }}
                className="btn-secondary text-red-600"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}