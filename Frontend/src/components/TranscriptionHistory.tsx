import { FileText, Download } from 'lucide-react';
import { apiService } from '../services/api.service';

interface Props {
  transcriptions: any[];
}

export default function TranscriptionHistory({ transcriptions }: Props) {
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

  if (!transcriptions || transcriptions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Recent Transcriptions</h2>
      </div>

      <div className="space-y-3">
        {transcriptions.slice(0, 5).map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{t.audio_filename}</p>
              <p className="text-sm text-gray-600 mt-1">
                {t.language} • {t.duration} min • ₹{t.cost} • {new Date(t.created_at).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => handleDownload(t.id, t.audio_filename)}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
