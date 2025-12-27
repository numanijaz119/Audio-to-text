import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Music,
  ArrowLeft,
  FileText,
  Scale,
  CreditCard,
  Shield,
  AlertTriangle,
  Users,
} from "lucide-react";

export default function TermsOfServicePage() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-800">
                AudioScribe
              </span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Scale className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="heading-xl text-slate-900 mb-4">Terms of Service</h1>
            <p className="text-xl text-slate-500 font-light">
              Please read these terms carefully before using AudioScribe.
            </p>
            <p className="text-sm text-slate-400 mt-4">
              Last updated: December 27, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate max-w-none">
            <div className="card-base p-8 md:p-12 space-y-8">
              {/* Agreement */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Agreement to Terms
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  By accessing and using AudioScribe ("Service"), you accept and
                  agree to be bound by the terms and provision of this
                  agreement. If you do not agree to abide by the above, please
                  do not use this service. AudioScribe is owned and operated by
                  AudioScribe Inc. ("Company", "we", "us", or "our").
                </p>
              </section>

              {/* Service Description */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Service Description
                </h2>
                <p className="text-slate-600 mb-4">
                  AudioScribe provides AI-powered audio transcription services
                  that convert audio files into text. Our service includes:
                </p>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • Audio file upload and processing (MP3, WAV, M4A, FLAC, OGG
                    formats)
                  </li>
                  <li>
                    • AI-powered transcription using OpenAI Whisper and
                    AssemblyAI
                  </li>
                  <li>
                    • Multi-language support (English, Hindi, and
                    auto-detection)
                  </li>
                  <li>• Transcription history and management</li>
                  <li>• Secure payment processing through Razorpay</li>
                  <li>• Account management and usage tracking</li>
                </ul>
              </section>

              {/* User Accounts */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  User Accounts
                </h2>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Account Creation
                </h3>
                <ul className="text-slate-600 space-y-2 mb-6">
                  <li>
                    • You must create an account using Google or Facebook OAuth
                    to use our service
                  </li>
                  <li>
                    • You must provide accurate and complete information during
                    registration
                  </li>
                  <li>
                    • You are responsible for maintaining the security of your
                    account
                  </li>
                  <li>
                    • You must be at least 13 years old to create an account
                  </li>
                </ul>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Account Responsibilities
                </h3>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • You are responsible for all activities that occur under
                    your account
                  </li>
                  <li>
                    • You must notify us immediately of any unauthorized use of
                    your account
                  </li>
                  <li>
                    • You may not share your account credentials with others
                  </li>
                  <li>
                    • You may not create multiple accounts to circumvent service
                    limitations
                  </li>
                </ul>
              </section>

              {/* Acceptable Use */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  Acceptable Use Policy
                </h2>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Permitted Uses
                </h3>
                <ul className="text-slate-600 space-y-2 mb-6">
                  <li>
                    • Transcribing your own audio content or content you have
                    permission to transcribe
                  </li>
                  <li>
                    • Using transcriptions for personal, educational, or
                    business purposes
                  </li>
                  <li>
                    • Accessing the service through our official website and API
                  </li>
                </ul>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Prohibited Uses
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 font-medium mb-2">
                        You may NOT use our service to:
                      </p>
                      <ul className="text-red-700 space-y-1 text-sm">
                        <li>
                          • Upload copyrighted content without proper
                          authorization
                        </li>
                        <li>
                          • Process illegal, harmful, or offensive content
                        </li>
                        <li>• Violate any applicable laws or regulations</li>
                        <li>• Infringe on intellectual property rights</li>
                        <li>• Upload malware, viruses, or malicious code</li>
                        <li>
                          • Attempt to reverse engineer or hack our service
                        </li>
                        <li>• Use automated tools to abuse our service</li>
                        <li>
                          • Resell or redistribute our service without
                          permission
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  Payment Terms
                </h2>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Pricing
                </h3>
                <ul className="text-slate-600 space-y-2 mb-6">
                  <li>• New users receive 10 free minutes of transcription</li>
                  <li>• Additional transcription costs ₹1 per minute</li>
                  <li>• Pricing is subject to change with 30 days notice</li>
                  <li>
                    • All prices are in Indian Rupees (INR) and include
                    applicable taxes
                  </li>
                </ul>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Payment Processing
                </h3>
                <ul className="text-slate-600 space-y-2 mb-6">
                  <li>• Payments are processed securely through Razorpay</li>
                  <li>
                    • You must add funds to your wallet before transcribing
                  </li>
                  <li>
                    • Charges are deducted from your wallet balance
                    automatically
                  </li>
                  <li>• We do not store your payment card information</li>
                </ul>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Refunds
                </h3>
                <ul className="text-slate-600 space-y-2">
                  <li>• Wallet credits are non-refundable once added</li>
                  <li>
                    • Refunds may be considered for technical failures on our
                    part
                  </li>
                  <li>
                    • Refund requests must be made within 7 days of the
                    transaction
                  </li>
                  <li>• Contact our support team for refund requests</li>
                </ul>
              </section>

              {/* Content and Intellectual Property */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Content and Intellectual Property
                </h2>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Your Content
                </h3>
                <ul className="text-slate-600 space-y-2 mb-6">
                  <li>
                    • You retain ownership of your audio files and
                    transcriptions
                  </li>
                  <li>
                    • You grant us temporary rights to process your audio for
                    transcription
                  </li>
                  <li>
                    • Audio files are automatically deleted within 24 hours
                  </li>
                  <li>
                    • You are responsible for ensuring you have rights to upload
                    content
                  </li>
                </ul>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Our Service
                </h3>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • AudioScribe and its technology are protected by
                    intellectual property laws
                  </li>
                  <li>• You may not copy, modify, or distribute our service</li>
                  <li>• Our trademarks and logos are our exclusive property</li>
                  <li>• We reserve all rights not expressly granted to you</li>
                </ul>
              </section>

              {/* Service Availability */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Service Availability
                </h2>
                <p className="text-slate-600 mb-4">
                  We strive to provide reliable service, but we cannot guarantee
                  100% uptime. Our service may be temporarily unavailable due
                  to:
                </p>
                <ul className="text-slate-600 space-y-2">
                  <li>• Scheduled maintenance and updates</li>
                  <li>• Technical difficulties or server issues</li>
                  <li>
                    • Third-party service dependencies (OpenAI, AssemblyAI,
                    Razorpay)
                  </li>
                  <li>• Force majeure events beyond our control</li>
                </ul>
                <p className="text-slate-600 mt-4">
                  We will make reasonable efforts to notify users of planned
                  maintenance in advance.
                </p>
              </section>

              {/* Privacy and Data */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Privacy and Data Protection
                </h2>
                <p className="text-slate-600 mb-4">
                  Your privacy is important to us. Please review our{" "}
                  <Link
                    to="/privacy"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Privacy Policy
                  </Link>
                  to understand how we collect, use, and protect your
                  information.
                </p>
                <ul className="text-slate-600 space-y-2">
                  <li>• We implement industry-standard security measures</li>
                  <li>• Audio files are encrypted and automatically deleted</li>
                  <li>
                    • We comply with applicable data protection regulations
                  </li>
                  <li>
                    • You can request deletion of your account and data at any
                    time
                  </li>
                </ul>
              </section>

              {/* Disclaimers */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Disclaimers and Limitations
                </h2>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Service Accuracy
                </h3>
                <p className="text-slate-600 mb-4">
                  While we strive for high accuracy, AI transcription is not
                  perfect. Accuracy may vary based on:
                </p>
                <ul className="text-slate-600 space-y-2 mb-6">
                  <li>• Audio quality and clarity</li>
                  <li>• Speaker accents and pronunciation</li>
                  <li>• Background noise and audio conditions</li>
                  <li>• Technical terminology and proper nouns</li>
                </ul>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Limitation of Liability
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <p className="text-amber-800 text-sm">
                    <strong>IMPORTANT:</strong> Our service is provided "as is"
                    without warranties. We are not liable for any damages
                    arising from the use of our service, including but not
                    limited to data loss, business interruption, or inaccurate
                    transcriptions. Our total liability is limited to the amount
                    you paid for the service in the past 12 months.
                  </p>
                </div>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Account Termination
                </h2>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Termination by You
                </h3>
                <ul className="text-slate-600 space-y-2 mb-6">
                  <li>
                    • You may delete your account at any time through your
                    account settings
                  </li>
                  <li>
                    • Unused wallet credits will be forfeited upon account
                    deletion
                  </li>
                  <li>
                    • Your transcription history will be permanently deleted
                  </li>
                </ul>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Termination by Us
                </h3>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • We may suspend or terminate accounts that violate these
                    terms
                  </li>
                  <li>
                    • We may terminate accounts for non-payment or fraudulent
                    activity
                  </li>
                  <li>
                    • We will provide reasonable notice before termination when
                    possible
                  </li>
                  <li>• We reserve the right to refuse service to anyone</li>
                </ul>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Changes to Terms
                </h2>
                <p className="text-slate-600">
                  We may update these Terms of Service from time to time. We
                  will notify users of significant changes by email or through
                  our service. Continued use of the service after changes
                  constitutes acceptance of the new terms. We encourage you to
                  review these terms periodically.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Governing Law
                </h2>
                <p className="text-slate-600">
                  These Terms of Service are governed by and construed in
                  accordance with the laws of India. Any disputes arising from
                  these terms or the use of our service will be subject to the
                  exclusive jurisdiction of the courts in Mumbai, India.
                </p>
              </section>

              {/* Contact Information */}
              <section className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Contact Information
                </h2>
                <p className="text-slate-600 mb-4">
                  If you have any questions about these Terms of Service, please
                  contact us:
                </p>
                <div className="bg-slate-50 rounded-lg p-6">
                  <p className="text-slate-700 mb-2">
                    <strong>Email:</strong>{" "}
                    {import.meta.env.VITE_SUPPORT_EMAIL ||
                      "support@audioscribe.com"}
                  </p>
                  <p className="text-slate-700 mb-2">
                    <strong>Support:</strong>{" "}
                    <Link
                      to="/contact"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Contact Form
                    </Link>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-100 bg-slate-50">
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
              <Link
                to="/terms"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
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
              © 2025 AudioScribe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
