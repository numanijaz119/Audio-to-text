export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'facebook';
  demo_minutes_remaining: number;
  wallet_balance: number;
  created_at: string;
}

export interface Wallet {
  id: string;
  balance: number;
  demo_minutes_remaining: number;
  total_spent: number;
  total_minutes_used: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: 'recharge' | 'debit' | 'demo_credit';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  payment_id?: string;
  created_at: string;
}

export interface AudioFile {
  id: string;
  filename: string;
  duration: number;
  size: number;
  format: string;
  uploaded_at: string;
}

export interface Transcription {
  id: string;
  audio_file: string;
  audio_filename: string;
  language: 'english' | 'hindi';
  text: string;
  duration: number;
  cost: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface UsageStatistics {
  total_minutes_transcribed: number;
  total_amount_spent: number;
  current_balance: number;
  demo_minutes_remaining: number;
}
