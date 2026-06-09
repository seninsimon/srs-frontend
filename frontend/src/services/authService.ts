import api from './api';
import { useAuthStore } from '../store/authStore';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'host';
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; accessToken: string }> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  async logout(): Promise<void> {
    await api.post('/auth/logout');
    useAuthStore.getState().logout();
  },
  
  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.user;
  },
};