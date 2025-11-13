import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (password: string) => Promise<boolean>;
}

const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export default function UnlockModal({ isOpen, onClose, onUnlock }: UnlockModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  // Check rate limiting
  useEffect(() => {
    const now = Date.now();
    const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
    
    if (recentAttempts.length >= RATE_LIMIT_ATTEMPTS) {
      setIsLocked(true);
      const oldestAttempt = Math.min(...recentAttempts);
      const unlockTime = oldestAttempt + RATE_LIMIT_WINDOW_MS;
      setLockTimeRemaining(Math.ceil((unlockTime - now) / 1000));
    } else {
      setIsLocked(false);
      setLockTimeRemaining(0);
    }
  }, [attempts]);

  // Countdown timer for lock
  useEffect(() => {
    if (lockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setLockTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTimeRemaining === 0) {
      // Clear old attempts when lock expires
      const now = Date.now();
      setAttempts(prev => prev.filter(time => now - time < RATE_LIMIT_WINDOW_MS));
      setIsLocked(false);
    }
  }, [lockTimeRemaining, isLocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`Too many attempts. Try again in ${formatTime(lockTimeRemaining)}`);
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await onUnlock(password);
      
      if (success) {
        setPassword('');
        setError('');
        setAttempts([]);
        onClose();
      } else {
        // Record failed attempt
        setAttempts(prev => [...prev, Date.now()]);
        setError('Incorrect password. Please try again.');
        setPassword('');
        
        // Check if this was the 5th attempt
        const now = Date.now();
        const recentAttempts = [...attempts, now].filter(time => now - time < RATE_LIMIT_WINDOW_MS);
        if (recentAttempts.length >= RATE_LIMIT_ATTEMPTS) {
          setError(`Too many failed attempts. Locked for 15 minutes.`);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Unlock error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6 w-full max-w-md relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
            Unlock Trade Engine
          </h2>
          <p className="text-bitcoin-white-60 text-sm">
            Enter the password to access AI-powered trade signal generation
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password input */}
          <div>
            <label htmlFor="password" className="block text-bitcoin-white-80 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isLocked}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-3 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter password"
              autoFocus
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-3">
              <p className="text-bitcoin-orange text-sm font-semibold">
                {error}
              </p>
            </div>
          )}

          {/* Rate limit info */}
          {!isLocked && attempts.length > 0 && attempts.length < RATE_LIMIT_ATTEMPTS && (
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
              <p className="text-bitcoin-white-60 text-xs">
                {RATE_LIMIT_ATTEMPTS - attempts.length} attempts remaining before 15-minute lockout
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || isLocked || !password.trim()}
            className="w-full bg-bitcoin-orange text-bitcoin-black font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bitcoin-orange disabled:hover:text-bitcoin-black disabled:hover:shadow-none"
          >
            {isLoading ? 'Verifying...' : isLocked ? `Locked (${formatTime(lockTimeRemaining)})` : 'Unlock'}
          </button>
        </form>

        {/* Help text */}
        <div className="mt-6 pt-4 border-t border-bitcoin-orange-20">
          <p className="text-bitcoin-white-60 text-xs text-center">
            Contact support if you've forgotten your password
          </p>
        </div>
      </div>
    </div>
  );
}
