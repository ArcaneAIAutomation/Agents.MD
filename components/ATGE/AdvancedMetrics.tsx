import React from 'react';
import { TrendingUp, TrendingDown, Activity, Target, Zap, Clock, BarChart3, AlertCircle } from 'lucide-react';

export interface AdvancedMetricsData {
  // Sharpe Ratio
  sharpeRatio: number;
  
  // Maximum Drawdown
  maxDrawdown: {
    percentage: number;
    startDate: string;
    endDate: string;
    recoveryDays: number;
  };
  
  // Average Win vs Average Loss
  avgWinSize: number;
  avgLossSize: number;
  
  // Consecutive Streaks
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: {
    type: 'win' | 'loss';
    count: number;
  };
  
  // Profit Factor
  profitFactor: number; // Gross profit / Gross loss
  
  // Expectancy
  expectancy: number; // Average profit per trade
  
  // Recovery Factor
  recoveryFactor: number; // Net profit / Max drawdown
  
  // Confidence Correlation
  confidenceCorrelation: {
    coefficient: number; // -1 to 1
    strength: 'strong' | 'moderate' | 'weak';
  };
  
  // Performance by Volatility
  performanceByVolatility: Array<{
    volatilityLevel: 'low' | 'medium' | 'high';
    trades: number;
    successRate: number;
    avgProfitUsd: number;
  }>;
  
  // Performance by Time
  performanceByTime: {
    byDayOfWeek: Array<{
      day: string;
      trades: number;
      successRate: number;
      avgProfitUsd: number;
    }>;
    byHourOfDay: Array<{
      hour: number;
      trades: number;
      successRate: number;
      avgProfitUsd: number;
    }>;
  };
}

interface AdvancedMetricsProps {
  data: AdvancedMetricsData | null;
  loading?: boolean;
  className?: string;
}

