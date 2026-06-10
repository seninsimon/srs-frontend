import api from './api';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'host';
  createdAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: 'super_admin' | 'host';
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },
  
  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post('/users', data);
    return response.data;
  },
  
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};