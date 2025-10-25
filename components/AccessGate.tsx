import { useState } from 'react';
import { Lock, Mail, Send, CheckCircle } from 'lucide-react';

interface AccessGateProps {
  onAccessGranted: () => void;
}

export default function AccessGate({ onAccessGranted }: AccessGateProps) {
  const [mode, setMode] = useState<'initial' | 'code' | 'apply'>('initial');
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Application form state
  const [formData, setFormData] = useState({
    email: '',
    telegram: '',
    twitter: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Valid access codes
  const VALID_CODES = [
    'BITCOIN2025', // Default code
    'BTC-SOVEREIGN-K3QYMQ-01',
    'BTC-SOVEREIGN-AKCJRG-02',
    'BTC-SOVEREIGN-LMBLRN-03',
    'BTC-SOVEREIGN-HZKEI2-04',
    'BTC-SOVEREIGN-WVL0HN-05',
    'BTC-SOVEREIGN-48YDHG-06',
    'BTC-SOVEREIGN-6HSNX0-07',
    'BTC-SOVEREIGN-N99A5R-08',
    'BTC-SOVEREIGN-DCO2DG-09',
    'BTC-SOVEREIGN-BYE9UX-10',
  ];

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const enteredCode = accessCode.trim().toUpperCase();
    const isValid = VALID_CODES.some(code => code.toUpperCase() === enteredCode);
    
    if (isValid) {
      // Store access in sessionStorage
      sessionStorage.setItem('hasAccess', 'true');
      onAccessGranted();
    } else {
      setCodeError('Invalid access code. Please try again or apply for early access.');
    }
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
    <div className="access-gate-overlay">
      <div className="access-gate-container">
        {/* Logo/Header */}
        <div className="access-gate-header">
          <div className="access-gate-logo">
            <Lock className="w-16 h-16 text-bitcoin-orange" style={{ filter: 'drop-shadow(0 0 20px rgba(247, 147, 26, 0.5))' }} />
          </div>
          <h1 className="access-gate-title">
            Bitcoin Sovereign Technology
          </h1>
          <p className="access-gate-subtitle">
            Early Access Required
          </p>
        </div>

        {/* Initial Mode - Choose Option */}
        {mode === 'initial' && (
          <div className="access-gate-content">
            <p className="access-gate-description">
              This platform is currently in early access. Choose an option below to continue:
            </p>
            
            <div className="access-gate-buttons">
              <button
                onClick={() => setMode('code')}
                className="btn-bitcoin-primary btn-bitcoin-full"
              >
                <Lock className="w-5 h-5" />
                Enter Access Code
              </button>
              
              <button
                onClick={() => setMode('apply')}
                className="btn-bitcoin-secondary btn-bitcoin-full"
              >
                <Mail className="w-5 h-5" />
                Apply for Early Access
              </button>
            </div>
          </div>
        )}

        {/* Code Entry Mode */}
        {mode === 'code' && (
          <div className="access-gate-content">
            <form onSubmit={handleCodeSubmit} className="access-gate-form">
              <div className="form-group">
                <label htmlFor="accessCode" className="form-label">
                  Early Access Code
                </label>
                <input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setCodeError('');
                  }}
                  placeholder="Enter your access code"
                  className="form-input"
                  autoFocus
                />
                {codeError && (
                  <p className="form-error">{codeError}</p>
                )}
              </div>
              
              <div className="access-gate-buttons">
                <button
                  type="submit"
                  className="btn-bitcoin-primary btn-bitcoin-full"
                >
                  <CheckCircle className="w-5 h-5" />
                  Verify Code
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setMode('initial');
                    setAccessCode('');
                    setCodeError('');
                  }}
                  className="btn-bitcoin-secondary btn-bitcoin-full"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Application Mode */}
        {mode === 'apply' && !submitted && (
          <div className="access-gate-content">
            <p className="access-gate-description">
              Fill out the form below to request early access. We'll review your application and get back to you soon.
            </p>
            
            <form onSubmit={handleApplicationSubmit} className="access-gate-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="text-bitcoin-orange">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className="form-input"
                  required
                />
                {formErrors.email && (
                  <p className="form-error">{formErrors.email}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="telegram" className="form-label">
                  Telegram Handle <span className="text-bitcoin-orange">*</span>
                </label>
                <input
                  id="telegram"
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => handleInputChange('telegram', e.target.value)}
                  placeholder="@yourusername"
                  className="form-input"
                  required
                />
                {formErrors.telegram && (
                  <p className="form-error">{formErrors.telegram}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="twitter" className="form-label">
                  Twitter/X Account <span className="text-bitcoin-orange">*</span>
                </label>
                <input
                  id="twitter"
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  placeholder="@yourusername"
                  className="form-input"
                  required
                />
                {formErrors.twitter && (
                  <p className="form-error">{formErrors.twitter}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message to Developers <span className="text-bitcoin-white-60">(Optional)</span>
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Tell us why you'd like early access..."
                  className="form-textarea"
                  rows={4}
                />
              </div>
              
              {formErrors.submit && (
                <p className="form-error">{formErrors.submit}</p>
              )}
              
              <div className="access-gate-buttons">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-bitcoin-primary btn-bitcoin-full"
                >
                  {submitting ? (
                    <>
                      <div className="spinner"></div>
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
                  className="btn-bitcoin-secondary btn-bitcoin-full"
                  disabled={submitting}
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success Message */}
        {mode === 'apply' && submitted && (
          <div className="access-gate-content">
            <div className="access-gate-success">
              <CheckCircle className="w-20 h-20 text-bitcoin-orange mb-4" style={{ filter: 'drop-shadow(0 0 30px rgba(247, 147, 26, 0.5))' }} />
              <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
                Application Submitted!
              </h2>
              <p className="text-bitcoin-white-80 mb-6 text-center max-w-md">
                Thank you for your interest in Bitcoin Sovereign Technology. We've received your application and will review it shortly. 
                You'll receive an email at <span className="text-bitcoin-orange font-mono">{formData.email}</span> with further instructions.
              </p>
              <button
                onClick={() => {
                  setMode('initial');
                  setSubmitted(false);
                  setFormData({ email: '', telegram: '', twitter: '', message: '' });
                }}
                className="btn-bitcoin-secondary"
              >
                Back to Options
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="access-gate-footer">
          <p className="text-xs text-bitcoin-white-60 text-center">
            © 2024 Bitcoin Sovereign Technology • Early Access Platform
          </p>
        </div>
      </div>
    </div>
  );
}
