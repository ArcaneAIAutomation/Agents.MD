import React, { useState } from 'react';
import { AlertCircle, Target, TrendingUp, TrendingDown, X, CheckCircle } from 'lucide-react';

/**
 * Target Hit Notification Component
 * 
 * Displays notifications when TP1, TP2, TP3, or stop-loss targets are hit.
 * Allows users to mark partial closes with percentage allocation.
 * 
 * Requirements: 14.4, 16.4
 */

interface TargetHitNotificationProps {
  tradeId: string;
  symbol: string;
  positionType: 'LONG' | 'SHORT';
  currentPrice: number;
  targetHit: 'TP1' | 'TP2' | 'TP3' | 'STOP_LOSS';
  targetPrice: number;
  message: string;
  onClose: () => void;
  onMarkPartialClose: (tradeId: string, exitPrice: number, percentage: number, target: string) => Promise<void>;
  className?: string;
}

export default function TargetHitNotification({
  tradeId,
  symbol,
  positionType,
  currentPrice,
  targetHit,
  targetPrice,
  message,
  onClose,
  onMarkPartialClose,
  className = ''
}: TargetHitNotificationProps) {
  const [showPartialCloseForm, setShowPartialCloseForm] = useState(false);
  const [percentage, setPercentage] = useState<number>(
    targetHit === 'TP1' ? 50 : targetHit === 'TP2' ? 30 : targetHit === 'TP3' ? 20 : 100
  );
  const [exitPrice, setExitPrice] = useState<number>(currentPrice);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Get notification styling based on target type
   */
  const getNotificationStyle = () => {
    if (targetHit === 'STOP_LOSS') {
      return {
        borderColor: 'border-red-500',
        bgColor: 'bg-red-500 bg-opacity-10',
        iconColor: 'text-red-500',
        icon: <AlertCircle size={24} />
      };
    }
    return {
      borderColor: 'border-bitcoin-orange',
      bgColor: 'bg-bitcoin-orange bg-opacity-10',
      iconColor: 'text-bitcoin-orange',
      icon: <Target size={24} />
    };
  };

  /**
   * Handle partial close submission
   */
  const handlePartialClose = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      if (percentage <= 0 || percentage > 100) {
        throw new Error('Percentage must be between 1 and 100');
      }

      if (exitPrice <= 0) {
        throw new Error('Exit price must be greater than zero');
      }

      // Call the callback to mark partial close
      await onMarkPartialClose(tradeId, exitPrice, percentage, targetHit);

      // Show success message
      setSuccess(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Failed to mark partial close:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle ignore notification
   */
  const handleIgnore = () => {
    onClose();
  };

  const style = getNotificationStyle();

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-md ${className}`}>
      <div className={`bg-bitcoin-black border-2 ${style.borderColor} rounded-xl shadow-[0_0_30px_rgba(247,147,26,0.3)] overflow-hidden`}>
        {/* Header */}
        <div className={`${style.bgColor} border-b-2 ${style.borderColor} p-4`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={style.iconColor}>
                {style.icon}
              </div>
              <div>
                <h3 className="text-bitcoin-white font-bold text-lg mb-1">
                  {targetHit === 'STOP_LOSS' ? 'Stop-Loss Hit!' : `${targetHit} Hit!`}
                </h3>
                <p className="text-bitcoin-white-80 text-sm">
                  {symbol} {positionType}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-bitcoin-white-60 hover:text-bitcoin-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Message */}
          <div className="mb-4">
            <p className="text-bitcoin-white-80 text-sm mb-3">
              {message}
            </p>

            {/* Price Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Target Price</p>
                <p className="text-bitcoin-white font-bold font-mono">
                  ${targetPrice.toFixed(2)}
                </p>
              </div>
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Current Price</p>
                <p className={`font-bold font-mono ${style.iconColor}`}>
                  ${currentPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                <p className="text-green-500 font-semibold text-sm">
                  Partial close recorded successfully!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-500 font-semibold text-sm mb-1">Error</p>
                  <p className="text-bitcoin-white-80 text-xs">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Partial Close Form */}
          {showPartialCloseForm && !success && (
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4 mb-4">
              <h4 className="text-bitcoin-white font-bold text-sm mb-3">
                Mark Partial Close
              </h4>

              {/* Exit Price Input */}
              <div className="mb-3">
                <label className="text-bitcoin-white-60 text-xs font-semibold mb-1 block">
                  Exit Price
                </label>
                <input
                  type="number"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(parseFloat(e.target.value))}
                  step="0.01"
                  min="0"
                  className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-3 py-2 focus:border-bitcoin-orange focus:outline-none font-mono"
                  disabled={loading}
                />
              </div>

              {/* Percentage Input */}
              <div className="mb-4">
                <label className="text-bitcoin-white-60 text-xs font-semibold mb-1 block">
                  Percentage to Close: {percentage}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={percentage}
                  onChange={(e) => setPercentage(parseInt(e.target.value))}
                  className="w-full"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-bitcoin-white-60 mt-1">
                  <span>1%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePartialClose}
                disabled={loading}
                className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recording...' : 'Record Partial Close'}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {!showPartialCloseForm && !success && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowPartialCloseForm(true)}
                className="flex-1 bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]"
              >
                Mark Partial Close
              </button>
              <button
                onClick={handleIgnore}
                className="flex-1 bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black"
              >
                Ignore
              </button>
            </div>
          )}

          {/* Cancel Button (when form is shown) */}
          {showPartialCloseForm && !success && (
            <button
              onClick={() => {
                setShowPartialCloseForm(false);
                setError(null);
              }}
              disabled={loading}
              className="w-full mt-2 bg-transparent text-bitcoin-white-60 border-2 border-bitcoin-white-60 font-semibold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-white-60 hover:text-bitcoin-black text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
