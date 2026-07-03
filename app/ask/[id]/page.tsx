
// app/ask/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useRealTime } from '@/hooks/useRealTime';
import toast from 'react-hot-toast';

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [question, setQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  // Real-time updates
  const { 
    isConnected, 
    isAuthenticated,
    acceptQuestion,
    socket,
  } = useRealTime({
    userId: user?.id,
    questionId: params.id as string,
    
    onNewMessage: (message) => {
      console.log('💬 New message received in page:', message);
      setQuestion((prev: any) => {
        if (!prev) return prev;
        // Avoid duplicates
        if (message._id && prev.messages?.some((m: any) => m._id === message._id)) {
          return prev;
        }
        return {
          ...prev,
          messages: [...(prev.messages || []), message]
        };
      });
    },
    
    onStatusUpdate: (data) => {
      console.log('📊 Status update in page:', data);
      setQuestion((prev: any) => ({
        ...prev,
        status: data.status
      }));
      //toast.info(`Question status updated to: ${data.status}`);
    },
    
    onExpertAssigned: (data) => {
      console.log('👨‍💼 Expert assigned in page:', data);
      setQuestion((prev: any) => ({
        ...prev,
        assignedExpert: { _id: data.expertId, name: data.expertName },
        status: 'assigned'
      }));
      toast.success(`Expert ${data.expertName} has joined the conversation!`);
    },
    
    onQuestionAccepted: (data) => {
      console.log('✅ Question accepted in page:', data);
      setQuestion((prev: any) => ({
        ...prev,
        assignedExpert: { _id: data.expertId, name: data.expertName },
        status: 'assigned'
      }));
      toast.success(`Expert ${data.expertName} accepted your question!`);
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadQuestion();
  }, [user, params.id]);

  // ✅ Join the room when authenticated and question is loaded
  useEffect(() => {
    if (!isAuthenticated || !question || !socket || hasJoinedRoom) {
      console.log('⏳ Waiting to join room:', {
        isAuthenticated,
        hasQuestion: !!question,
        hasSocket: !!socket,
        hasJoinedRoom,
      });
      return;
    }

    console.log('📝 Joining question room:', question._id);
    socket.emit('join_question', { questionId: question._id });
    setHasJoinedRoom(true);
    
    // Listen for chat history
    socket.on('chat_history', (data) => {
      console.log('📚 Chat history received:', data);
      if (data.questionId === question._id) {
        setQuestion((prev: any) => ({
          ...prev,
          messages: data.messages || [],
        }));
      }
    });

    return () => {
      socket.off('chat_history');
    };
  }, [isAuthenticated, question, socket, hasJoinedRoom]);

  const loadQuestion = async () => {
    setIsLoading(true);
    try {
      const data = await api.getQuestion(params.id as string);
      console.log('📄 Question loaded:', data);
      setQuestion(data);
    } catch (error) {
      console.error('Failed to load question:', error);
      toast.error('Failed to load question');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptQuestion = async () => {
    if (!user || !question) return;
    
    setIsAccepting(true);
    try {
      // Accept via socket
      acceptQuestion({ questionId: question._id });
      
      // Also call API for persistence
      await api.acceptQuestion(question._id);
      
      // Update local state
      setQuestion((prev: any) => ({
        ...prev,
        assignedExpert: { 
          _id: user.id, 
          name: user.name,
          email: user.email 
        },
        status: 'assigned'
      }));
      
      toast.success('Question accepted! You can now chat.');
      
      // Join the room after accepting
      if (socket) {
        socket.emit('join_question', { questionId: question._id });
        setHasJoinedRoom(true);
      }
    } catch (error) {
      console.error('Failed to accept question:', error);
      toast.error('Failed to accept question');
    } finally {
      setIsAccepting(false);
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

  // Check if user is the owner
  const isOwner = question.userId?._id === user?.id;
  
  // Check if user is the assigned expert
  const isAssignedExpert = question.assignedExpert?._id === user?.id;
  
  // Check if user is a matched expert (can accept)
  const isMatchedExpert = question.matchedExperts?.some(
    (expert: any) => expert._id === user?.id
  );
  
  // Check if user is an expert (either role)
  const isExpert = user?.role === 'expert' || user?.role === 'both';
  
  // Determine if user can access chat
  const canChat = isOwner || isAssignedExpert;
  
  // Determine if user can accept the question
  const canAccept = isExpert && 
    question.status === 'open' && 
    (isMatchedExpert || isExpert);

  console.log('🔍 Page state:', {
    isOwner,
    isAssignedExpert,
    isMatchedExpert,
    isExpert,
    canChat,
    canAccept,
    questionStatus: question.status,
    hasJoinedRoom,
    isAuthenticated,
  });

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
                {isConnected ? (
                  <span className="text-xs text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    Live
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Offline</span>
                )}
                {hasJoinedRoom && (
                  <span className="text-xs text-blue-600 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                    In Room
                  </span>
                )}
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
              <span>Asked by {question.userId?.name || 'Unknown'}</span>
              {question.assignedExpert && (
                <>
                  <span className="mx-2">•</span>
                  <span>Assigned to {question.assignedExpert.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Accept Button (for experts) */}
          {canAccept && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-800">
                    You can accept this question and start helping!
                  </p>
                  {question.matchedSkills && (
                    <p className="text-xs text-blue-600 mt-1">
                      Matched skills: {question.matchedSkills.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleAcceptQuestion}
                  disabled={isAccepting}
                  className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAccepting ? (
                    <span className="flex items-center">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Accepting...
                    </span>
                  ) : (
                    'Accept Question'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Chat or Access Denied */}
          {canChat ? (
            <div className="h-[500px]">
              <ChatWindow
                questionId={question._id}
                expertId={question.assignedExpert?._id}
                userId={question.userId?._id}
                initialMessages={question.messages || []}
                onStatusUpdate={handleStatusUpdate}
              />
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You don't have access to this conversation
              </h3>
              {question.status === 'open' && (
                <div>
                  <p className="text-gray-600 mb-2">
                    This question is still open and waiting for an expert.
                  </p>
                  {isExpert && !isMatchedExpert && (
                    <p className="text-sm text-blue-600">
                      You are an expert but haven't been matched with this question yet.
                    </p>
                  )}
                  {!isExpert && (
                    <p className="text-sm text-gray-500">
                      Become an expert to help answer questions!
                    </p>
                  )}
                </div>
              )}
              {question.status === 'assigned' && (
                <p className="text-gray-600">
                  This question has been assigned to an expert. 
                  {!isOwner && ' Only the owner and assigned expert can access the chat.'}
                </p>
              )}
              {question.status === 'in_progress' && (
                <p className="text-gray-600">
                  This question is being worked on by an expert.
                </p>
              )}
              {question.status === 'resolved' && (
                <p className="text-gray-600">
                  This question has been resolved.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {(isOwner || isAssignedExpert) && 
         question.status !== 'resolved' && 
         question.status !== 'cancelled' && (
          <div className="mt-6 flex justify-end space-x-3">
            {isOwner && (
              <button
                onClick={async () => {
                  if (confirm('Mark this question as resolved?')) {
                    try {
                      await api.updateQuestion(question._id, { status: 'resolved' });
                      toast.success('Question marked as resolved');
                      router.push('/');
                    } catch (error) {
                      toast.error('Failed to mark as resolved');
                    }
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
                    try {
                      await api.updateQuestion(question._id, { status: 'cancelled' });
                      toast.success('Question cancelled');
                      router.push('/');
                    } catch (error) {
                      toast.error('Failed to cancel question');
                    }
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