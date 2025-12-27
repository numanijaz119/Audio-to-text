import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Music,
  ArrowLeft,
  Mail,
  Send,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactUsPage() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject ||
      formData.subject === "" ||
      !formData.message.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000/api"
        }/contact/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        await response.json();
        setIsSubmitted(true);
        toast.success(
          "Message sent successfully! We'll respond within 24 hours."
        );
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        const errorData = await response.json();

        // Build detailed error message
        let errorMessage = "Failed to send message. Please try again.";

        if (errorData.details) {
          // Handle validation errors from backend
          const details = errorData.details;
          const errorMessages = [];

          if (details.message) {
            errorMessages.push(
              Array.isArray(details.message)
                ? details.message[0]
                : details.message
            );
          }
          if (details.email) {
            errorMessages.push(
              Array.isArray(details.email) ? details.email[0] : details.email
            );
          }
          if (details.name) {
            errorMessages.push(
              Array.isArray(details.name) ? details.name[0] : details.name
            );
          }
          if (details.subject) {
            errorMessages.push(
              Array.isArray(details.subject)
                ? details.subject[0]
                : details.subject
            );
          }

          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join(" ");
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectOptions = [
    { value: "", label: "Select a subject..." },
    { value: "general", label: "General Inquiry" },
    { value: "technical", label: "Technical Support" },
    { value: "billing", label: "Billing & Payments" },
    { value: "feature", label: "Feature Request" },
    { value: "bug", label: "Bug Report" },
    { value: "other", label: "Other" },
  ];

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
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="heading-xl text-slate-900 mb-4">Contact Us</h1>
            <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
              Have a question or need help? We're here to assist you. Send us a
              message and we'll get back to you soon.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="card-base p-8">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                      Message Sent!
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Thank you for contacting us. We've received your message
                      and will get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                      Send us a message
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name and Email Row */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-slate-700 mb-2"
                          >
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Your full name"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-slate-700 mb-2"
                          >
                            Email Address *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="your.email@example.com"
                            required
                          />
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label
                          htmlFor="subject"
                          className="block text-sm font-medium text-slate-700 mb-2"
                        >
                          Subject *
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          required
                        >
                          {subjectOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label
                          htmlFor="message"
                          className="block text-sm font-medium text-slate-700 mb-2"
                        >
                          Message *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={6}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                          placeholder="Please describe your question or issue in detail..."
                          required
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex items-center justify-between pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn btn-primary flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-1">
              {/* Contact Details */}
              <div className="card-base p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Get in Touch
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">Support Email</p>
                    <p className="text-slate-600">
                      {import.meta.env.VITE_SUPPORT_EMAIL ||
                        "support@audioscribe.com"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="card-base p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Response Time
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium text-slate-700">
                        All Inquiries
                      </p>
                      <p className="text-slate-600">Within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Link */}
              <div className="card-base p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Quick Help
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-700">
                        How accurate is the transcription?
                      </p>
                      <p className="text-slate-600">
                        Our AI achieves 95%+ accuracy on clear audio.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-700">
                        What file formats are supported?
                      </p>
                      <p className="text-slate-600">
                        MP3, WAV, M4A, FLAC, and OGG up to 100MB.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-700">
                        How long does transcription take?
                      </p>
                      <p className="text-slate-600">
                        Usually a few seconds to a minute depending on file
                        length.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
              <Link to="/terms" className="text-slate-500 hover:text-slate-700">
                Terms of Service
              </Link>
              <Link
                to="/contact"
                className="text-blue-600 hover:text-blue-700 font-medium"
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
