/**
 * Reset Password Form Component
 * 
 * Allows users to set a new password using a reset token.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
}

export default function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    });
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (!passwordStrength.length || !passwordStrength.uppercase || 
        !passwordStrength.lowercase || !passwordStrength.number) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
            Password Reset Successful!
          </h2>
        </div>

        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
          <p className="text-bitcoin-white-80 text-center mb-4">
            Your password has been reset successfully.
          </p>
          <p className="text-bitcoin-white-60 text-sm text-center">
            Redirecting to login page in 3 seconds...
          </p>
        </div>

        <button
          onClick={() => router.push('/auth/login')}
          className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
          🔐 Reset Your Password
        </h2>
        <p className="text-bitcoin-white-60">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg p-4">
            <p className="text-bitcoin-orange text-sm">{error}</p>
          </div>
        )}

        {/* New Password */}
        <div>
          <label htmlFor="password" className="block text-bitcoin-white-60 text-sm font-semibold mb-2 uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-bitcoin-black text-bitcoin-white border-2 border-bitcoin-orange-20 rounded-lg px-4 py-3 pr-12 focus:border-bitcoin-orange focus:outline-none transition-colors disabled:opacity-50"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Password Strength Indicators */}
        {password && (
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 space-y-2">
            <p className="text-bitcoin-white-60 text-sm font-semibold mb-2">Password Requirements:</p>
            <div className="space-y-1">
              <div className={`flex items-center text-sm ${passwordStrength.length ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                <span className="mr-2">{passwordStrength.length ? '✓' : '○'}</span>
                At least 8 characters
              </div>
              <div className={`flex items-center text-sm ${passwordStrength.uppercase ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                <span className="mr-2">{passwordStrength.uppercase ? '✓' : '○'}</span>
                One uppercase letter
              </div>
              <div className={`flex items-center text-sm ${passwordStrength.lowercase ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                <span className="mr-2">{passwordStrength.lowercase ? '✓' : '○'}</span>
                One lowercase letter
              </div>
              <div className={`flex items-center text-sm ${passwordStrength.number ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                <span className="mr-2">{passwordStrength.number ? '✓' : '○'}</span>
                One number
              </div>
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-bitcoin-white-60 text-sm font-semibold mb-2 uppercase tracking-wider">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-bitcoin-black text-bitcoin-white border-2 border-bitcoin-orange-20 rounded-lg px-4 py-3 pr-12 focus:border-bitcoin-orange focus:outline-none transition-colors disabled:opacity-50"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Password Match Indicator */}
        {confirmPassword && (
          <div className={`text-sm ${password === confirmPassword ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
            {password === confirmPassword ? '✓ Passwords match' : '○ Passwords do not match'}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword || password !== confirmPassword}
          className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>
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
