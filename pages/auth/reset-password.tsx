/**
 * Reset Password Page
 * 
 * Allows users to reset their password using a token from email.
 */

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL query parameter
    if (router.isReady) {
      const { token: tokenParam } = router.query;
      
      if (typeof tokenParam === 'string' && tokenParam) {
        // Validate token format (64 hex characters)
        if (/^[a-f0-9]{64}$/i.test(tokenParam)) {
          setToken(tokenParam);
        } else {
          setError('Invalid reset token format');
        }
      } else {
        setError('No reset token provided');
      }
    }
  }, [router.isReady, router.query]);

  if (error) {
    return (
      <div className="min-h-screen bg-bitcoin-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
                Invalid Reset Link
              </h2>
            </div>

            <div className="bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg p-4 mb-6">
              <p className="text-bitcoin-orange text-center">
                {error}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]"
              >
                Request New Reset Link
              </button>

              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-bitcoin-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-bitcoin-white-80">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bitcoin-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ResetPasswordForm
          token={token}
          onSuccess={() => {
            // Success message and redirect handled in form
          }}
        />
      </div>
    </div>
  );
}
