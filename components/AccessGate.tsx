import { useState, useEffect } from 'react';
import { Lock, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import RegistrationForm from './auth/RegistrationForm';
import LoginForm from './auth/LoginForm';
import EmailVerificationPending from './auth/EmailVerificationPending';

interface AccessGateProps {
  onAccessGranted?: () => void;
}

export default function AccessGate({ onAccessGranted }: AccessGateProps) {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    error: authError, 
    clearError,
    pendingVerificationEmail,
    resendVerification,
    clearPendingVerification
  } = useAuth();
  
  // Mode state: 'initial', 'register', 'login', 'request-access'
  const [mode, setMode] = useState<'initial' | 'register' | 'login' | 'request-access'>('initial');
  
  // Success/error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Request access form state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    telegram: '',
    twitter: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Hide AccessGate if user is authenticated
  useEffect(() => {
    if (isAuthenticated && onAccessGranted) {
      onAccessGranted();
    }
  }, [isAuthenticated, onAccessGranted]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, clearError]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Don't render if authenticated
  if (isAuthenticated) {
    return null;
  }

  // Show verification pending if email is waiting for verification
  if (pendingVerificationEmail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bitcoin-black">
        <div className="w-full max-w-6xl mx-auto px-4 py-8 overflow-y-auto max-h-screen">
          <EmailVerificationPending
            email={pendingVerificationEmail}
            onResend={async () => {
              await resendVerification(pendingVerificationEmail);
            }}
            onBackToLogin={() => {
              clearPendingVerification();
              setMode('login');
            }}
          />
        </div>
      </div>
    );
  }

  // Handle successful registration
  const handleRegistrationSuccess = () => {
    // Show verification pending screen (handled by pendingVerificationEmail state)
    setMode('initial'); // Reset mode to show verification pending
  };

  // Handle registration error
  const handleRegistrationError = (error: string) => {
    setErrorMessage(error);
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setSuccessMessage('Welcome back! Redirecting to platform...');
    // Authentication is handled by AuthProvider, which will hide the AccessGate
  };

  // Handle login error
  const handleLoginError = (error: string) => {
    setErrorMessage(error);
  };

  // Switch to login mode
  const switchToLogin = () => {
    setMode('login');
    setErrorMessage(null);
    setSuccessMessage(null);
    clearError();
  };

  // Switch to register mode
  const switchToRegister = () => {
    setMode('register');
    setErrorMessage(null);
    setSuccessMessage(null);
    clearError();
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Telegram validation
    if (!formData.telegram.trim()) {
      errors.telegram = 'Telegram handle is required';
    } else if (!formData.telegram.startsWith('@')) {
      errors.telegram = 'Telegram handle must start with @';
    }
    
    // Twitter validation
    if (!formData.twitter.trim()) {
      errors.twitter = 'Twitter/X account is required';
    } else if (!formData.twitter.startsWith('@')) {
      errors.twitter = 'Twitter/X handle must start with @';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        const error = await response.json();
        setFormErrors({ submit: error.message || 'Failed to submit application. Please try again.' });
      }
    } catch (error) {
      setFormErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bitcoin-black">
      <div className="w-full max-w-6xl mx-auto px-4 py-8 overflow-y-auto max-h-screen">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-bitcoin-black border-2 border-bitcoin-orange">
            <Lock className="w-10 h-10 text-bitcoin-orange" style={{ filter: 'drop-shadow(0 0 20px rgba(247, 147, 26, 0.5))' }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-bitcoin-white mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Bitcoin Sovereign Technology
          </h1>
          <p className="text-lg text-bitcoin-white-60">
            Secure Authentication Required
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-bitcoin-orange flex-shrink-0 mt-0.5" />
              <p className="text-sm text-bitcoin-white-80">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {(errorMessage || authError) && (
          <div className="mb-6 p-4 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-bitcoin-orange flex-shrink-0 mt-0.5" />
              <p className="text-sm text-bitcoin-white-80">{errorMessage || authError}</p>
            </div>
          </div>
        )}

        {/* Initial Mode - Choose Option */}
        {mode === 'initial' && (
          <div className="max-w-md mx-auto">
            <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-8">
              <p className="text-center text-bitcoin-white-80 mb-6">
                Choose an option to access the platform:
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={switchToRegister}
                  className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-3"
                  disabled={authLoading}
                >
                  <Lock className="w-5 h-5" />
                  Register with Access Code
                </button>
                
                <button
                  onClick={switchToLogin}
                  className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-3"
                  disabled={authLoading}
                >
                  <CheckCircle className="w-5 h-5" />
                  I Already Have an Account
                </button>
                
                <button
                  onClick={() => setMode('request-access')}
                  className="w-full bg-transparent text-bitcoin-white-60 border-2 border-bitcoin-orange-20 font-semibold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:border-bitcoin-orange hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)] hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-3"
                  disabled={authLoading}
                >
                  <Mail className="w-5 h-5" />
                  Request Early Access
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Mode */}
        {mode === 'register' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-8">
              <RegistrationForm
                onSuccess={handleRegistrationSuccess}
                onError={handleRegistrationError}
                onSwitchToLogin={switchToLogin}
              />
              
              {/* Back Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setMode('initial');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    clearError();
                  }}
                  className="text-sm text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
                  disabled={authLoading}
                >
                  ← Back to Options
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Mode */}
        {mode === 'login' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-8">
              <LoginForm
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                onSwitchToRegister={switchToRegister}
              />
              
              {/* Back Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setMode('initial');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    clearError();
                  }}
                  className="text-sm text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
                  disabled={authLoading}
                >
                  ← Back to Options
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Access Mode */}
        {mode === 'request-access' && !submitted && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
                  Request Early Access
                </h2>
                <p className="text-sm text-bitcoin-white-60">
                  Fill out the form below and we'll review your application
                </p>
              </div>
              
              <form onSubmit={handleApplicationSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-bitcoin-white-80 mb-2">
                    Email Address <span className="text-bitcoin-orange">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-bitcoin-black text-bitcoin-white border-2 border-bitcoin-orange-20 rounded-lg transition-all duration-300 focus:outline-none focus:border-bitcoin-orange"
                    required
                    disabled={submitting}
                  />
                  {formErrors.email && (
                    <div className="flex items-center gap-1 mt-2 text-bitcoin-orange text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{formErrors.email}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="telegram" className="block text-sm font-semibold text-bitcoin-white-80 mb-2">
                    Telegram Handle <span className="text-bitcoin-orange">*</span>
                  </label>
                  <input
                    id="telegram"
                    type="text"
                    value={formData.telegram}
                    onChange={(e) => handleInputChange('telegram', e.target.value)}
                    placeholder="@yourusername"
                    className="w-full px-4 py-3 bg-bitcoin-black text-bitcoin-white border-2 border-bitcoin-orange-20 rounded-lg transition-all duration-300 focus:outline-none focus:border-bitcoin-orange"
                    required
                    disabled={submitting}
                  />
                  {formErrors.telegram && (
                    <div className="flex items-center gap-1 mt-2 text-bitcoin-orange text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{formErrors.telegram}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="twitter" className="block text-sm font-semibold text-bitcoin-white-80 mb-2">
                    Twitter/X Account <span className="text-bitcoin-orange">*</span>
                  </label>
                  <input
                    id="twitter"
                    type="text"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    placeholder="@yourusername"
                    className="w-full px-4 py-3 bg-bitcoin-black text-bitcoin-white border-2 border-bitcoin-orange-20 rounded-lg transition-all duration-300 focus:outline-none focus:border-bitcoin-orange"
                    required
                    disabled={submitting}
                  />
                  {formErrors.twitter && (
                    <div className="flex items-center gap-1 mt-2 text-bitcoin-orange text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{formErrors.twitter}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-bitcoin-white-80 mb-2">
                    Message to Developers <span className="text-bitcoin-white-60">(Optional)</span>
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Tell us why you'd like early access..."
                    className="w-full px-4 py-3 bg-bitcoin-black text-bitcoin-white border-2 border-bitcoin-orange-20 rounded-lg transition-all duration-300 focus:outline-none focus:border-bitcoin-orange resize-none"
                    rows={4}
                    disabled={submitting}
                  />
                </div>
                
                {formErrors.submit && (
                  <div className="flex items-center gap-1 text-bitcoin-orange text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{formErrors.submit}</span>
                  </div>
                )}
                
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-bitcoin-black border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Application
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setMode('initial');
                      setFormData({ email: '', telegram: '', twitter: '', message: '' });
                      setFormErrors({});
                    }}
                    className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:scale-105 active:scale-95 min-h-[48px]"
                    disabled={submitting}
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Message for Request Access */}
        {mode === 'request-access' && submitted && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-8 text-center">
              <CheckCircle className="w-20 h-20 text-bitcoin-orange mx-auto mb-6" style={{ filter: 'drop-shadow(0 0 30px rgba(247, 147, 26, 0.5))' }} />
              <h2 className="text-3xl font-bold text-bitcoin-white mb-4">
                Application Submitted!
              </h2>
              <p className="text-bitcoin-white-80 mb-6 max-w-md mx-auto">
                Thank you for your interest in Bitcoin Sovereign Technology. We've received your application and will review it shortly. 
                You'll receive an email at <span className="text-bitcoin-orange font-mono">{formData.email}</span> with further instructions.
              </p>
              <button
                onClick={() => {
                  setMode('initial');
                  setSubmitted(false);
                  setFormData({ email: '', telegram: '', twitter: '', message: '' });
                }}
                className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:scale-105 active:scale-95 min-h-[48px]"
              >
                Back to Options
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-bitcoin-white-60">
            © 2025 Bitcoin Sovereign Technology • Secure Authentication Platform
          </p>
        </div>
      </div>
    </div>
  );
}
