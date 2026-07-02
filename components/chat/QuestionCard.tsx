'use client';

import Link from 'next/link';
import { Question } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface QuestionCardProps {
  question: Question;
  showAccept?: boolean;
  onAccept?: (id: string) => void;
}

export function QuestionCard({ question, showAccept, onAccept }: QuestionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(question.status)}`}>
              {question.status}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getUrgencyColor(question.urgency)}`}>
              {question.urgency}
            </span>
          </div>

          <Link href={`/ask/${question._id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
              {question.title}
            </h3>
          </Link>

          <p className="mt-1 text-gray-600 text-sm line-clamp-2">
            {question.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {question.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold mr-2">
                {question.userId.name[0].toUpperCase()}
              </div>
              <span>{question.userId.name}</span>
            </div>
            <span className="mx-2">•</span>
            <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
            {question.timeToResolution && (
              <>
                <span className="mx-2">•</span>
                <span className="text-green-600">
                  Resolved in {Math.round(question.timeToResolution / 60)}m
                </span>
              </>
            )}
          </div>
        </div>

        {showAccept && question.status === 'open' && (
          <button
            onClick={() => onAccept?.(question._id)}
            className="ml-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
          >
            Accept
          </button>
        )}
      </div>
    </div>
  );
}