'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export function RoleManager() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const switchToExpert = async () => {
    setIsLoading(true);
    try {
      await api.updateUserRole('both');
      toast.success('You can now act as an expert!');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch role');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToUser = async () => {
    setIsLoading(true);
    try {
      await api.updateUserRole('user');
      toast.success('Switched to user mode');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch role');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'both') return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Management</h3>
      <p className="text-sm text-gray-600 mb-4">
        You can switch between being a user (asking questions) and an expert (answering questions).
      </p>
      
      <div className="flex space-x-4">
        <button
          onClick={switchToUser}
          disabled={isLoading}
          className="btn-secondary"
        >
          Switch to User Mode
        </button>
        <button
          onClick={switchToExpert}
          disabled={isLoading}
          className="btn-primary"
        >
          Switch to Expert Mode
        </button>
      </div>
    </div>
  );
}