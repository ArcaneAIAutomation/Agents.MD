/**
 * Resend Verification Email Page
 * Allows users to request a new verification email
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Mail, CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';

export default function ResendVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send verification email');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bitcoin-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-bitcoin-black border-2 border-bitcoin-orange">
            <Mail className="w-10 h-10 text-bitcoin-orange" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-bitcoin-white mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Bitcoin Sovereign Technology
          </h1>
          <p className="text-lg text-bitcoin-white-60">
            Resend Verification Email
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 mb-6">
          {status === 'idle' || status === 'sending' ? (
            <>
              <h2 className="text-2xl font-bold text-bitcoin-white mb-4 text-center">
                Request New Verification Email
              </h2>
              
              <p className="text-bitcoin-white-80 mb-6 text-center">
                Enter your email address and we'll send you a new verification link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-bitcoin-white-60 mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={status === 'sending'}
                    className="w-full bg-bitcoin-black text-bitcoin-white border-2 border-bitcoin-orange-20 rounded-lg px-4 py-3 focus:border-bitcoin-orange focus:outline-none focus:ring-2 focus:ring-bitcoin-orange-30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[48px] flex items-center justify-center gap-3"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>Send Verification Email</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-bitcoin-orange-20">
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:scale-105 active:scale-95 min-h-[48px]"
                >
                  Back to Login
                </button>
              </div>
            </>
          ) : status === 'success' ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-bitcoin-orange mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 30px rgba(247, 147, 26, 0.5))' }} />
              <h2 className="text-2xl font-bold text-bitcoin-white mb-3">
                Email Sent!
              </h2>
              <p className="text-bitcoin-white-80 mb-6">
                {message}
              </p>

              <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
                <p className="text-sm text-bitcoin-white-80 text-left">
                  <strong>Next Steps:</strong><br />
                  1. Check your email inbox: <span className="text-bitcoin-orange font-mono">{email}</span><br />
                  2. Look for email from no-reply@arcane.group<br />
                  3. Click the "Verify Email Address" button<br />
                  4. Return to login and access the platform
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-3"
                >
                  <span>Go to Login</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setStatus('idle');
                    setMessage('');
                    setEmail('');
                  }}
                  className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:scale-105 active:scale-95 min-h-[48px]"
                >
                  Send Another Email
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-bitcoin-orange mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-bitcoin-white mb-3">
                Error
              </h2>
              <p className="text-bitcoin-white-80 mb-6">
                {message}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setStatus('idle');
                    setMessage('');
                  }}
                  className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px]"
                >
                  Try Again
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:scale-105 active:scale-95 min-h-[48px]"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-bitcoin-white-60">
            © 2025 Bitcoin Sovereign Technology • Secure Authentication Platform
          </p>
        </div>
      </div>
    </div>
  );
}
