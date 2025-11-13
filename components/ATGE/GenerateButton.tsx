import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Clock } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  isUnlocked?: boolean;
  disabled?: boolean;
  lastGeneratedAt?: Date | null;
  cooldownSeconds?: number;
}

const DEFAULT_COOLDOWN_SECONDS = 60;

export default function GenerateButton({
  onClick,
  isLoading = false,
  isUnlocked = false,
  disabled = false,
  lastGeneratedAt = null,
  cooldownSeconds = DEFAULT_COOLDOWN_SECONDS
}: GenerateButtonProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isInCooldown, setIsInCooldown] = useState(false);

  // Calculate cooldown
  useEffect(() => {
    if (!lastGeneratedAt) {
      setIsInCooldown(false);
      setTimeRemaining(0);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = Date.now();
      const lastGenerated = lastGeneratedAt.getTime();
      const cooldownMs = cooldownSeconds * 1000;
      const elapsed = now - lastGenerated;
      const remaining = Math.max(0, cooldownMs - elapsed);
      
      if (remaining > 0) {
        setIsInCooldown(true);
        setTimeRemaining(Math.ceil(remaining / 1000));
      } else {
        setIsInCooldown(false);
        setTimeRemaining(0);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [lastGeneratedAt, cooldownSeconds]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isDisabled = disabled || isLoading || isInCooldown;

  const getButtonText = () => {
    if (!isUnlocked) {
      return 'Unlock Trade Engine';
    }
    if (isLoading) {
      return 'Generating Signal...';
    }
    if (isInCooldown) {
      return `Cooldown: ${formatTime(timeRemaining)}`;
    }
    return 'Generate Trade Signal';
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 size={20} className="animate-spin" />;
    }
    if (isInCooldown) {
      return <Clock size={20} />;
    }
    return <Sparkles size={20} />;
  };

  return (
    <div className="space-y-3">
      {/* Main button - Mobile Optimized with 48px minimum touch target */}
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`
          w-full px-4 sm:px-6 py-4 min-h-[48px] rounded-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 sm:gap-3
          ${isDisabled
            ? 'bg-bitcoin-black text-bitcoin-white-60 border-2 border-bitcoin-orange-20 cursor-not-allowed opacity-50'
            : 'bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] active:scale-95'
          }
        `}
      >
        {getButtonIcon()}
        <span className="text-sm sm:text-base">{getButtonText()}</span>
      </button>

      {/* Status messages */}
      {isUnlocked && !isLoading && !isInCooldown && (
        <div className="flex items-start gap-2 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
          <Sparkles size={16} className="text-bitcoin-orange flex-shrink-0 mt-0.5" />
          <p className="text-bitcoin-white-60 text-xs">
            Ready to generate a new AI-powered trade signal. Click the button above to start.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-start gap-2 bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-3">
          <Loader2 size={16} className="text-bitcoin-orange flex-shrink-0 mt-0.5 animate-spin" />
          <div>
            <p className="text-bitcoin-orange text-sm font-semibold mb-1">
              Analyzing Market Data
            </p>
            <p className="text-bitcoin-white-60 text-xs">
              Fetching real-time prices, technical indicators, sentiment data, and on-chain metrics...
            </p>
          </div>
        </div>
      )}

      {isInCooldown && (
        <div className="flex items-start gap-2 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
          <Clock size={16} className="text-bitcoin-orange flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-bitcoin-white-80 text-sm font-semibold mb-1">
              Cooldown Active
            </p>
            <p className="text-bitcoin-white-60 text-xs">
              To prevent API abuse, there's a {cooldownSeconds}-second cooldown between trade generations. 
              Time remaining: <span className="text-bitcoin-orange font-mono font-bold">{formatTime(timeRemaining)}</span>
            </p>
          </div>
        </div>
      )}

      {!isUnlocked && (
        <div className="flex items-start gap-2 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
          <Sparkles size={16} className="text-bitcoin-orange flex-shrink-0 mt-0.5" />
          <p className="text-bitcoin-white-60 text-xs">
            Click the button above to unlock the AI Trade Generation Engine and start generating signals.
          </p>
        </div>
      )}
    </div>
  );
}
