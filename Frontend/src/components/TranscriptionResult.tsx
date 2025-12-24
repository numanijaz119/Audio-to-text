import { useState } from 'react';
import { Copy, Download, CheckCircle, RotateCcw } from 'lucide-react';
import { apiService } from '../services/api.service';

interface Props {
  transcription: any;
  onReset: () => void;
}

export default function TranscriptionResult({ transcription, onReset }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const blob = await apiService.downloadTranscription(transcription.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription-${transcription.audio_filename}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Download failed');
    }
  };

  if (transcription.status === 'processing') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing your audio...</h3>
          <p className="text-gray-600">This usually takes a few moments</p>
        </div>
      </div>
    );
  }

  if (transcription.status === 'failed') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Transcription failed</h3>
          <p className="text-gray-600 mb-6">{transcription.error_message || 'Please try again'}</p>
          <button
            onClick={onReset}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Transcription Complete</h3>
            <p className="text-sm text-gray-600">
              {transcription.audio_filename} • {transcription.duration} min • ₹{transcription.cost}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Download</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="max-h-96 overflow-y-auto">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {transcription.text}
          </p>
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Transcribe Another File</span>
      </button>
    </div>
  );
}
