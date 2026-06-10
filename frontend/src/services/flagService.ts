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
  metadata?: {
    cameraScreenshotUrl?: string;
    screenScreenshotUrl?: string;
  };
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
    const formData = new FormData();

    formData.append('sessionId', data.sessionId);

    if (data.clientId) {
      formData.append('clientId', data.clientId);
    }

    formData.append('description', data.description);
    formData.append('timestamp', data.timestamp);

    if (data.cameraScreenshot) {
      const cameraBlob = await fetch(data.cameraScreenshot).then(r => r.blob());

      formData.append(
        'cameraScreenshot',
        cameraBlob,
        `camera-${Date.now()}.jpg`
      );
    }

    if (data.screenScreenshot) {
      const screenBlob = await fetch(data.screenScreenshot).then(r => r.blob());

      formData.append(
        'screenScreenshot',
        screenBlob,
        `screen-${Date.now()}.jpg`
      );
    }

    const response = await api.post('/flags', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

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