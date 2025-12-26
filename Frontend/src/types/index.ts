// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'facebook';
  demo_minutes_remaining: number;
  wallet_balance: number;
  created_at: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  balance: number;
  demo_minutes_remaining: number;
  total_spent: number;
  total_minutes_used: number;
  created_at: string;
  updated_at: string;
}

export interface WalletDetails {
  wallet: Wallet;
  statistics: {
    total_minutes_transcribed: number;
    total_amount_spent: number;
    current_balance: number;
    demo_minutes_remaining: number;
  };
}

// Transaction Types
export interface Transaction {
  id: string;
  type: 'recharge' | 'debit' | 'demo_credit';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  payment_id: string | null;
  created_at: string;
}

// Audio File Types
export interface AudioFile {
  id: string;
  filename: string;
  duration: number;
  size: number;
  format: string;
  uploaded_at: string;
}

export interface AudioUploadResponse {
  audio_file: AudioFile;
  estimated_cost: number;
  has_sufficient_balance: boolean;
}

// Transcription Types
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TranscriptionLanguage = 'auto' | 'english' | 'hindi';

export interface Transcription {
  id: string;
  audio_file: string;
  audio_filename: string;
  language: TranscriptionLanguage;
  text: string;
  duration: number;
  cost: number;
  status: TranscriptionStatus;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface TranscriptionCreateRequest {
  audio_file_id: string;
  language: TranscriptionLanguage;
}

// Auth Types
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  is_new_user: boolean;
}

export interface GoogleLoginRequest {
  email: string;
  name: string;
  provider_id: string;
}

export interface FacebookLoginRequest {
  email: string;
  name: string;
  provider_id: string;
}

// Payment Types
export interface PaymentOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export interface PaymentVerification {
  order_id: string;
  payment_id: string;
  signature: string;
  amount: number;
}

// API Response Types
export interface ApiError {
  error: string;
  detail?: string;
}

// Component Props Types
export interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  audioFile: AudioFile | null;
  estimatedCost: number;
  hasSufficientBalance: boolean;
  error: string | null;
}

export interface TranscriptionState {
  transcribing: boolean;
  transcription: Transcription | null;
  error: string | null;
}

// Supported Formats
export const SUPPORTED_FORMATS = ['mp3', 'wav', 'm4a', 'flac', 'ogg'] as const;
export type SupportedFormat = typeof SUPPORTED_FORMATS[number];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_DURATION_MINUTES = 60;

// Language Options
export const LANGUAGE_OPTIONS: { value: TranscriptionLanguage; label: string }[] = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
];

// Status Labels
export const STATUS_LABELS: Record<TranscriptionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

export const STATUS_COLORS: Record<TranscriptionStatus, string> = {
  pending: 'yellow',
  processing: 'blue',
  completed: 'green',
  failed: 'red',
};
