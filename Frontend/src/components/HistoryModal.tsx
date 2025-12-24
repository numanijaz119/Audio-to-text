import { useState, useEffect } from 'react';
import { X, History, FileAudio, Clock, Download, Loader2, Search, Filter, CheckCircle, AlertCircle, Hourglass } from 'lucide-react';
import { transcriptionApi } from '../services/api';
import type { Transcription, TranscriptionStatus } from '../types';
import toast from 'react-hot-toast';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TranscriptionStatus | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchTranscriptions();
    }
  }, [isOpen]);

  const fetchTranscriptions = async () => {
    setLoading(true);
    try {
      const data = await transcriptionApi.getAll();
      // Ensure data is an array
      setTranscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch transcriptions:', err);
      toast.error('Failed to load history');
      setTranscriptions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (transcription: Transcription, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (transcription.status !== 'completed') {
      toast.error('Transcription is not completed');
      return;
    }

    try {
      const blob = await transcriptionApi.download(transcription.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription_${transcription.id}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started!');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: TranscriptionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'processing':
      case 'pending':
        return <Hourglass className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TranscriptionStatus) => {
    const styles = {
      completed: 'badge-green',
      processing: 'badge-blue',
      pending: 'badge-yellow',
      failed: 'badge-red',
    };
    return styles[status] || 'badge-blue';
  };

  const filteredTranscriptions = Array.isArray(transcriptions) 
    ? transcriptions.filter((t) => {
        const matchesSearch = t.audio_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              t.text?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl pointer-events-auto animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Transcription History</h2>
                <p className="text-sm text-slate-500">{transcriptions.length} total transcriptions</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by filename or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 py-2"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TranscriptionStatus | 'all')}
                className="input pl-10 py-2 pr-8 min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : filteredTranscriptions.length === 0 ? (
              <div className="text-center py-16">
                <FileAudio className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No transcriptions found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Upload an audio file to get started'}
                </p>
              </div>
            ) : selectedTranscription ? (
              // Detail View
              <div className="p-6">
                <button
                  onClick={() => setSelectedTranscription(null)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 flex items-center gap-1"
                >
                  ← Back to list
                </button>
                
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileAudio className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{selectedTranscription.audio_filename}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(selectedTranscription.duration)}
                        </span>
                        <span className="capitalize">{selectedTranscription.language}</span>
                        <span>₹{selectedTranscription.cost.toFixed(2)}</span>
                        <span className={`badge ${getStatusBadge(selectedTranscription.status)}`}>
                          {selectedTranscription.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDate(selectedTranscription.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Transcription Text */}
                  {selectedTranscription.status === 'completed' && (
                    <>
                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 max-h-[300px] overflow-y-auto">
                        <p className="transcription-text">
                          {selectedTranscription.text || 'No text was detected in the audio.'}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => handleDownload(selectedTranscription, e)}
                        className="btn btn-primary w-full"
                      >
                        <Download className="w-5 h-5" />
                        Download Transcription
                      </button>
                    </>
                  )}

                  {/* Error Message */}
                  {selectedTranscription.status === 'failed' && selectedTranscription.error_message && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-red-600 text-sm">{selectedTranscription.error_message}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // List View
              <div className="divide-y divide-slate-100">
                {filteredTranscriptions.map((transcription) => (
                  <button
                    key={transcription.id}
                    onClick={() => setSelectedTranscription(transcription)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(transcription.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {transcription.audio_filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{formatDuration(transcription.duration)}</span>
                        <span>•</span>
                        <span className="capitalize">{transcription.language}</span>
                        <span>•</span>
                        <span>{formatDate(transcription.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${getStatusBadge(transcription.status)}`}>
                        {transcription.status}
                      </span>
                      {transcription.status === 'completed' && (
                        <button
                          onClick={(e) => handleDownload(transcription, e)}
                          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