export default function AdvancedMetrics({
  data,
  loading = false,
  className = ''
}: AdvancedMetricsProps) {
  // Loading state
  if (loading) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bitcoin-orange-20 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-bitcoin-orange-20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={24} className="text-bitcoin-orange" />
          <h3 className="text-xl font-bold text-bitcoin-white">Advanced Metrics</h3>
        </div>
        <p className="text-bitcoin-white-60 text-sm">
          Advanced trading metrics will be displayed here once you have sufficient trade history.
        </p>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  // Get Sharpe Ratio interpretation
  const getSharpeInterpretation = (ratio: number) => {
    if (ratio >= 3) return { text: 'Excellent', color: 'text-bitcoin-orange' };
    if (ratio >= 2) return { text: 'Very Good', color: 'text-bitcoin-orange' };
    if (ratio >= 1) return { text: 'Good', color: 'text-yellow-500' };
    if (ratio >= 0) return { text: 'Acceptable', color: 'text-bitcoin-white-60' };
    return { text: 'Poor', color: 'text-red-500' };
  };

  // Get Profit Factor interpretation
  const getProfitFactorInterpretation = (factor: number) => {
    if (factor >= 2) return { text: 'Excellent', color: 'text-bitcoin-orange' };
    if (factor >= 1.5) return { text: 'Good', color: 'text-bitcoin-orange' };
    if (factor >= 1) return { text: 'Profitable', color: 'text-yellow-500' };
    return { text: 'Unprofitable', color: 'text-red-500' };
  };

  const sharpeInterpretation = getSharpeInterpretation(data.sharpeRatio);
  const profitFactorInterpretation = getProfitFactorInterpretation(data.profitFactor);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={32} className="text-bitcoin-orange" />
          <div>
            <h2 className="text-2xl font-bold text-bitcoin-white">Advanced Metrics</h2>
            <p className="text-bitcoin-white-60 text-sm">
              Sophisticated performance analysis for advanced traders
            </p>
          </div>
        </div>
      </div>

      {/* Key Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sharpe Ratio */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={20} className="text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider">
              Sharpe Ratio
            </p>
          </div>
          <p className="text-4xl font-bold text-bitcoin-orange font-mono mb-2">
            {data.sharpeRatio.toFixed(2)}
          </p>
          <p className={`text-sm font-semibold ${sharpeInterpretation.color}`}>
            {sharpeInterpretation.text}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">
            Risk-adjusted return measure
          </p>
        </div>

        {/* Maximum Drawdown */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={20} className="text-red-500" />
            <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider">
              Max Drawdown
            </p>
          </div>
          <p className="text-4xl font-bold text-red-500 font-mono mb-2">
            {data.maxDrawdown.percentage.toFixed(2)}%
          </p>
          <p className="text-bitcoin-white-60 text-xs">
            Recovery: {data.maxDrawdown.recoveryDays} days
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-1">
            {data.maxDrawdown.startDate} - {data.maxDrawdown.endDate}
          </p>
        </div>

        {/* Profit Factor */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Target size={20} className="text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider">
              Profit Factor
            </p>
          </div>
          <p className="text-4xl font-bold text-bitcoin-orange font-mono mb-2">
            {data.profitFactor.toFixed(2)}
          </p>
          <p className={`text-sm font-semibold ${profitFactorInterpretation.color}`}>
            {profitFactorInterpretation.text}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">
            Gross profit / Gross loss
          </p>
        </div>

        {/* Expectancy */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={20} className="text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider">
              Expectancy
            </p>
          </div>
          <p className={`text-4xl font-bold font-mono mb-2 ${data.expectancy >= 0 ? 'text-bitcoin-orange' : 'text-red-500'}`}>
            {formatCurrency(data.expectancy)}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">
            Average profit per trade
          </p>
        </div>

        {/* Recovery Factor */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={20} className="text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider">
              Recovery Factor
            </p>
          </div>
          <p className="text-4xl font-bold text-bitcoin-orange font-mono mb-2">
            {data.recoveryFactor.toFixed(2)}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">
            Net profit / Max drawdown
          </p>
        </div>

        {/* Confidence Correlation */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={20} className="text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider">
              Confidence Correlation
            </p>
          </div>
          <p className="text-4xl font-bold text-bitcoin-orange font-mono mb-2">
            {data.confidenceCorrelation.coefficient.toFixed(2)}
          </p>
          <p className="text-sm font-semibold text-bitcoin-orange capitalize">
            {data.confidenceCorrelation.strength}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">
            Confidence vs success correlation
          </p>
        </div>
      </div>

      {/* Average Win vs Average Loss */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
        <p className="text-bitcoin-white font-semibold mb-4">Average Win vs Average Loss</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-bitcoin-orange" />
              <p className="text-bitcoin-white-60 text-sm">Average Win Size</p>
            </div>
            <p className="text-3xl font-bold text-bitcoin-orange font-mono">
              {formatCurrency(data.avgWinSize)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={20} className="text-red-500" />
              <p className="text-bitcoin-white-60 text-sm">Average Loss Size</p>
            </div>
            <p className="text-3xl font-bold text-red-500 font-mono">
              {formatCurrency(data.avgLossSize)}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-bitcoin-orange-20 text-center">
          <p className="text-bitcoin-white-60 text-sm mb-1">Win/Loss Ratio</p>
          <p className="text-2xl font-bold text-bitcoin-orange">
            {(Math.abs(data.avgWinSize) / Math.abs(data.avgLossSize)).toFixed(2)}:1
          </p>
        </div>
      </div>

      {/* Consecutive Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-6 text-center">
          <Zap size={32} className="text-bitcoin-orange mx-auto mb-3" />
          <p className="text-bitcoin-white-60 text-sm mb-2">Longest Win Streak</p>
          <p className="text-4xl font-bold text-bitcoin-orange font-mono">
            {data.longestWinStreak}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">Consecutive wins</p>
        </div>

        <div className="bg-red-500 bg-opacity-10 border-2 border-red-500 rounded-xl p-6 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-bitcoin-white-60 text-sm mb-2">Longest Loss Streak</p>
          <p className="text-4xl font-bold text-red-500 font-mono">
            {data.longestLossStreak}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">Consecutive losses</p>
        </div>

        <div className={`border-2 rounded-xl p-6 text-center ${
          data.currentStreak.type === 'win'
            ? 'bg-bitcoin-orange bg-opacity-10 border-bitcoin-orange'
            : 'bg-red-500 bg-opacity-10 border-red-500'
        }`}>
          <Zap size={32} className={`mx-auto mb-3 ${data.currentStreak.type === 'win' ? 'text-bitcoin-orange' : 'text-red-500'}`} />
          <p className="text-bitcoin-white-60 text-sm mb-2">Current Streak</p>
          <p className={`text-4xl font-bold font-mono ${data.currentStreak.type === 'win' ? 'text-bitcoin-orange' : 'text-red-500'}`}>
            {data.currentStreak.count}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-2">
            {data.currentStreak.type === 'win' ? '🔥 Wins' : '❄️ Losses'}
          </p>
        </div>
      </div>

      {/* Performance by Volatility */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
        <p className="text-bitcoin-white font-semibold mb-4">Performance by Market Volatility</p>
        <div className="space-y-4">
          {data.performanceByVolatility.map((item, index) => (
            <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-bitcoin-white font-semibold capitalize">{item.volatilityLevel} Volatility</p>
                  <p className="text-bitcoin-white-60 text-xs">{item.trades} trades</p>
                </div>
                <div className="text-right">
                  <p className="text-bitcoin-orange font-bold font-mono text-lg">
                    {item.successRate.toFixed(1)}%
                  </p>
                  <p className="text-bitcoin-white-60 text-xs">Success Rate</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-bitcoin-white-60 text-sm">Avg Profit</p>
                <p className={`font-bold font-mono ${item.avgProfitUsd >= 0 ? 'text-bitcoin-orange' : 'text-red-500'}`}>
                  {formatCurrency(item.avgProfitUsd)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance by Day of Week */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-bitcoin-orange" />
          <p className="text-bitcoin-white font-semibold">Performance by Day of Week</p>
        </div>
        <div className="space-y-3">
          {data.performanceByTime.byDayOfWeek.map((day, index) => (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-bitcoin-white w-20">{day.day}</span>
                  <span className="text-bitcoin-white-60 text-xs">{day.trades} trades</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-bitcoin-orange font-mono">{day.successRate.toFixed(1)}%</span>
                  <span className={`font-bold font-mono ${day.avgProfitUsd >= 0 ? 'text-bitcoin-orange' : 'text-red-500'}`}>
                    {formatCurrency(day.avgProfitUsd)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-bitcoin-orange-20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-bitcoin-orange rounded-full"
                  style={{ width: `${day.successRate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance by Hour of Day (Top 5) */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-bitcoin-orange" />
          <p className="text-bitcoin-white font-semibold">Best Performing Hours</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.performanceByTime.byHourOfDay
            .sort((a, b) => b.avgProfitUsd - a.avgProfitUsd)
            .slice(0, 6)
            .map((hour, index) => (
              <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 text-center">
                <p className="text-bitcoin-white-60 text-xs mb-1">
                  {hour.hour.toString().padStart(2, '0')}:00 - {(hour.hour + 1).toString().padStart(2, '0')}:00
                </p>
                <p className="text-2xl font-bold text-bitcoin-orange font-mono mb-1">
                  {formatCurrency(hour.avgProfitUsd)}
                </p>
                <p className="text-bitcoin-white-60 text-xs">
                  {hour.trades} trades • {hour.successRate.toFixed(1)}% success
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-6">
        <p className="text-bitcoin-orange font-bold mb-3">📊 Metric Interpretation Guide</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-bitcoin-white font-semibold mb-1">Sharpe Ratio</p>
            <p className="text-bitcoin-white-60 text-xs">
              &gt;3: Excellent | 2-3: Very Good | 1-2: Good | &lt;1: Poor
            </p>
          </div>
          <div>
            <p className="text-bitcoin-white font-semibold mb-1">Profit Factor</p>
            <p className="text-bitcoin-white-60 text-xs">
              &gt;2: Excellent | 1.5-2: Good | &gt;1: Profitable | &lt;1: Unprofitable
            </p>
          </div>
          <div>
            <p className="text-bitcoin-white font-semibold mb-1">Max Drawdown</p>
            <p className="text-bitcoin-white-60 text-xs">
              Lower is better. Represents largest peak-to-trough decline.
            </p>
          </div>
          <div>
            <p className="text-bitcoin-white font-semibold mb-1">Recovery Factor</p>
            <p className="text-bitcoin-white-60 text-xs">
              Higher is better. Net profit divided by max drawdown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
