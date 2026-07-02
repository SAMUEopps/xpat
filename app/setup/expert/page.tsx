'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ExpertSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    primaryExpertise: [] as string[],
    secondarySkills: [] as string[],
    yearsOfExperience: 0,
    hourlyRate: 0,
    availability: {
      status: 'available' as 'available' | 'busy' | 'offline',
      maxQuestionsPerDay: 5,
      currentQuestionsToday: 0,
    },
    isActive: true,
  });
  const [skillInput, setSkillInput] = useState('');
  const [secondaryInput, setSecondaryInput] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // If user is already expert, redirect to profile
    if (user.role === 'expert' || user.role === 'both') {
      router.push('/profile');
    }
  }, [user]);

  const handleAddPrimarySkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim();
      if (formData.primaryExpertise.length < 3 && !formData.primaryExpertise.includes(skill)) {
        setFormData({
          ...formData,
          primaryExpertise: [...formData.primaryExpertise, skill],
        });
        setSkillInput('');
      }
    }
  };

  const handleRemovePrimarySkill = (skill: string) => {
    setFormData({
      ...formData,
      primaryExpertise: formData.primaryExpertise.filter((s) => s !== skill),
    });
  };

  const handleAddSecondarySkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && secondaryInput.trim()) {
      e.preventDefault();
      const skill = secondaryInput.trim();
      if (formData.secondarySkills.length < 10 && !formData.secondarySkills.includes(skill)) {
        setFormData({
          ...formData,
          secondarySkills: [...formData.secondarySkills, skill],
        });
        setSecondaryInput('');
      }
    }
  };

  const handleRemoveSecondarySkill = (skill: string) => {
    setFormData({
      ...formData,
      secondarySkills: formData.secondarySkills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = async () => {
    if (formData.primaryExpertise.length === 0) {
      toast.error('Please add at least one primary expertise');
      return;
    }

    if (!formData.title || !formData.bio) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.updateExpertProfile(formData);
      toast.success('Expert profile created successfully!');
      router.push('/profile');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create expert profile');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to ExpertLoop!</h2>
              <p className="mt-2 text-gray-600">
                You're about to become an expert. Let's set up your profile so others can find you.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <p className="font-medium text-gray-900">Define your expertise</p>
                  <p className="text-sm text-gray-500">Tell others what you're best at</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <p className="font-medium text-gray-900">Set your availability</p>
                  <p className="text-sm text-gray-500">When can you help others?</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <p className="font-medium text-gray-900">Start helping</p>
                  <p className="text-sm text-gray-500">Get questions and start earning</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full btn-primary"
            >
              Continue
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Tell us about yourself</h2>
            <p className="text-sm text-gray-500">This helps us match you with the right questions</p>

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
                  disabled={formData.primaryExpertise.length >= 3}
                />
              </div>
              
              {formData.primaryExpertise.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.primaryExpertise.map((skill) => (
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Secondary Skills
                <span className="text-xs text-gray-500 ml-2">(Optional, Max 10)</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={secondaryInput}
                  onChange={(e) => setSecondaryInput(e.target.value)}
                  onKeyDown={handleAddSecondarySkill}
                  className="input-field"
                  placeholder="Type and press Enter to add"
                  disabled={formData.secondarySkills.length >= 10}
                />
              </div>
              
              {formData.secondarySkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.secondarySkills.map((skill) => (
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

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 btn-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 btn-primary"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Availability Settings</h2>
            <p className="text-sm text-gray-500">Set your availability to start receiving questions</p>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Availability Status
              </label>
              <select
                value={formData.availability.status}
                onChange={(e) => setFormData({
                  ...formData,
                  availability: {
                    ...formData.availability,
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
                value={formData.availability.maxQuestionsPerDay}
                onChange={(e) => setFormData({
                  ...formData,
                  availability: {
                    ...formData.availability,
                    maxQuestionsPerDay: parseInt(e.target.value) || 5,
                  },
                })}
                className="input-field mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Limit how many questions you want to handle daily
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">You're almost ready!</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Once you complete setup, you'll start appearing in expert searches.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
        {renderStep()}
      </div>
    </div>
  );
}