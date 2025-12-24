import { Languages, Sparkles } from 'lucide-react';

interface Props {
  language: 'english' | 'hindi';
  onLanguageChange: (language: 'english' | 'hindi') => void;
  onTranscribe: () => void;
  isTranscribing: boolean;
}

export default function TranscriptionSettings({
  language,
  onLanguageChange,
  onTranscribe,
  isTranscribing,
}: Props) {
  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <Languages className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Transcription Settings</h3>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Language
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onLanguageChange('english')}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200
              ${language === 'english'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="text-2xl mb-1">🇬🇧</div>
            <div className="font-medium">English</div>
          </button>

          <button
            onClick={() => onLanguageChange('hindi')}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200
              ${language === 'hindi'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="text-2xl mb-1">🇮🇳</div>
            <div className="font-medium">Hindi</div>
          </button>
        </div>
      </div>

      <button
        onClick={onTranscribe}
        disabled={isTranscribing}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-lg shadow-lg hover:shadow-xl"
      >
        {isTranscribing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Transcribing... This may take a moment
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Start Transcription
          </span>
        )}
      </button>
    </div>
  );
}
