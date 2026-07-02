'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const COMMON_TAGS = [
  'flutter', 'react', 'nodejs', 'javascript', 'typescript',
  'python', 'java', 'mongodb', 'postgresql', 'aws',
  'docker', 'kubernetes', 'nextjs', 'nestjs', 'express',
  'mpesa', 'payment', 'api', 'frontend', 'backend',
  'mobile', 'web', 'devops', 'security', 'database'
];

const CATEGORIES = [
  'Software Development',
  'Web Development',
  'Mobile Development',
  'DevOps',
  'Database',
  'Cloud Computing',
  'UI/UX Design',
  'Machine Learning',
  'Cybersecurity',
  'Career Advice',
  'Business',
  'Other'
];

export default function AskQuestionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
    urgency: 'medium' as 'low' | 'medium' | 'high',
  });
  const [tagInput, setTagInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (formData.tags.length < 5 && !formData.tags.includes(tag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tag],
        });
        setTagInput('');
      } else if (formData.tags.length >= 5) {
        toast.error('Maximum 5 tags allowed');
      } else {
        toast.error('Tag already added');
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.tags.length === 0) {
      toast.error('Please add at least one tag');
      return;
    }

    setIsLoading(true);
    try {
      await api.createQuestion(formData);
      toast.success('Question posted successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post question');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Ask a Question
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="What's your question? Be specific"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Be clear and descriptive (e.g., "How to integrate M-Pesa in Flutter?")
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="Describe your problem in detail..."
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field mt-1"
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
                Urgency
              </label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="input-field mt-1"
              >
                <option value="low">Low - Not urgent</option>
                <option value="medium">Medium - Within a few hours</option>
                <option value="high">High - Need help now</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="input-field"
                  placeholder="Type and press Enter (e.g., flutter, mpesa)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Add up to 5 tags. Press Enter to add.
                </p>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested tags */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Suggested tags:</p>
                <div className="flex flex-wrap gap-1">
                  {COMMON_TAGS.slice(0, 12).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!formData.tags.includes(tag) && formData.tags.length < 5) {
                          setFormData({
                            ...formData,
                            tags: [...formData.tags, tag],
                          });
                        }
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      disabled={formData.tags.includes(tag) || formData.tags.length >= 5}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Posting...
                  </span>
                ) : (
                  'Post Question'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}