import api from './api';

export interface Flag {
  id: string;
  sessionId: string;
  clientId?: { id: string; displayName: string };
  createdBy: { id: string; username: string };
  type: 'manual';
  description: string;
  cameraScreenshot?: string;
  screenScreenshot?: string;
  timestamp: string;
  createdAt: string;
}

export interface CreateFlagData {
  sessionId: string;
  clientId?: string;
  description: string;
  cameraScreenshot?: string;
  screenScreenshot?: string;
  timestamp: string;
}

export const flagService = {
  async createFlag(data: CreateFlagData): Promise<Flag> {
    const response = await api.post('/flags', data);
    return response.data;
  },
  
  async getSessionFlags(sessionId: string): Promise<Flag[]> {
    const response = await api.get(`/flags/session/${sessionId}`);
    return response.data;
  },

  async getAllFlags(): Promise<Flag[]> {
    const response = await api.get('/flags');
    return response.data;
  },
};