import React from 'react';
import { TrendingUp, TrendingDown, Trophy, AlertTriangle, Target, Clock, Zap } from 'lucide-react';

export interface PerformanceStats {
  totalTrades: number;
  completedTrades: number;
  successRate: number;
  totalProfitLossUsd: number;
  totalProfitLossPercentage: number;
  winningTrades: number;
  losingTrades: number;
  avgProfitPerWin: number;
  avgLossPerLoss: number;
  bestTrade: {
    id: string;
    profitUsd: number;
    percentage: number;
  } | null;
  worstTrade: {
    id: string;
    lossUsd: number;
    percentage: number;
  } | null;
  avgConfidenceWinning: number;
  avgConfidenceLosing: number;
  avgTimeToTarget: number; // in minutes
  bestTimeframe: {
    timeframe: string;
    profitUsd: number;
  } | null;
  worstTimeframe: {
    timeframe: string;
    lossUsd: number;
  } | null;
  hypotheticalGrowth: {
    starting: number;
    current: number;
    percentage: number;
  };
  roi: number;
  winLossRatio: number;
  currentStreak: {
    type: 'win' | 'loss';
    count: number;
  } | null;
  lastUpdated: Date;
}

interface PerformanceSummaryCardProps {
  stats: PerformanceStats | null;
  loading?: boolean;
  className?: string;
}

