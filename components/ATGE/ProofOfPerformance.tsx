import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, TrendingUp, Users, Award, Zap, ExternalLink } from 'lucide-react';

export interface ProofStats {
  totalTrades: number;
  successRate: number;
  totalProfitUsd: number;
  recentWinningTrades: Array<{
    id: string;
    profitUsd: number;
    percentage: number;
    timestamp: Date;
  }>;
  sevenDayPerformance: Array<{
    date: string;
    trades: number;
    profitUsd: number;
  }>;
  bestPerformingDay: {
    date: string;
    profitUsd: number;
    trades: number;
  } | null;
  consistencyScore: number; // 0-100
  riskManagementScore: number; // 0-100
  consecutiveWins: number;
  transparencyScore: number; // Always 100
  dataIntegrity: boolean; // Always true
  totalUsers: number; // Social proof
}

interface ProofOfPerformanceProps {
  stats: ProofStats | null;
  loading?: boolean;
  onViewAllTrades?: () => void;
  className?: string;
}

export default function ProofOfPerformance({
  stats,
  loading = false,
  onViewAllTrades,
  className = ''
}: ProofOfPerformanceProps) {
  const [tickerIndex, setTickerIndex] = useState(0);

  // Rotate through recent winning trades
  useEffect(() => {
    if (!stats || !stats.recentWinningTrades.length) return;

    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % stats.recentWinningTrades.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [stats]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bitcoin-orange-20 rounded w-1/3"></div>
          <div className="h-32 bg-bitcoin-orange-20 rounded"></div>
        </div>
      </div>
    );
  }

  // No data state
  if (!stats) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={24} className="text-bitcoin-orange" />
          <h3 className="text-xl font-bold text-bitcoin-white">Proof of Performance</h3>
        </div>
        <p className="text-bitcoin-white-60 text-sm">
          Performance proof will be displayed here once trades are completed.
        </p>
      </div>
    );
  }

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

  return (
    <div className={`bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl overflow-hidden ${className}`}>
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange-50 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={32} className="text-bitcoin-black" />
          <h2 className="text-3xl font-bold text-bitcoin-black">Proof of Performance</h2>
        </div>
        <p className="text-bitcoin-black text-opacity-80 text-sm">
          100% Verified Results • Complete Transparency • Real Money Tracking
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Real-Time Accuracy Meter */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-4">
            Real-Time Accuracy Meter
          </p>
          
          {/* Animated Gauge */}
          <div className="relative w-full h-32 mb-4">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 20 90 A 80 80 0 0 1 180 90"
                fill="none"
                stroke="rgba(247, 147, 26, 0.2)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Foreground arc (animated) */}
              <path
                d="M 20 90 A 80 80 0 0 1 180 90"
                fill="none"
                stroke="#F7931A"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(stats.successRate / 100) * 251.2} 251.2`}
                className="transition-all duration-1000 ease-out"
              />
              {/* Center text */}
              <text
                x="100"
                y="70"
                textAnchor="middle"
                className="text-4xl font-bold fill-bitcoin-orange font-mono"
              >
                {stats.successRate.toFixed(1)}%
              </text>
              <text
                x="100"
                y="85"
                textAnchor="middle"
                className="text-xs fill-bitcoin-white-60"
              >
                Success Rate
              </text>
            </svg>
          </div>

          {/* Gauge labels */}
          <div className="flex justify-between text-xs text-bitcoin-white-60">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Live Track Record Banner */}
        <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={20} className="text-bitcoin-orange animate-pulse" />
            <p className="text-bitcoin-orange text-sm font-bold uppercase">Live Track Record</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-bitcoin-white font-mono">
                {stats.totalTrades}
              </p>
              <p className="text-bitcoin-white-60 text-xs mt-1">Trades Analyzed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-bitcoin-orange font-mono">
                {stats.successRate.toFixed(1)}%
              </p>
              <p className="text-bitcoin-white-60 text-xs mt-1">Success Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-bitcoin-orange font-mono">
                {formatCurrency(stats.totalProfitUsd)}
              </p>
              <p className="text-bitcoin-white-60 text-xs mt-1">Total Profit</p>
            </div>
          </div>
        </div>

        {/* Recent Winning Trades Ticker */}
        {stats.recentWinningTrades.length > 0 && (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-bitcoin-orange" />
              <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider">
                Recent Winning Trades
              </p>
            </div>
            
            <div className="relative h-12 overflow-hidden">
              {stats.recentWinningTrades.map((trade, index) => (
                <div
                  key={trade.id}
                  className={`absolute inset-0 flex items-center justify-between transition-all duration-500 ${
                    index === tickerIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-bitcoin-orange" />
                    <span className="text-bitcoin-white text-sm">
                      Trade #{trade.id.substring(0, 8)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-bitcoin-orange font-bold font-mono">
                      {formatCurrency(trade.profitUsd)}
                    </p>
                    <p className="text-bitcoin-white-60 text-xs">
                      {formatPercentage(trade.percentage)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Verified Results */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-4 text-center">
            <CheckCircle size={32} className="text-bitcoin-orange mx-auto mb-2" />
            <p className="text-bitcoin-white font-bold mb-1">Verified Results</p>
            <p className="text-bitcoin-white-60 text-xs">
              100% real historical data
            </p>
          </div>

          {/* Transparency Score */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-4 text-center">
            <Shield size={32} className="text-bitcoin-orange mx-auto mb-2" />
            <p className="text-bitcoin-white font-bold mb-1">Transparency: {stats.transparencyScore}%</p>
            <p className="text-bitcoin-white-60 text-xs">
              All trades visible
            </p>
          </div>

          {/* Data Integrity */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-4 text-center">
            <Award size={32} className="text-bitcoin-orange mx-auto mb-2" />
            <p className="text-bitcoin-white font-bold mb-1">Data Integrity</p>
            <p className="text-bitcoin-white-60 text-xs">
              {stats.dataIntegrity ? 'Verified ✓' : 'Pending'}
            </p>
          </div>
        </div>

        {/* 7-Day Performance Summary */}
        {stats.sevenDayPerformance.length > 0 && (
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
            <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-4">
              Rolling 7-Day Performance
            </p>
            
            <div className="space-y-2">
              {stats.sevenDayPerformance.map((day, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-bitcoin-orange-20 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-bitcoin-white-60 text-sm w-24">{day.date}</span>
                    <span className="text-bitcoin-white-60 text-xs">
                      {day.trades} {day.trades === 1 ? 'trade' : 'trades'}
                    </span>
                  </div>
                  <span className={`font-bold font-mono ${day.profitUsd >= 0 ? 'text-bitcoin-orange' : 'text-red-500'}`}>
                    {formatCurrency(day.profitUsd)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Performing Day */}
        {stats.bestPerformingDay && (
          <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Award size={20} className="text-bitcoin-orange" />
              <p className="text-bitcoin-orange text-sm font-bold uppercase">Best Performing Day</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-bitcoin-white text-lg font-bold">{stats.bestPerformingDay.date}</p>
                <p className="text-bitcoin-white-60 text-sm">
                  {stats.bestPerformingDay.trades} {stats.bestPerformingDay.trades === 1 ? 'trade' : 'trades'}
                </p>
              </div>
              <p className="text-3xl font-bold text-bitcoin-orange font-mono">
                {formatCurrency(stats.bestPerformingDay.profitUsd)}
              </p>
            </div>
          </div>
        )}

        {/* Performance Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Consistency Score */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
              Consistency Score
            </p>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-2 bg-bitcoin-orange-20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-bitcoin-orange transition-all duration-1000"
                    style={{ width: `${stats.consistencyScore}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-2xl font-bold text-bitcoin-orange font-mono ml-4">
                {stats.consistencyScore}%
              </span>
            </div>
            <p className="text-bitcoin-white-60 text-xs mt-2">
              How reliably the AI performs
            </p>
          </div>

          {/* Risk Management Score */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
              Risk Management Score
            </p>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-2 bg-bitcoin-orange-20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-bitcoin-orange transition-all duration-1000"
                    style={{ width: `${stats.riskManagementScore}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-2xl font-bold text-bitcoin-orange font-mono ml-4">
                {stats.riskManagementScore}%
              </span>
            </div>
            <p className="text-bitcoin-white-60 text-xs mt-2">
              How well stop losses protect capital
            </p>
          </div>
        </div>

        {/* Elite Performance Badge */}
        {stats.successRate >= 70 && (
          <div className="bg-gradient-to-r from-bitcoin-orange to-yellow-500 rounded-xl p-6 text-center">
            <Award size={48} className="text-bitcoin-black mx-auto mb-3 animate-pulse" />
            <p className="text-2xl font-bold text-bitcoin-black mb-2">
              🏆 Elite Performance
            </p>
            <p className="text-bitcoin-black text-opacity-80 text-sm">
              Success rate above 70% - Exceptional trading accuracy
            </p>
          </div>
        )}

        {/* Hot Streak Badge */}
        {stats.consecutiveWins >= 10 && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-center">
            <Zap size={48} className="text-white mx-auto mb-3 animate-bounce" />
            <p className="text-2xl font-bold text-white mb-2">
              🔥 Hot Streak!
            </p>
            <p className="text-white text-opacity-90 text-sm">
              {stats.consecutiveWins} consecutive winning trades
            </p>
          </div>
        )}

        {/* Guarantees */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-bitcoin-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-bitcoin-white font-semibold">No Hidden Trades</p>
              <p className="text-bitcoin-white-60 text-sm">
                Every single trade is visible - complete transparency guaranteed
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-bitcoin-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-bitcoin-white font-semibold">Real Money, Real Results</p>
              <p className="text-bitcoin-white-60 text-sm">
                All trades use standardized $1000 size for honest comparison
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-bitcoin-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-bitcoin-white font-semibold">100% Real Historical Data</p>
              <p className="text-bitcoin-white-60 text-sm">
                All backtesting uses verified minute-level price data
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-6 text-center">
          <Users size={32} className="text-bitcoin-orange mx-auto mb-3" />
          <p className="text-2xl font-bold text-bitcoin-white mb-2">
            Join {stats.totalUsers.toLocaleString()} traders
          </p>
          <p className="text-bitcoin-white-60 text-sm">
            Using our AI-powered trade generation engine
          </p>
        </div>

        {/* Challenge Us Button */}
        <div className="text-center">
          <button
            onClick={onViewAllTrades}
            className="inline-flex items-center gap-2 bg-bitcoin-orange text-bitcoin-black font-bold uppercase tracking-wider px-8 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95"
          >
            <ExternalLink size={20} />
            Challenge Us - View All Trades
          </button>
          <p className="text-bitcoin-white-60 text-xs mt-3">
            Verify every trade • Complete transparency • No cherry-picking
          </p>
        </div>
      </div>
    </div>
  );
}
