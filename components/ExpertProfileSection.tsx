'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ExpertProfile {
  _id?: string;
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

interface ExpertProfileSectionProps {
  profile: ExpertProfile | null;
  onUpdate: () => void;
  userId?: string;
}

export function ExpertProfileSection({ profile, onUpdate, userId }: ExpertProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(!profile);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ExpertProfile>>(
    profile || {
      title: '',
      bio: '',
      primaryExpertise: [],
      secondarySkills: [],
      yearsOfExperience: 0,
      hourlyRate: 0,
      availability: {
        status: 'offline',
        maxQuestionsPerDay: 5,
        currentQuestionsToday: 0,
      },
      isActive: true,
    }
  );
  const [skillInput, setSkillInput] = useState('');
  const [secondaryInput, setSecondaryInput] = useState('');

  const COMMON_SKILLS = [
    'Flutter', 'React', 'Node.js', 'JavaScript', 'TypeScript',
    'Python', 'Java', 'MongoDB', 'PostgreSQL', 'AWS',
    'Docker', 'Kubernetes', 'Next.js', 'NestJS', 'Express',
    'M-Pesa', 'Payment Integration', 'API Design', 'Frontend', 'Backend',
    'Mobile Development', 'Web Development', 'DevOps', 'Security', 'Database Design',
    'UI/UX', 'Machine Learning', 'Data Science', 'Cloud Architecture'
  ];

  const handleAddPrimarySkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim();
      if (formData.primaryExpertise!.length < 3 && !formData.primaryExpertise!.includes(skill)) {
        setFormData({
          ...formData,
          primaryExpertise: [...formData.primaryExpertise!, skill],
        });
        setSkillInput('');
      } else if (formData.primaryExpertise!.length >= 3) {
        toast.error('Maximum 3 primary expertise allowed');
      } else {
        toast.error('Skill already added');
      }
    }
  };

  const handleAddSecondarySkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && secondaryInput.trim()) {
      e.preventDefault();
      const skill = secondaryInput.trim();
      if (formData.secondarySkills!.length < 10 && !formData.secondarySkills!.includes(skill)) {
        setFormData({
          ...formData,
          secondarySkills: [...formData.secondarySkills!, skill],
        });
        setSecondaryInput('');
      } else if (formData.secondarySkills!.length >= 10) {
        toast.error('Maximum 10 secondary skills allowed');
      } else {
        toast.error('Skill already added');
      }
    }
  };

  const handleRemovePrimarySkill = (skill: string) => {
    setFormData({
      ...formData,
      primaryExpertise: formData.primaryExpertise!.filter((s) => s !== skill),
    });
  };

  const handleRemoveSecondarySkill = (skill: string) => {
    setFormData({
      ...formData,
      secondarySkills: formData.secondarySkills!.filter((s) => s !== skill),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.primaryExpertise!.length === 0) {
      toast.error('Please add at least one primary expertise');
      return;
    }

    setIsLoading(true);
    try {
      await api.updateExpertProfile(formData);
      toast.success('Expert profile saved successfully!');
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save expert profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing && profile) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Expert Profile</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit Expert Profile
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Title</h4>
            <p className="mt-1 text-gray-900">{profile.title || 'Not set'}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Bio</h4>
            <p className="mt-1 text-gray-700">{profile.bio || 'No bio yet'}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Primary Expertise</h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {profile.primaryExpertise.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
              {profile.primaryExpertise.length === 0 && (
                <span className="text-gray-500 text-sm">No primary expertise set</span>
              )}
            </div>
          </div>

          {profile.secondarySkills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Secondary Skills</h4>
              <div className="mt-1 flex flex-wrap gap-2">
                {profile.secondarySkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Experience</h4>
              <p className="mt-1 text-gray-900">{profile.yearsOfExperience} years</p>
            </div>
            {profile.hourlyRate && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Hourly Rate</h4>
                <p className="mt-1 text-gray-900">${profile.hourlyRate}/hr</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Availability</h4>
            <div className="mt-1 flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                profile.availability.status === 'available'
                  ? 'bg-green-100 text-green-800'
                  : profile.availability.status === 'busy'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {profile.availability.status}
              </span>
              <span className="text-sm text-gray-500">
                ({profile.availability.currentQuestionsToday}/{profile.availability.maxQuestionsPerDay} questions today)
              </span>
            </div>
          </div>

          {profile.badges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Badges</h4>
              <div className="mt-1 flex flex-wrap gap-2">
                {profile.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    🏅 {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit form
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {profile ? 'Edit Expert Profile' : 'Set Up Expert Profile'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Complete your profile to start helping others
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Professional Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input-field mt-1"
            placeholder="e.g., Senior Flutter Developer"
            required
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="input-field mt-1"
            rows={3}
            placeholder="Tell others about your expertise and experience..."
            required
          />
        </div>

        {/* Primary Expertise */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Primary Expertise <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">(Max 3)</span>
          </label>
          <div className="mt-1">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddPrimarySkill}
              className="input-field"
              placeholder="Type and press Enter to add"
              disabled={formData.primaryExpertise!.length >= 3}
            />
          </div>
          
          {formData.primaryExpertise!.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.primaryExpertise!.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemovePrimarySkill(skill)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Suggested primary skills */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Suggested primary skills:</p>
            <div className="flex flex-wrap gap-1">
              {COMMON_SKILLS.slice(0, 8).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    if (!formData.primaryExpertise!.includes(skill) && formData.primaryExpertise!.length < 3) {
                      setFormData({
                        ...formData,
                        primaryExpertise: [...formData.primaryExpertise!, skill],
                      });
                    }
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  disabled={formData.primaryExpertise!.includes(skill) || formData.primaryExpertise!.length >= 3}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Secondary Skills
            <span className="text-xs text-gray-500 ml-2">(Max 10)</span>
          </label>
          <div className="mt-1">
            <input
              type="text"
              value={secondaryInput}
              onChange={(e) => setSecondaryInput(e.target.value)}
              onKeyDown={handleAddSecondarySkill}
              className="input-field"
              placeholder="Type and press Enter to add"
              disabled={formData.secondarySkills!.length >= 10}
            />
          </div>
          
          {formData.secondarySkills!.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.secondarySkills!.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSecondarySkill(skill)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Experience & Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Years of Experience
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={formData.yearsOfExperience}
              onChange={(e) => setFormData({ 
                ...formData, 
                yearsOfExperience: parseInt(e.target.value) || 0 
              })}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hourly Rate (USD)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={formData.hourlyRate || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                hourlyRate: parseFloat(e.target.value) || 0 
              })}
              className="input-field mt-1"
              placeholder="e.g., 50"
            />
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Availability Status
          </label>
          <select
            value={formData.availability?.status || 'offline'}
            onChange={(e) => setFormData({
              ...formData,
              availability: {
                ...formData.availability!,
                status: e.target.value as 'available' | 'busy' | 'offline',
              },
            })}
            className="input-field mt-1"
          >
            <option value="available">🟢 Available - Ready to help</option>
            <option value="busy">🟡 Busy - Only urgent questions</option>
            <option value="offline">🔴 Offline - Not accepting questions</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Max Questions Per Day
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={formData.availability?.maxQuestionsPerDay || 5}
            onChange={(e) => setFormData({
              ...formData,
              availability: {
                ...formData.availability!,
                maxQuestionsPerDay: parseInt(e.target.value) || 5,
              },
            })}
            className="input-field mt-1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Limit how many questions you want to handle daily
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({
              ...formData,
              isActive: e.target.checked,
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Active (show in expert search)
          </label>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Expert Profile'}
          </button>
          {profile && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}