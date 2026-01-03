import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Music,
  ArrowLeft,
  Shield,
  Eye,
  Database,
  Lock,
  Mail,
  Clock,
} from "lucide-react";

export default function PrivacyPolicyPage() {
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
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="heading-xl text-slate-900 mb-4">Privacy Policy</h1>
            <p className="text-xl text-slate-500 font-light">
              Your privacy is important to us. Learn how we collect, use, and
              protect your data.
            </p>
            <p className="text-sm text-slate-400 mt-4">
              Last updated: December 27, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate max-w-none">
            <div className="card-base p-8 md:p-12 space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <Eye className="w-6 h-6 text-blue-600" />
                  Introduction
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  AudioScribe ("we," "our," or "us") is committed to protecting
                  your privacy. This Privacy Policy explains how we collect,
                  use, disclose, and safeguard your information when you use our
                  audio transcription service. By using AudioScribe, you agree
                  to the collection and use of information in accordance with
                  this policy.
                </p>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <Database className="w-6 h-6 text-blue-600" />
                  Information We Collect
                </h2>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Personal Information
                </h3>
                <ul className="text-slate-600 space-y-2 mb-6">
                  <li>
                    • <strong>Account Information:</strong> Name, email address,
                    and profile picture from OAuth providers (Google, Facebook)
                  </li>
                  <li>
                    • <strong>Payment Information:</strong> Billing details
                    processed securely through Razorpay (we don't store payment
                    card details)
                  </li>
                  <li>
                    • <strong>Contact Information:</strong> When you contact us
                    through our support channels
                  </li>
                </ul>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Usage Information
                </h3>
                <ul className="text-slate-600 space-y-2 mb-6">
                  <li>
                    • <strong>Audio Files:</strong> Audio files you upload for
                    transcription (temporarily stored and automatically deleted)
                  </li>
                  <li>
                    • <strong>Transcription Data:</strong> Generated text
                    transcriptions and associated metadata
                  </li>
                  <li>
                    • <strong>Usage Statistics:</strong> Service usage patterns,
                    feature interactions, and performance metrics
                  </li>
                  <li>
                    • <strong>Device Information:</strong> Browser type,
                    operating system, IP address, and device identifiers
                  </li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <Lock className="w-6 h-6 text-blue-600" />
                  How We Use Your Information
                </h2>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • <strong>Service Delivery:</strong> Process audio files and
                    generate accurate transcriptions
                  </li>
                  <li>
                    • <strong>Account Management:</strong> Create and maintain
                    your user account and preferences
                  </li>
                  <li>
                    • <strong>Payment Processing:</strong> Handle billing,
                    payments, and transaction history
                  </li>
                  <li>
                    • <strong>Customer Support:</strong> Respond to inquiries
                    and provide technical assistance
                  </li>
                  <li>
                    • <strong>Service Improvement:</strong> Analyze usage
                    patterns to enhance our features and performance
                  </li>
                  <li>
                    • <strong>Security:</strong> Detect and prevent fraud,
                    abuse, and security threats
                  </li>
                  <li>
                    • <strong>Legal Compliance:</strong> Meet legal obligations
                    and enforce our terms of service
                  </li>
                </ul>
              </section>

              {/* Data Storage and Security */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  Data Storage and Security
                </h2>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Audio File Handling
                </h3>
                <p className="text-slate-600 mb-4">
                  Your audio files are processed securely and automatically
                  deleted from our servers within 24 hours of upload. We use
                  industry-standard encryption during transmission and storage.
                </p>

                <h3 className="text-lg font-medium text-slate-700 mb-3">
                  Data Protection Measures
                </h3>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • <strong>Encryption:</strong> All data is encrypted in
                    transit using TLS/SSL protocols
                  </li>
                  <li>
                    • <strong>Access Controls:</strong> Strict access controls
                    and authentication mechanisms
                  </li>
                  <li>
                    • <strong>Regular Audits:</strong> Periodic security
                    assessments and vulnerability testing
                  </li>
                  <li>
                    • <strong>Data Minimization:</strong> We collect only the
                    data necessary for service operation
                  </li>
                </ul>
              </section>

              {/* Third-Party Services */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Third-Party Services
                </h2>
                <p className="text-slate-600 mb-4">
                  We use trusted third-party services to provide our
                  functionality:
                </p>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • <strong>OpenAI Whisper:</strong> For audio transcription
                    processing
                  </li>
                  <li>
                    • <strong>AssemblyAI:</strong> For additional transcription
                    capabilities
                  </li>
                  <li>
                    • <strong>Razorpay:</strong> For secure payment processing
                  </li>
                  <li>
                    • <strong>Google/Facebook:</strong> For OAuth authentication
                  </li>
                </ul>
                <p className="text-slate-600 mt-4">
                  These services have their own privacy policies and data
                  handling practices. We recommend reviewing their policies to
                  understand how they handle your data.
                </p>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Data Retention
                </h2>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • <strong>Audio Files:</strong> Automatically deleted within
                    24 hours of upload
                  </li>
                  <li>
                    • <strong>Transcriptions:</strong> Retained until you delete
                    them or close your account
                  </li>
                  <li>
                    • <strong>Account Data:</strong> Retained while your account
                    is active and for 30 days after deletion
                  </li>
                  <li>
                    • <strong>Payment Records:</strong> Retained for 7 years for
                    tax and legal compliance
                  </li>
                  <li>
                    • <strong>Usage Logs:</strong> Retained for 90 days for
                    security and performance monitoring
                  </li>
                </ul>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Your Rights
                </h2>
                <p className="text-slate-600 mb-4">
                  You have the following rights regarding your personal data:
                </p>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • <strong>Access:</strong> Request a copy of your personal
                    data
                  </li>
                  <li>
                    • <strong>Correction:</strong> Update or correct inaccurate
                    information
                  </li>
                  <li>
                    • <strong>Deletion:</strong> Request deletion of your
                    account and associated data
                  </li>
                  <li>
                    • <strong>Portability:</strong> Export your transcription
                    data
                  </li>
                  <li>
                    • <strong>Objection:</strong> Object to certain data
                    processing activities
                  </li>
                </ul>
                <p className="text-slate-600 mt-4">
                  To exercise these rights, please contact us at the information
                  provided below.
                </p>
              </section>

              {/* Cookies and Tracking */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Cookies and Tracking
                </h2>
                <p className="text-slate-600 mb-4">
                  We use essential cookies and local storage to maintain your
                  session and preferences. We do not use tracking cookies or
                  third-party analytics that compromise your privacy.
                </p>
                <ul className="text-slate-600 space-y-2">
                  <li>
                    • <strong>Authentication Cookies:</strong> Secure httpOnly
                    cookies to keep you logged in
                  </li>
                  <li>
                    • <strong>Preferences:</strong> To remember your language
                    and interface settings
                  </li>
                  <li>
                    • <strong>Session Data:</strong> To maintain your current
                    session state
                  </li>
                </ul>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Children's Privacy
                </h2>
                <p className="text-slate-600">
                  AudioScribe is not intended for use by children under 13 years
                  of age. We do not knowingly collect personal information from
                  children under 13. If you become aware that a child has
                  provided us with personal information, please contact us
                  immediately.
                </p>
              </section>

              {/* Changes to Privacy Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                  Changes to This Privacy Policy
                </h2>
                <p className="text-slate-600">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the "Last updated" date. We encourage
                  you to review this Privacy Policy periodically for any
                  changes.
                </p>
              </section>

              {/* Contact Information */}
              <section className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                  Contact Us
                </h2>
                <p className="text-slate-600 mb-4">
                  If you have any questions about this Privacy Policy or our
                  data practices, please contact us:
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
                  <p className="text-slate-700">
                    <strong>Response Time:</strong> We aim to respond within 24
                    hours
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
                className="text-blue-600 hover:text-blue-700 font-medium"
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
              © 2025 AudioScribe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
