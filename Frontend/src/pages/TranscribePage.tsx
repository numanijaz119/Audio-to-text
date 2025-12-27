import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { useAuth } from "../hooks/useAuth";
import { audioApi, transcriptionApi, walletApi } from "../services/api";
import type {
  AudioFile,
  Transcription,
  TranscriptionLanguage,
  WalletDetails,
} from "../types";
import { SUPPORTED_FORMATS, MAX_FILE_SIZE, LANGUAGE_OPTIONS } from "../types";
import toast from "react-hot-toast";
import {
  Music,
  Upload,
  FileAudio,
  Languages,
  Loader2,
  Check,
  Copy,
  Download,
  X,
  LogOut,
  Wallet,
  Clock,
  ChevronDown,
  AlertCircle,
  Sparkles,
  RefreshCw,
  History,
  CreditCard,
} from "lucide-react";

// Sub-components
import WalletModal from "../components/WalletModal";
import HistoryModal from "../components/HistoryModal";

type AppState = "idle" | "uploaded" | "processing" | "completed" | "error";

export default function TranscribePage() {
  const { user, logout, refreshUser } = useAuth();

  // State
  const [appState, setAppState] = useState<AppState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [language, setLanguage] = useState<TranscriptionLanguage>("auto");
  const [transcription, setTranscription] = useState<Transcription | null>(
    null
  );
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [walletData, setWalletData] = useState<WalletDetails | null>(null);

  // Modals
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch wallet data
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await walletApi.getDetails();
        setWalletData(data);
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    };
    fetchWallet();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !SUPPORTED_FORMATS.includes(extension as any)) {
      return `Unsupported format. Please use: ${SUPPORTED_FORMATS.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 100MB limit";
    }
    return null;
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setSelectedFile(file);
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const response = await audioApi.upload(file, (progress) => {
          setUploadProgress(progress);
        });

        setAudioFile(response.audio_file);
        setEstimatedCost(response.estimated_cost);
        setHasSufficientBalance(response.has_sufficient_balance);
        setAppState("uploaded");
        toast.success("File uploaded successfully!");
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || "Upload failed. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
        setAppState("error");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [validateFile]
  );

  // Dropzone setup
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileSelect(acceptedFiles[0]);
      }
    },
    [handleFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": SUPPORTED_FORMATS.map((f) => `.${f}`),
    },
    maxFiles: 1,
    disabled: isUploading || appState === "processing",
  });

  // Start transcription
  const handleTranscribe = async () => {
    if (!audioFile) return;

    if (!hasSufficientBalance) {
      setShowWalletModal(true);
      return;
    }

    setAppState("processing");
    setError(null);

    try {
      const result = await transcriptionApi.create(audioFile.id, language);

      // Poll for completion if status is processing
      if (result.status === "processing" || result.status === "pending") {
        pollTranscriptionStatus(result.id);
      } else if (result.status === "completed") {
        setTranscription(result);
        setAppState("completed");
        refreshUser();
        refreshWallet();
        toast.success("Transcription completed!");
      } else if (result.status === "failed") {
        setError(result.error_message || "Transcription failed");
        setAppState("error");
        toast.error("Transcription failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Transcription failed. Please try again.";
      setError(errorMessage);
      setAppState("error");
      toast.error(errorMessage);
    }
  };

  // Poll for transcription status
  const pollTranscriptionStatus = async (id: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const result = await transcriptionApi.get(id);

        if (result.status === "completed") {
          setTranscription(result);
          setAppState("completed");
          refreshUser();
          refreshWallet();
          toast.success("Transcription completed!");
        } else if (result.status === "failed") {
          setError(result.error_message || "Transcription failed");
          setAppState("error");
          toast.error("Transcription failed");
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000);
        } else {
          setError("Transcription timed out. Please try again.");
          setAppState("error");
        }
      } catch (err) {
        setError("Failed to check transcription status");
        setAppState("error");
      }
    };

    poll();
  };

  // Refresh wallet
  const refreshWallet = async () => {
    try {
      const data = await walletApi.getDetails();
      setWalletData(data);
    } catch (err) {
      console.error("Failed to refresh wallet:", err);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!transcription?.text) return;

    try {
      await navigator.clipboard.writeText(transcription.text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  // Download transcription
  const handleDownload = async () => {
    if (!transcription) return;

    try {
      const blob = await transcriptionApi.download(transcription.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcription_${transcription.id}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started!");
    } catch (err) {
      toast.error("Download failed");
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setAppState("idle");
    setSelectedFile(null);
    setAudioFile(null);
    setTranscription(null);
    setError(null);
    setEstimatedCost(0);
    setHasSufficientBalance(true);
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-800">
                AudioScribe
              </span>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Wallet Balance */}
              <button
                onClick={() => setShowWalletModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <Wallet className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-slate-700">
                  ₹{walletData?.wallet.balance.toFixed(2) || "0.00"}
                </span>
                {(walletData?.wallet.demo_minutes_remaining || 0) > 0 && (
                  <span className="badge badge-blue text-xs">
                    {walletData?.wallet.demo_minutes_remaining.toFixed(0)} free
                    min
                  </span>
                )}
              </button>

              {/* History Button */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                title="History"
              >
                <History className="w-5 h-5 text-slate-600" />
              </button>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 py-2 bg-white rounded-xl shadow-lg border border-slate-100 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-800">
                          {user?.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowWalletModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm">Wallet & Billing</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowHistoryModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        <span className="text-sm">Transcription History</span>
                      </button>
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 md:pt-28 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="heading-lg text-slate-900 mb-2">Audio to Text</h1>
            <p className="text-lg text-slate-500 font-light">
              Upload your audio file and get accurate transcription in seconds
            </p>
          </div>

          {/* Main Card */}
          <div className="card-elevated p-6 md:p-8">
            {/* Upload Zone - Idle State */}
            {appState === "idle" && (
              <div
                {...getRootProps()}
                className={`dropzone p-8 md:p-12 ${
                  isDragActive ? "dropzone-active" : ""
                } ${
                  isUploading
                    ? "pointer-events-none opacity-70 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <input {...getInputProps()} />

                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    ) : (
                      <Upload className="w-10 h-10 text-blue-500" />
                    )}
                  </div>

                  {isUploading ? (
                    <>
                      <p className="text-lg font-medium text-slate-700 mb-2">
                        Uploading...
                      </p>
                      <div className="w-full max-w-xs mx-auto progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-400 mt-2">
                        {uploadProgress}%
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-slate-700 mb-2">
                        {isDragActive
                          ? "Drop your file here"
                          : "Drag & drop your audio file"}
                      </p>
                      <p className="text-slate-400 mb-4">or click to browse</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                        {SUPPORTED_FORMATS.map((format) => (
                          <span
                            key={format}
                            className="px-2 py-1 bg-slate-100 rounded-md uppercase"
                          >
                            {format}
                          </span>
                        ))}
                        <span className="px-2 py-1 bg-slate-100 rounded-md">
                          Max 100MB
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Uploaded State */}
            {appState === "uploaded" && audioFile && (
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileAudio className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {audioFile.filename}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(audioFile.duration)}
                      </span>
                      <span>{formatFileSize(audioFile.size)}</span>
                      <span className="uppercase">{audioFile.format}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Languages className="w-4 h-4 inline mr-2" />
                    Select Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) =>
                      setLanguage(e.target.value as TranscriptionLanguage)
                    }
                    className="input"
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cost Estimate */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Estimated Cost
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      ₹{estimatedCost.toFixed(2)}
                    </p>
                  </div>
                  {!hasSufficientBalance && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Insufficient balance
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleTranscribe}
                    className="btn btn-primary flex-1"
                  >
                    <Sparkles className="w-5 h-5" />
                    {hasSufficientBalance
                      ? "Start Transcription"
                      : "Add Funds & Transcribe"}
                  </button>
                  <button onClick={handleReset} className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {appState === "processing" && (
              <div className="py-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center processing-glow">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Transcribing your audio...
                </h3>
                <p className="text-slate-500 mb-6">
                  This usually takes a few seconds to a minute depending on file
                  length
                </p>

                {/* Animated Waveform */}
                <div className="flex items-center justify-center gap-1 h-12">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-blue-400 to-blue-500 rounded-full waveform-bar"
                      style={{
                        height: `${30 + Math.random() * 40}%`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed State */}
            {appState === "completed" && transcription && (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-emerald-800">
                      Transcription Complete!
                    </p>
                    <p className="text-sm text-emerald-600">
                      {transcription.duration.toFixed(1)} minutes • Cost: ₹
                      {transcription.cost.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Transcription Text */}
                <div className="relative">
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    <button
                      onClick={handleCopy}
                      className="btn btn-sm btn-ghost"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="btn btn-sm btn-ghost"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 max-h-[400px] overflow-y-auto">
                    <p className="transcription-text pr-20">
                      {transcription.text ||
                        "No text was detected in the audio."}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownload}
                    className="btn btn-primary flex-1"
                  >
                    <Download className="w-5 h-5" />
                    Download Transcription
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn btn-outline flex-1"
                  >
                    <RefreshCw className="w-5 h-5" />
                    New Transcription
                  </button>
                </div>
              </div>
            )}

            {/* Error State */}
            {appState === "error" && (
              <div className="py-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Something went wrong
                </h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  {error || "An unexpected error occurred. Please try again."}
                </p>
                <button onClick={handleReset} className="btn btn-primary">
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Info Cards */}
          {appState === "idle" && (
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              <div className="card p-5 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileAudio className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Multiple Formats
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  MP3, WAV, M4A, FLAC, OGG
                </p>
              </div>
              <div className="card p-5 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Up to 1 Hour
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Max 60 minutes per file
                </p>
              </div>
              <div className="card p-5 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  ₹1 per Minute
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Pay only for what you use
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        walletData={walletData}
        onRefresh={refreshWallet}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-slate-700">AudioScribe</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link
                to="/privacy"
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/contact"
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                Contact Us
              </Link>
            </div>

            <p className="text-sm text-slate-400">
              © 2025 AudioScribe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
