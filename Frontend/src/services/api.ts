import axios from "axios";
import type {
  User,
  WalletDetails,
  Transaction,
  AudioFile,
  AudioUploadResponse,
  Transcription,
  TranscriptionLanguage,
  LoginResponse,
  GoogleLoginRequest,
  FacebookLoginRequest,
  PaymentOrder,
  PaymentVerification,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  googleLogin: async (data: GoogleLoginRequest): Promise<LoginResponse> => {
    const response = await api.post("/auth/google/login/", data);
    return response.data;
  },

  facebookLogin: async (data: FacebookLoginRequest): Promise<LoginResponse> => {
    const response = await api.post("/auth/facebook/login/", data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/auth/user/");
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

// Wallet API
export const walletApi = {
  getDetails: async (): Promise<WalletDetails> => {
    const response = await api.get("/wallet/details/");
    return response.data;
  },

  createOrder: async (amount: number): Promise<PaymentOrder> => {
    const response = await api.post("/wallet/create_order/", { amount });
    return response.data;
  },

  verifyPayment: async (
    data: PaymentVerification
  ): Promise<{ message: string; transaction: Transaction }> => {
    const response = await api.post("/wallet/verify_payment/", data);
    return response.data;
  },
};

// Transaction API
export const transactionApi = {
  getAll: async (): Promise<Transaction[]> => {
    const response = await api.get("/transactions/");
    // Handle paginated response from DRF
    if (
      response.data &&
      typeof response.data === "object" &&
      "results" in response.data
    ) {
      return response.data.results;
    }
    // Fallback to direct array if not paginated
    return Array.isArray(response.data) ? response.data : [];
  },
};

// Audio API
export const audioApi = {
  upload: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AudioUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/audio/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  getAll: async (): Promise<AudioFile[]> => {
    const response = await api.get("/audio/");
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/audio/${id}/`);
  },
};

// Transcription API
export const transcriptionApi = {
  create: async (
    audioFileId: string,
    language: TranscriptionLanguage
  ): Promise<Transcription> => {
    const response = await api.post("/transcriptions/", {
      audio_file_id: audioFileId,
      language,
    });
    return response.data;
  },

  getAll: async (
    filters?: Record<string, string>
  ): Promise<Transcription[]> => {
    const response = await api.get("/transcriptions/", { params: filters });
    // Handle paginated response from DRF
    if (
      response.data &&
      typeof response.data === "object" &&
      "results" in response.data
    ) {
      return response.data.results;
    }
    // Fallback to direct array if not paginated
    return Array.isArray(response.data) ? response.data : [];
  },

  get: async (id: string): Promise<Transcription> => {
    const response = await api.get(`/transcriptions/${id}/`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transcriptions/${id}/`);
  },

  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/transcriptions/${id}/download/`, {
      responseType: "blob",
    });
    return response.data;
  },

  exportCSV: async (filters?: Record<string, string>): Promise<Blob> => {
    const response = await api.get("/transcriptions/export_csv/", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },
};

export default api;
