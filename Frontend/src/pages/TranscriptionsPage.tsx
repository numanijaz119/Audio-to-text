import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { Download, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function TranscriptionsPage() {
  const { data: transcriptions, isLoading } = useQuery({
    queryKey: ['transcriptions'],
    queryFn: () => apiService.getTranscriptions(),
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      const blob = await apiService.downloadTranscription(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Download failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transcriptions</h1>
        <p className="text-gray-600 mt-1">View and manage your transcription history</p>
      </div>

      {transcriptions && transcriptions.length > 0 ? (
        <div className="space-y-4">
          {transcriptions.map((t) => (
            <div key={t.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(t.status)}
                    <h3 className="text-lg font-semibold">{t.audio_filename}</h3>
                  </div>
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <span>Language: {t.language}</span>
                    <span>Duration: {t.duration} min</span>
                    <span>Cost: ₹{t.cost}</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {t.status === 'completed' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCopy(t.text)}
                      className="p-2 text-gray-600 hover:text-gray-900 border rounded"
                      title="Copy"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(t.id, t.audio_filename)}
                      className="p-2 text-gray-600 hover:text-gray-900 border rounded"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {t.status === 'completed' && (
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{t.text}</p>
                </div>
              )}

              {t.status === 'failed' && t.error_message && (
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <p className="text-sm text-red-800">Error: {t.error_message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500">No transcriptions yet. Upload an audio file to get started!</p>
        </div>
      )}
    </div>
  );
}
