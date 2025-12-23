import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { Upload, FileAudio, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const [uploadedAudioId, setUploadedAudioId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: apiService.uploadAudio,
    onSuccess: (data) => {
      setUploadedAudioId(data.audio_file.id);
    },
  });

  const transcribeMutation = useMutation({
    mutationFn: ({ audioFileId, language }: { audioFileId: string; language: 'english' | 'hindi' }) =>
      apiService.createTranscription(audioFileId, language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcriptions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setSelectedFile(null);
      setUploadedAudioId(null);
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const handleTranscribe = async () => {
    if (!uploadedAudioId) return;
    transcribeMutation.mutate({ audioFileId: uploadedAudioId, language });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Audio</h1>
        <p className="text-gray-600 mt-1">Upload your audio file for transcription</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        {!uploadedAudioId ? (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileAudio className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">{selectedFile.name}</span>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700">Drag & drop an audio file here, or click to select</p>
                  <p className="text-sm text-gray-500 mt-2">Supported: MP3, WAV, M4A, FLAC, OGG (max 1 hour)</p>
                </div>
              )}
            </div>

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
              </button>
            )}

            {uploadMutation.isError && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded">
                <AlertCircle className="w-5 h-5" />
                <span>{(uploadMutation.error as any)?.response?.data?.error || 'Upload failed'}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <p className="text-green-800">File uploaded successfully! Select language and start transcription.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'english' | 'hindi')}
                className="w-full border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
            </div>

            <button
              onClick={handleTranscribe}
              disabled={transcribeMutation.isPending}
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {transcribeMutation.isPending ? 'Transcribing...' : 'Start Transcription'}
            </button>

            {transcribeMutation.isSuccess && (
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <p className="text-green-800">Transcription completed! Check the Transcriptions page.</p>
              </div>
            )}

            {transcribeMutation.isError && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded">
                <AlertCircle className="w-5 h-5" />
                <span>{(transcribeMutation.error as any)?.response?.data?.error || 'Transcription failed'}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
