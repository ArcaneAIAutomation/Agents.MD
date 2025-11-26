/**
 * Einstein 100000x Trade Generation Engine - Real-Time P/L Display
 * 
 * Component for displaying real-time P/L updates with highlighting for significant changes.
 * 
 * Requirements: 14.3, 17.2
 */

import React from 'react';
import { useRealTimePL } from '../../hooks/useRealTimePL';
import { ArrowUp, ArrowDown, RefreshCw, Play, Pause } from 'lucide-react';

/**
 * Component Props
 */
interface RealTimePLDisplayProps {
  autoStart?: boolean;
  updateInterval?: number;
  significantChangeThreshold?: number;
  className?: string;
}

/**
 * RealTimePLDisplay Component
 * 
 * Displays real-time P/L updates for all executed trades with automatic
 * highlighting of significant changes.
 * 
 * @example
 * ```tsx
 * <RealTimePLDisplay
 *   autoStart={true}
 *   updateInterval={30000}
 *   significantChangeThreshold={5}
 * />
 * ```
 */
export const RealTimePLDisplay: React.FC<RealTimePLDisplayProps> = ({
  autoStart = true,
  updateInterval = 30000,
  significantChangeThreshold = 5,
  className = ''
}) => {
  const {
    trades,
    isRunning,
    isLoading,
    error,
    lastUpdate,
    start,
    stop,
    refresh,
    getSignificantChanges
  } = useRealTimePL({
    autoStart,
    updateInterval,
    significantChangeThreshold
  });

  const significantChanges = getSignificantChanges();

  /**
   * Format time ago
   */
  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Never';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-bitcoin-white mb-1">
            Real-Time P/L Updates
          </h2>
          <p className="text-sm text-bitcoin-white-60">
            Last updated: {formatTimeAgo(lastUpdate)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh now"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isRunning ? (
            <button
              onClick={stop}
              className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-semibold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange"
              title="Stop auto-updates"
            >
              <Pause className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={start}
              className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-semibold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange"
              title="Start auto-updates"
            >
              <Play className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-sm text-bitcoin-white-80">
          {isRunning ? 'Auto-updating every 30 seconds' : 'Auto-updates paused'}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-500 font-semibold">Error: {error}</p>
        </div>
      )}

      {/* Significant Changes Alert */}
      {significantChanges.length > 0 && (
        <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-4 mb-4">
          <p className="text-bitcoin-orange font-semibold mb-2">
            🔔 {significantChanges.length} trade{significantChanges.length > 1 ? 's' : ''} with significant P/L changes
          </p>
          <div className="space-y-1">
            {significantChanges.map(trade => (
              <p key={trade.tradeId} className="text-sm text-bitcoin-white-80">
                {trade.symbol}: {trade.changePercent?.toFixed(1)}% change
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Trades List */}
      {trades.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-bitcoin-white-60">No executed trades to display</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map(trade => (
            <div
              key={trade.tradeId}
              className={`
                bg-bitcoin-black border rounded-lg p-4 transition-all
                ${trade.significantChange 
                  ? 'border-bitcoin-orange shadow-[0_0_20px_rgba(247,147,26,0.5)] animate-pulse' 
                  : 'border-bitcoin-orange-20'
                }
              `}
            >
              <div className="flex items-center justify-between">
                {/* Symbol and Price */}
                <div>
                  <h3 className="text-lg font-bold text-bitcoin-white mb-1">
                    {trade.symbol}
                  </h3>
                  <p className="text-sm text-bitcoin-white-60">
                    Current: ${trade.currentPrice.toFixed(2)}
                  </p>
                </div>

                {/* P/L Display */}
                <div className="text-right">
                  <div className={`flex items-center gap-2 justify-end mb-1 ${
                    trade.pl.isProfit ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {trade.pl.icon === 'up' ? (
                      <ArrowUp className="w-5 h-5" />
                    ) : (
                      <ArrowDown className="w-5 h-5" />
                    )}
                    <span className="text-xl font-bold font-mono">
                      ${Math.abs(trade.pl.profitLoss).toFixed(2)}
                    </span>
                  </div>
                  <p className={`text-sm font-semibold ${
                    trade.pl.isProfit ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {trade.pl.isProfit ? '+' : ''}{trade.pl.profitLossPercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Significant Change Indicator */}
              {trade.significantChange && (
                <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
                  <p className="text-xs text-bitcoin-orange">
                    🔔 Significant change: {trade.changePercent?.toFixed(1)}% from previous update
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {trades.length > 0 && (
        <div className="mt-6 pt-6 border-t border-bitcoin-orange-20">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-bitcoin-white-60 mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-bitcoin-white">{trades.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-bitcoin-white-60 mb-1">In Profit</p>
              <p className="text-2xl font-bold text-green-500">
                {trades.filter(t => t.pl.isProfit).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-bitcoin-white-60 mb-1">In Loss</p>
              <p className="text-2xl font-bold text-red-500">
                {trades.filter(t => !t.pl.isProfit).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimePLDisplay;
