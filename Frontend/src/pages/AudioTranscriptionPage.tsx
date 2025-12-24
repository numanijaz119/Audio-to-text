import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import Header from '../components/Header';
import FileUpload from '../components/FileUpload';
import TranscriptionSettings from '../components/TranscriptionSettings';
import TranscriptionResult from '../components/TranscriptionResult';
import TranscriptionHistory from '../components/TranscriptionHistory';
import WalletBalance from '../components/WalletBalance';
import type { User } from '../types';

interface Props {
  isAuthenticated: boolean;
  user: User | null;
  onLoginRequired: () => void;
}

export default function AudioTranscriptionPage({ isAuthenticated, user, onLoginRequired }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedAudioId, setUploadedAudioId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const [currentTranscription, setCurrentTranscription] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: apiService.getWallet,
    enabled: isAuthenticated,
  });

  const { data: transcriptions } = useQuery({
    queryKey: ['transcriptions'],
    queryFn: () => apiService.getTranscriptions({ status: 'completed' }),
    enabled: isAuthenticated,
  });

  const uploadMutation = useMutation({
    mutationFn: apiService.uploadAudio,
    onSuccess: (data) => {
      setUploadedAudioId(data.audio_file.id);
    },
  });

  const transcribeMutation = useMutation({
    mutationFn: ({ audioFileId, language }: { audioFileId: string; language: 'english' | 'hindi' }) =>
      apiService.createTranscription(audioFileId, language),
    onSuccess: (data) => {
      setCurrentTranscription(data);
      queryClient.invalidateQueries({ queryKey: ['transcriptions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setSelectedFile(null);
      setUploadedAudioId(null);
    },
  });

  const handleFileSelect = (file: File) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    setSelectedFile(file);
    setUploadedAudioId(null);
    setCurrentTranscription(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    uploadMutation.mutate(selectedFile);
  };

  const handleTranscribe = async () => {
    if (!uploadedAudioId) return;
    transcribeMutation.mutate({ audioFileId: uploadedAudioId, language });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedAudioId(null);
    setCurrentTranscription(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {isAuthenticated && user && (
          <WalletBalance
            balance={walletData?.wallet.balance || 0}
            demoMinutes={walletData?.wallet.demo_minutes_remaining || 0}
          />
        )}

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Audio to Text Transcription
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert your audio files to accurate text transcriptions in seconds using AI-powered speech recognition
          </p>
          {!isAuthenticated && (
            <p className="mt-4 text-sm text-blue-600 font-medium">
              Get 10 minutes of free transcription on signup
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <FileUpload
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            isUploading={uploadMutation.isPending}
            onUpload={handleUpload}
            uploadError={uploadMutation.error}
            isAuthenticated={isAuthenticated}
          />

          {uploadedAudioId && (
            <TranscriptionSettings
              language={language}
              onLanguageChange={setLanguage}
              onTranscribe={handleTranscribe}
              isTranscribing={transcribeMutation.isPending}
            />
          )}

          {transcribeMutation.error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                {(transcribeMutation.error as any)?.response?.data?.error || 'Transcription failed'}
              </p>
            </div>
          )}
        </div>

        {currentTranscription && (
          <TranscriptionResult
            transcription={currentTranscription}
            onReset={handleReset}
          />
        )}

        {isAuthenticated && transcriptions && transcriptions.length > 0 && (
          <TranscriptionHistory transcriptions={transcriptions} />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2024 Audio to Text. Powered by OpenAI Whisper.</p>
          <p className="mt-2">Simple. Fast. Accurate.</p>
        </div>
      </footer>
    </div>
  );
}
