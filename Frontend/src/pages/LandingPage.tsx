import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Music,
  Upload,
  FileText,
  Download,
  Shield,
  Zap,
  Globe2,
} from "lucide-react";
import LoginModal from "../components/LoginModal";

export default function LandingPage() {
  const { isLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description:
        "Get your transcriptions in seconds, powered by OpenAI Whisper AI",
    },
    {
      icon: <Globe2 className="w-6 h-6" />,
      title: "Multi-Language",
      description:
        "Support for English and Hindi with high accuracy transcription",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your audio files are encrypted and automatically deleted",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: <Upload className="w-8 h-8" />,
      title: "Upload Audio",
      description:
        "Drag and drop your audio file or click to select. We support MP3, WAV, M4A, FLAC, and OGG.",
    },
    {
      number: "02",
      icon: <Music className="w-8 h-8" />,
      title: "Process",
      description:
        "Our AI analyzes your audio and converts speech to text with exceptional accuracy.",
    },
    {
      number: "03",
      icon: <Download className="w-8 h-8" />,
      title: "Download",
      description:
        "Get your transcription as a text file. Copy, edit, or download as needed.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-800">
                AudioScribe
              </span>
            </div>

            <button
              onClick={() => setShowLoginModal(true)}
              disabled={isLoading}
              className="btn btn-primary btn-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-40 pb-20 md:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8 animate-slide-down">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-blue-700">
                Powered by OpenAI Whisper
              </span>
            </div>

            {/* Heading */}
            <h1 className="heading-xl text-slate-900 mb-6 animate-slide-up opacity-0 stagger-1">
              Transform Audio into
              <span className="block gradient-text">Accurate Text</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-500 font-light max-w-2xl mx-auto mb-10 animate-slide-up opacity-0 stagger-2 text-balance">
              Convert your audio files to text in seconds with AI-powered
              transcription. Simple, fast, and incredibly accurate.
            </p>

            {/* CTA */}
            <div className="flex flex-col items-center justify-center gap-4 animate-slide-up opacity-0 stagger-3">
              <button
                onClick={() => setShowLoginModal(true)}
                disabled={isLoading}
                className="btn btn-primary btn-lg group w-full sm:w-auto"
              >
                Get Started Free
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>

              <p className="text-sm text-slate-400">
                10 free minutes • No credit card required
              </p>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 md:mt-24 relative animate-fade-in opacity-0 stagger-4">
            {/* Decorative Elements */}
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
            <div
              className="absolute -bottom-10 -right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
              style={{ animationDelay: "1s" }}
            />

            {/* Main Card */}
            <div className="relative card-elevated max-w-3xl mx-auto p-8 md:p-12">
              {/* Upload Zone Preview */}
              <div className="dropzone p-8 md:p-12 text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-lg font-medium text-slate-700 mb-2">
                  Drag & drop your audio file here
                </p>
                <p className="text-sm text-slate-400">
                  or click to browse • MP3, WAV, M4A, FLAC, OGG up to 100MB
                </p>
              </div>

              {/* Sample Waveform */}
              <div className="flex items-center justify-center gap-1 h-16 px-4">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-blue-400 to-blue-500 rounded-full waveform-bar"
                    style={{
                      height: `${
                        20 + Math.sin(i * 0.5) * 30 + Math.random() * 20
                      }%`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>

              {/* Transcription Preview */}
              <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-500">
                    Transcription
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  "Welcome to our audio transcription service. This is a sample
                  of how your transcribed text will appear. The AI processes
                  your audio with remarkable accuracy, capturing every word..."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="heading-lg text-slate-900 mb-4">
              Why Choose AudioScribe?
            </h2>
            <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
              Professional-grade transcription made simple
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-interactive p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="heading-lg text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
              Three simple steps to convert audio to text
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-200 to-transparent" />
                )}

                <div className="text-center">
                  {/* Step Number */}
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold mb-4">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white shadow-lg flex items-center justify-center text-blue-600">
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-semibold text-slate-800 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Hint */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-elevated p-12 md:p-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <h2 className="heading-md mb-4">Start Transcribing Today</h2>
            <p className="text-xl text-blue-100 font-light mb-8 max-w-xl mx-auto">
              Get 10 free minutes when you sign up. Then pay only ₹1 per minute
              transcribed.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              disabled={isLoading}
              className="btn btn-lg bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Sign Up Free
            </button>
            <p className="text-sm text-blue-200 mt-4">
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-slate-700">AudioScribe</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link
                to="/privacy"
                className="text-slate-500 hover:text-slate-700"
              >
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-slate-500 hover:text-slate-700">
                Terms of Service
              </Link>
              <Link
                to="/contact"
                className="text-slate-500 hover:text-slate-700"
              >
                Contact Us
              </Link>
            </div>

            <p className="text-sm text-slate-400">
              © 2025 AudioScribe. Powered by OpenAI Whisper.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
