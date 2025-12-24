import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  onUpload: () => void;
  uploadError: any;
  isAuthenticated: boolean;
}

export default function FileUpload({
  selectedFile,
  onFileSelect,
  isUploading,
  onUpload,
  uploadError,
  isAuthenticated,
}: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${selectedFile ? 'bg-green-50 border-green-300' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center">
          {selectedFile ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <div className="flex items-center space-x-3 mb-2">
                <FileAudio className="w-6 h-6 text-green-600" />
                <span className="text-lg font-medium text-gray-900">{selectedFile.name}</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-xs text-gray-500">Click or drag to replace file</p>
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-blue-500 mb-4" />
              <p className="text-xl font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop your audio file here' : 'Drag and drop your audio file'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports: MP3, WAV, M4A, FLAC, OGG (max 1 hour, 100MB)
              </p>
            </>
          )}
        </div>

        {!isAuthenticated && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            Login required
          </div>
        )}
      </div>

      {selectedFile && (
        <button
          onClick={onUpload}
          disabled={isUploading || !isAuthenticated}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            'Process Audio File'
          )}
        </button>
      )}

      {uploadError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Upload failed</p>
            <p className="text-sm text-red-700 mt-1">
              {(uploadError as any)?.response?.data?.error || 'Please try again'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