export default function PerformanceSummaryCard({ 
  stats, 
  loading = false,
  className = '' 
}: PerformanceSummaryCardProps) {
  // Loading state
  if (loading) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bitcoin-orange-20 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-bitcoin-orange-20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!stats || stats.totalTrades === 0) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={24} className="text-bitcoin-orange" />
          <h3 className="text-xl font-bold text-bitcoin-white">Performance Summary</h3>
        </div>
        <p className="text-bitcoin-white-60 text-sm">
          Performance metrics will be displayed here once you generate your first trade signal.
        </p>
      </div>
    );
  }

  // Determine success rate color
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 60) return 'text-bitcoin-orange';
    if (rate >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Determine profit/loss color
  const getProfitLossColor = (amount: number) => {
    return amount >= 0 ? 'text-bitcoin-orange' : 'text-red-500';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Format time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={`bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp size={32} className="text-bitcoin-orange" />
          <div>
            <h2 className="text-2xl font-bold text-bitcoin-white">Performance Summary</h2>
            <p className="text-bitcoin-white-60 text-sm">
              Real-time performance metrics • 100% verified data
            </p>
          </div>
        </div>
        
        {/* Badges */}
        <div className="flex gap-2">
          {stats.successRate >= 65 && (
            <div className="bg-bitcoin-orange bg-opacity-20 border border-bitcoin-orange rounded-lg px-3 py-1">
              <span className="text-bitcoin-orange text-xs font-bold uppercase">Superior Performance</span>
            </div>
          )}
          {stats.totalProfitLossUsd >= 2000 && (
            <div className="bg-bitcoin-orange bg-opacity-20 border border-bitcoin-orange rounded-lg px-3 py-1">
              <span className="text-bitcoin-orange text-xs font-bold uppercase">Highly Profitable</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics - Extra Large Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Success Rate */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 text-center">
          <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-2">
            Success Rate
          </p>
          <p className={`text-6xl font-bold font-mono ${getSuccessRateColor(stats.successRate)} [text-shadow:0_0_30px_rgba(247,147,26,0.5)]`}>
            {stats.successRate.toFixed(1)}%
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">
            {stats.completedTrades} completed trades
          </p>
        </div>

        {/* Total Profit/Loss */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 text-center">
          <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-2">
            Total Profit/Loss
          </p>
          <p className={`text-6xl font-bold font-mono ${getProfitLossColor(stats.totalProfitLossUsd)} [text-shadow:0_0_30px_rgba(247,147,26,0.5)]`}>
            {formatCurrency(stats.totalProfitLossUsd)}
          </p>
          <p className={`text-sm font-semibold mt-2 ${getProfitLossColor(stats.totalProfitLossUsd)}`}>
            {formatPercentage(stats.totalProfitLossPercentage)}
          </p>
        </div>

        {/* ROI */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 text-center">
          <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-2">
            Return on Investment
          </p>
          <p className={`text-6xl font-bold font-mono ${getProfitLossColor(stats.roi)} [text-shadow:0_0_30px_rgba(247,147,26,0.5)]`}>
            {formatPercentage(stats.roi)}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">
            Based on $1000 per trade
          </p>
        </div>
      </div>

      {/* Win/Loss Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Winning Trades */}
        <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
                Winning Trades
              </p>
              <p className="text-3xl font-bold text-bitcoin-orange font-mono">
                {stats.winningTrades}
              </p>
            </div>
            <TrendingUp size={32} className="text-bitcoin-orange" />
          </div>
          <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
            <p className="text-bitcoin-white-60 text-xs">Average Profit per Win</p>
            <p className="text-xl font-bold text-bitcoin-orange font-mono">
              {formatCurrency(stats.avgProfitPerWin)}
            </p>
          </div>
        </div>

        {/* Losing Trades */}
        <div className="bg-red-500 bg-opacity-10 border-2 border-red-500 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
                Losing Trades
              </p>
              <p className="text-3xl font-bold text-red-500 font-mono">
                {stats.losingTrades}
              </p>
            </div>
            <TrendingDown size={32} className="text-red-500" />
          </div>
          <div className="mt-3 pt-3 border-t border-red-500 border-opacity-20">
            <p className="text-bitcoin-white-60 text-xs">Average Loss per Loss</p>
            <p className="text-xl font-bold text-red-500 font-mono">
              {formatCurrency(stats.avgLossPerLoss)}
            </p>
          </div>
        </div>
      </div>

      {/* Best/Worst Trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Trade */}
        {stats.bestTrade && (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={20} className="text-bitcoin-orange" />
              <p className="text-bitcoin-orange text-sm font-bold uppercase">Best Trade</p>
            </div>
            <p className="text-2xl font-bold text-bitcoin-orange font-mono">
              {formatCurrency(stats.bestTrade.profitUsd)}
            </p>
            <p className="text-bitcoin-white-60 text-xs mt-1">
              {formatPercentage(stats.bestTrade.percentage)} • Trade #{stats.bestTrade.id.substring(0, 8)}
            </p>
          </div>
        )}

        {/* Worst Trade */}
        {stats.worstTrade && (
          <div className="bg-bitcoin-black border-2 border-red-500 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-red-500" />
              <p className="text-red-500 text-sm font-bold uppercase">Worst Trade</p>
            </div>
            <p className="text-2xl font-bold text-red-500 font-mono">
              {formatCurrency(stats.worstTrade.lossUsd)}
            </p>
            <p className="text-bitcoin-white-60 text-xs mt-1">
              {formatPercentage(stats.worstTrade.percentage)} • Trade #{stats.worstTrade.id.substring(0, 8)}
            </p>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confidence Comparison */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4">
          <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
            Avg Confidence
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-bitcoin-white-60">Winning Trades</p>
              <p className="text-lg font-bold text-bitcoin-orange font-mono">
                {stats.avgConfidenceWinning.toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-bitcoin-white-60">Losing Trades</p>
              <p className="text-lg font-bold text-bitcoin-white font-mono">
                {stats.avgConfidenceLosing.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Average Time to Target */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider">
              Avg Win Time
            </p>
          </div>
          <p className="text-2xl font-bold text-bitcoin-white font-mono">
            {formatTime(stats.avgTimeToTarget)}
          </p>
        </div>

        {/* Win/Loss Ratio */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider">
              Win/Loss Ratio
            </p>
          </div>
          <p className="text-2xl font-bold text-bitcoin-orange font-mono">
            {stats.winLossRatio.toFixed(1)}:1
          </p>
        </div>

        {/* Current Streak */}
        {stats.currentStreak && (
          <div className={`bg-bitcoin-black border-2 ${stats.currentStreak.type === 'win' ? 'border-bitcoin-orange' : 'border-red-500'} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className={stats.currentStreak.type === 'win' ? 'text-bitcoin-orange' : 'text-red-500'} />
              <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider">
                Current Streak
              </p>
            </div>
            <p className={`text-2xl font-bold font-mono ${stats.currentStreak.type === 'win' ? 'text-bitcoin-orange' : 'text-red-500'}`}>
              {stats.currentStreak.type === 'win' ? '🔥' : '❄️'} {stats.currentStreak.count} {stats.currentStreak.type === 'win' ? 'Wins' : 'Losses'}
            </p>
          </div>
        )}
      </div>

      {/* Best/Worst Timeframes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Timeframe */}
        {stats.bestTimeframe && (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
              Best Performing Timeframe
            </p>
            <p className="text-xl font-bold text-bitcoin-orange">
              {stats.bestTimeframe.timeframe}
            </p>
            <p className="text-lg font-bold text-bitcoin-orange font-mono mt-1">
              {formatCurrency(stats.bestTimeframe.profitUsd)}
            </p>
          </div>
        )}

        {/* Worst Timeframe */}
        {stats.worstTimeframe && (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
              Worst Performing Timeframe
            </p>
            <p className="text-xl font-bold text-red-500">
              {stats.worstTimeframe.timeframe}
            </p>
            <p className="text-lg font-bold text-red-500 font-mono mt-1">
              {formatCurrency(stats.worstTimeframe.lossUsd)}
            </p>
          </div>
        )}
      </div>

      {/* Hypothetical Account Growth */}
      <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-6">
        <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-3">
          Hypothetical Account Growth
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-bitcoin-white-60 text-xs mb-1">Starting Capital</p>
            <p className="text-2xl font-bold text-bitcoin-white font-mono">
              ${stats.hypotheticalGrowth.starting.toLocaleString()}
            </p>
          </div>
          <TrendingUp size={32} className="text-bitcoin-orange" />
          <div>
            <p className="text-bitcoin-white-60 text-xs mb-1">Current Value</p>
            <p className="text-2xl font-bold text-bitcoin-orange font-mono">
              ${stats.hypotheticalGrowth.current.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
          <p className="text-center text-xl font-bold text-bitcoin-orange">
            {formatPercentage(stats.hypotheticalGrowth.percentage)} Growth
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-bitcoin-white-60 text-xs">
          Last Updated: {stats.lastUpdated.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
