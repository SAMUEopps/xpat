'use client';

import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/api/auth/login', { email, password });
    return data;
  },

  register: async (userData: any) => {
    const { data } = await apiClient.post('/api/auth/register', userData);
    return data;
  },

  getProfile: async () => {
    const { data } = await apiClient.get('/api/auth/me');
    return data.user;
  },

  // Add to api object
  updateProfile: async (data: { name: string; email: string; bio: string }) => {
  const { data: response } = await apiClient.put('/api/user/profile', data);
  return response.user;
  },

  updateUserRole: async (role: 'user' | 'expert' | 'both') => {
  const { data } = await apiClient.put('/api/user/role', { role });
  return data.user;
  },

    // ✅ NEW: Update question (for status changes)
  updateQuestion: async (id: string, updateData: any) => {
    const { data } = await apiClient.put(`/api/questions/${id}`, updateData);
    return data;
  },

  // Questions
  /*getQuestions: async (filter?: string) => {
    const { data } = await apiClient.get('/api/questions', {
      params: { status: filter !== 'all' ? filter : undefined },
    });
    return data.questions;
  },*/

  // lib/api.ts - Update getQuestions
getQuestions: async (filter?: string, role?: string) => {
  const { data } = await apiClient.get('/api/questions', {
    params: { 
      status: filter !== 'all' ? filter : undefined,
      role: role || undefined,
    },
  });
  return data.questions;
},

  createQuestion: async (questionData: any) => {
    const { data } = await apiClient.post('/api/questions', questionData);
    return data;
  },

  getQuestion: async (id: string) => {
    const { data } = await apiClient.get(`/api/questions/${id}`);
    return data.question;
  },

  acceptQuestion: async (id: string) => {
    const { data } = await apiClient.post(`/api/questions/${id}/accept`);
    return data;
  },

  // Expert
  getExpertProfile: async () => {
    const { data } = await apiClient.get('/api/expert/profile');
    return data.profile;
  },

  updateExpertProfile: async (profileData: any) => {
    const { data } = await apiClient.post('/api/expert/profile', profileData);
    return data.profile;
  },
};