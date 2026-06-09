import api from './api';

export interface Session {
  _id: string;
  title: string;
  description?: string;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  assignedHost?: {
    _id: string;
    username: string;
    email: string;
  };
  status: 'active' | 'ended';
  createdAt: string;
}

export interface CreateSessionData {
  title: string;
  description?: string;
  assignedHost?: string;
}

export const sessionService = {
  async getSessions(): Promise<Session[]> {
    const response = await api.get('/sessions');
    return response.data;
  },
  
  async getSession(id: string): Promise<Session> {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },
  
  async createSession(data: CreateSessionData): Promise<Session> {
    const response = await api.post('/sessions', data);
    return response.data;
  },
  
  async updateSession(id: string, data: Partial<Session>): Promise<Session> {
    const response = await api.put(`/sessions/${id}`, data);
    return response.data;
  },
  
  async deleteSession(id: string): Promise<void> {
    await api.delete(`/sessions/${id}`);
  },
  
  async assignHost(id: string, hostId: string): Promise<Session> {
    const response = await api.patch(`/sessions/${id}/assign-host`, { hostId });
    return response.data;
  },
  
  async generateJoinLink(id: string): Promise<{ joinUrl: string; token: string }> {
    const response = await api.post(`/sessions/${id}/generate-join-link`);
    return response.data;
  },
  
  async verifyJoin(sessionId: string, token: string): Promise<{ sessionId: string; title: string; description?: string }> {
    const response = await api.get(`/sessions/${sessionId}/verify?token=${token}`);
    return response.data;
  },
};