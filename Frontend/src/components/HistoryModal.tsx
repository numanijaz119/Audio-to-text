import { useState, useEffect } from 'react';
import { X, History, FileAudio, Clock, Download, Loader2, Search, Filter, CheckCircle, AlertCircle, Hourglass, Trash2 } from 'lucide-react';
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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

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

  const handleDelete = async (transcriptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this transcription?')) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(transcriptionId));
    
    try {
      await transcriptionApi.delete(transcriptionId);
      setTranscriptions(prev => prev.filter(t => t.id !== transcriptionId));
      if (selectedTranscription?.id === transcriptionId) {
        setSelectedTranscription(null);
      }
      toast.success('Transcription deleted');
    } catch (err) {
      toast.error('Failed to delete transcription');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(transcriptionId);
        return next;
      });
    }
  };

  const handleClearAll = async () => {
    if (transcriptions.length === 0) {
      toast.error('No transcriptions to clear');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${transcriptions.length} transcription(s)? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    const deletePromises = transcriptions.map(t => transcriptionApi.delete(t.id));
    
    try {
      await Promise.all(deletePromises);
      setTranscriptions([]);
      setSelectedTranscription(null);
      toast.success('All transcriptions cleared');
    } catch (err) {
      toast.error('Failed to clear some transcriptions');
      // Refresh the list to show what's left
      fetchTranscriptions();
    } finally {
      setLoading(false);
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

  const getLanguageLabel = (language: string) => {
    const labels: Record<string, string> = {
      auto: 'Auto Detect',
      english: 'English',
      hindi: 'Hindi',
    };
    return labels[language] || language;
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
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div className="w-full max-w-3xl bg-white rounded-xl sm:rounded-2xl shadow-2xl pointer-events-auto animate-scale-in max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800 truncate">History</h2>
                <p className="text-xs sm:text-sm text-slate-500">{transcriptions.length} total</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {transcriptions.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-600 disabled:opacity-50"
                  title="Clear all transcriptions"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 py-2 text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TranscriptionStatus | 'all')}
                className="input pl-10 py-2 pr-8 text-sm w-full sm:min-w-[150px]"
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
              <div className="flex items-center justify-center py-12 sm:py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : filteredTranscriptions.length === 0 ? (
              <div className="text-center py-12 sm:py-16 px-4">
                <FileAudio className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 text-base sm:text-lg">No transcriptions found</p>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Upload an audio file to get started'}
                </p>
              </div>
            ) : selectedTranscription ? (
              // Detail View
              <div className="p-4 sm:p-6">
                <button
                  onClick={() => setSelectedTranscription(null)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 flex items-center gap-1"
                >
                  ← Back to list
                </button>
                
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileAudio className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm sm:text-base break-words">{selectedTranscription.audio_filename}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {formatDuration(selectedTranscription.duration)}
                        </span>
                        <span>{getLanguageLabel(selectedTranscription.language)}</span>
                        <span>₹{selectedTranscription.cost.toFixed(2)}</span>
                        <span className={`badge ${getStatusBadge(selectedTranscription.status)} text-xs`}>
                          {selectedTranscription.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDate(selectedTranscription.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Processing Progress */}
                  {(selectedTranscription.status === 'processing' || selectedTranscription.status === 'pending') && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-3 mb-3">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">
                            {selectedTranscription.status === 'processing' ? 'Transcribing...' : 'Queued...'}
                          </p>
                          <p className="text-xs text-blue-600">This may take a few moments</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    </div>
                  )}

                  {/* Transcription Text */}
                  {selectedTranscription.status === 'completed' && (
                    <>
                      <div className="p-4 sm:p-6 bg-slate-50 rounded-xl border border-slate-100 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                        <p className="transcription-text text-sm sm:text-base">
                          {selectedTranscription.text || 'No text was detected in the audio.'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={(e) => handleDownload(selectedTranscription, e)}
                          className="btn btn-primary flex-1 text-sm"
                        >
                          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                          Download
                        </button>
                        <button
                          onClick={(e) => handleDelete(selectedTranscription.id, e)}
                          disabled={deletingIds.has(selectedTranscription.id)}
                          className="btn btn-outline text-red-600 hover:bg-red-50 border-red-200 flex-1 text-sm disabled:opacity-50"
                        >
                          {deletingIds.has(selectedTranscription.id) ? (
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                          Delete
                        </button>
                      </div>
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
                  <div
                    key={transcription.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <button
                      onClick={() => setSelectedTranscription(transcription)}
                      className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        {getStatusIcon(transcription.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate text-sm sm:text-base">
                          {transcription.audio_filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                          <span>{formatDuration(transcription.duration)}</span>
                          <span>•</span>
                          <span>{getLanguageLabel(transcription.language)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{formatDate(transcription.created_at)}</span>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className={`badge ${getStatusBadge(transcription.status)} text-xs`}>
                        {transcription.status}
                      </span>
                      {transcription.status === 'completed' && (
                        <button
                          onClick={(e) => handleDownload(transcription, e)}
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(transcription.id, e)}
                        disabled={deletingIds.has(transcription.id)}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingIds.has(transcription.id) ? (
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
