/**
 * Forgot Password Form Component
 * 
 * Allows users to request a password reset email.
 */

import { useState } from 'react';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onCancel }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
            Check Your Email
          </h2>
        </div>

        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
          <p className="text-bitcoin-white-80 text-center mb-4">
            If an account exists with <strong className="text-bitcoin-orange">{email}</strong>, 
            you will receive a password reset link shortly.
          </p>
          <p className="text-bitcoin-white-60 text-sm text-center">
            The link will expire in <strong className="text-bitcoin-orange">1 hour</strong>.
          </p>
        </div>

        <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
          <p className="text-bitcoin-white-80 text-sm">
            <strong className="text-bitcoin-orange">💡 Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
          </p>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black"
          >
            Back to Login
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
          🔐 Forgot Password?
        </h2>
        <p className="text-bitcoin-white-60">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg p-4">
            <p className="text-bitcoin-orange text-sm">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-bitcoin-white-60 text-sm font-semibold mb-2 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full bg-bitcoin-black text-bitcoin-white border-2 border-bitcoin-orange-20 rounded-lg px-4 py-3 focus:border-bitcoin-orange focus:outline-none transition-colors disabled:opacity-50"
            placeholder="your@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-bitcoin-orange-20">
        <p className="text-bitcoin-white-60 text-sm text-center">
          Remember your password?{' '}
          <a href="/auth/login" className="text-bitcoin-orange hover:underline font-semibold">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
