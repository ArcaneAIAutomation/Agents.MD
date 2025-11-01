/**
 * Email Verification Pending Component
 * Shows after registration, prompts user to check email
 */

import { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailVerificationPendingProps {
  email: string;
  onResend: () => Promise<void>;
  onBackToLogin: () => void;
}

export default function EmailVerificationPending({ 
  email, 
  onResend, 
  onBackToLogin 
}: EmailVerificationPendingProps) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setResent(false);

    try {
      await onResend();
      setResent(true);
      
      // Reset success message after 5 seconds
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-bitcoin-black border-2 border-bitcoin-orange">
          <Mail className="w-10 h-10 text-bitcoin-orange" style={{ filter: 'drop-shadow(0 0 20px rgba(247, 147, 26, 0.5))' }} />
        </div>
        <h2 className="text-3xl font-bold text-bitcoin-white mb-3">
          Check Your Email
        </h2>
        <p className="text-bitcoin-white-60">
          We've sent a verification link to verify your account
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 mb-6">
        {/* Email Display */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
          <p className="text-sm text-bitcoin-white-60 mb-1">Verification email sent to:</p>
          <p className="text-bitcoin-orange font-mono font-semibold break-all">{email}</p>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-bitcoin-orange text-bitcoin-black flex items-center justify-center text-sm font-bold">
              1
            </div>
            <p className="text-bitcoin-white-80 text-sm">
              Check your inbox for an email from Bitcoin Sovereign Technology
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-bitcoin-orange text-bitcoin-black flex items-center justify-center text-sm font-bold">
              2
            </div>
            <p className="text-bitcoin-white-80 text-sm">
              Click the verification link in the email
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-bitcoin-orange text-bitcoin-black flex items-center justify-center text-sm font-bold">
              3
            </div>
            <p className="text-bitcoin-white-80 text-sm">
              Return here and log in with your credentials
            </p>
          </div>
        </div>

        {/* Warning Box */}
        <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
          <p className="text-sm text-bitcoin-white-80">
            <strong className="text-bitcoin-orange">⚠️ Important:</strong><br />
            You must verify your email before you can log in. The verification link expires in 24 hours.
          </p>
        </div>

        {/* Success/Error Messages */}
        {resent && (
          <div className="flex items-center gap-2 p-4 bg-bitcoin-black border border-bitcoin-orange rounded-lg mb-4">
            <CheckCircle className="w-5 h-5 text-bitcoin-orange flex-shrink-0" />
            <p className="text-sm text-bitcoin-white-80">
              Verification email resent successfully! Check your inbox.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-bitcoin-black border border-bitcoin-orange rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-bitcoin-orange flex-shrink-0" />
            <p className="text-sm text-bitcoin-white-80">{error}</p>
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {resending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : resent ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Email Sent</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              <span>Resend Verification Email</span>
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
        <p className="text-sm text-bitcoin-white-60 mb-2">
          <strong className="text-bitcoin-white-80">Didn't receive the email?</strong>
        </p>
        <ul className="text-sm text-bitcoin-white-60 space-y-1 list-disc list-inside">
          <li>Check your spam or junk folder</li>
          <li>Make sure {email} is correct</li>
          <li>Wait a few minutes and check again</li>
          <li>Click "Resend" to get a new email</li>
        </ul>
      </div>

      {/* Back to Login */}
      <div className="text-center">
        <button
          onClick={onBackToLogin}
          className="text-sm text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}
