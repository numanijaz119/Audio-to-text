import api from '../config/api';
import type { AudioFile, Transcription, Wallet, Transaction } from '../types';

export const apiService = {
  // Wallet
  getWallet: async () => {
    const response = await api.get<{ wallet: Wallet; statistics: any }>('/wallet/details/');
    return response.data;
  },

  createOrder: async (amount: number) => {
    const response = await api.post('/wallet/create_order/', { amount });
    return response.data;
  },

  verifyPayment: async (paymentData: any) => {
    const response = await api.post('/wallet/verify_payment/', paymentData);
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get<Transaction[]>('/transactions/');
    return response.data;
  },

  // Audio Files
  uploadAudio: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/audio/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAudioFiles: async () => {
    const response = await api.get<AudioFile[]>('/audio/');
    return response.data;
  },

  deleteAudio: async (id: string) => {
    await api.delete(`/audio/${id}/`);
  },

  // Transcriptions
  createTranscription: async (audioFileId: string, language: 'english' | 'hindi') => {
    const response = await api.post<Transcription>('/transcriptions/', {
      audio_file_id: audioFileId,
      language,
    });
    return response.data;
  },

  getTranscriptions: async (filters?: any) => {
    const response = await api.get<Transcription[]>('/transcriptions/', { params: filters });
    return response.data;
  },

  getTranscription: async (id: string) => {
    const response = await api.get<Transcription>(`/transcriptions/${id}/`);
    return response.data;
  },

  downloadTranscription: async (id: string) => {
    const response = await api.get(`/transcriptions/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportTranscriptionsCSV: async (filters?: any) => {
    const response = await api.get('/transcriptions/export_csv/', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};
