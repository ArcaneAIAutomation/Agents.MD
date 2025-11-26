import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  RefreshCw,
  AlertCircle,
  Filter,
  Calendar,
  DollarSign,
  Percent,
  Target
} from 'lucide-react';

/**
 * Einstein Performance Dashboard Component
 * 
 * Displays performance metrics and charts for Einstein-generated trades.
 * Features:
 * - Win rate, average profit, max drawdown display
 * - Performance charts (P/L over time)
 * - Filtering by timeframe and position type
 * - Bitcoin Sovereign styling
 * 
 * Requirements: 10.4
 */

interface PerformanceMetrics {
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  average_profit: number;
  average_loss: number;
  max_drawdown: number;
  total_profit_loss: number;
  best_trade: number;
  worst_trade: number;
  average_risk_reward: number;
  average_confidence: number;
}

interface PerformanceDataPoint {
  date: string;
  cumulative_pl: number;
  trade_count: number;
  win_rate: number;
}

interface EinsteinPerformanceProps {
  className?: string;
}

export default function EinsteinPerformance({ className = '' }: EinsteinPerformanceProps) {
  // State
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [chartData, setChartData] = useState<PerformanceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterTimeframe, setFilterTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [filterPositionType, setFilterPositionType] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');

  /**
   * Fetch performance metrics from API
   */
  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        timeframe: filterTimeframe,
      });

      if (filterPositionType !== 'ALL') {
        params.append('positionType', filterPositionType);
      }

      // Fetch data
      const response = await fetch(`/api/einstein/performance?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }

      const data = await response.json();

      setMetrics(data.metrics || null);
      setChartData(data.chartData || []);

    } catch (err) {
      console.error('❌ Failed to fetch performance metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch data on mount and when filters change
   */
  useEffect(() => {
    fetchPerformanceMetrics();
  }, [filterTimeframe, filterPositionType]);

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  /**
   * Format percentage
   */
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  /**
   * Get color for P/L
   */
  const getPLColor = (value: number) => {
    if (value > 0) return 'text-bitcoin-orange';
    if (value < 0) return 'text-red-500';
    return 'text-bitcoin-white-60';
  };

  /**
   * Get win rate color
   */
  const getWinRateColor = (rate: number) => {
    if (rate >= 65) return 'text-bitcoin-orange';
    if (rate >= 50) return 'text-bitcoin-white';
    return 'text-red-500';
  };

  /**
   * Render simple line chart
   */
  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-bitcoin-white-60">
          <p>No chart data available</p>
        </div>
      );
    }

    // Find min and max for scaling
    const values = chartData.map(d => d.cumulative_pl);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 0);
    const range = maxValue - minValue || 1;

    // Calculate points for SVG path
    const width = 100; // percentage
    const height = 100; // percentage
    const padding = 5;

    const points = chartData.map((point, index) => {
      const x = padding + ((width - 2 * padding) * index) / (chartData.length - 1 || 1);
      const y = height - padding - ((height - 2 * padding) * (point.cumulative_pl - minValue)) / range;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative h-64 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
        {/* Y-axis labels */}
        <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between text-xs text-bitcoin-white-60 font-mono">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency((maxValue + minValue) / 2)}</span>
          <span>{formatCurrency(minValue)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-16 h-full">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Zero line */}
            {minValue < 0 && maxValue > 0 && (
              <line
                x1={padding}
                y1={height - padding - ((height - 2 * padding) * (0 - minValue)) / range}
                x2={width - padding}
                y2={height - padding - ((height - 2 * padding) * (0 - minValue)) / range}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
            )}

            {/* P/L line */}
            <polyline
              points={points}
              fill="none"
              stroke="var(--bitcoin-orange)"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Area under curve */}
            <polygon
              points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
              fill="url(#gradient)"
              opacity="0.2"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--bitcoin-orange)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--bitcoin-orange)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-bitcoin-white-60 font-mono ml-16">
          <span>{chartData[0]?.date || ''}</span>
          <span>{chartData[Math.floor(chartData.length / 2)]?.date || ''}</span>
          <span>{chartData[chartData.length - 1]?.date || ''}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
              Einstein Performance Dashboard
            </h2>
            <p className="text-bitcoin-white-80 text-sm">
              Track win rate, profit/loss, and trading performance over time
            </p>
          </div>
          <button
            onClick={fetchPerformanceMetrics}
            disabled={loading}
            className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-bitcoin-orange" />
          <h3 className="text-lg font-bold text-bitcoin-white">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timeframe Filter */}
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              Timeframe
            </label>
            <select
              value={filterTimeframe}
              onChange={(e) => setFilterTimeframe(e.target.value as any)}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-3 py-2 focus:border-bitcoin-orange focus:outline-none"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Position Type Filter */}
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              Position Type
            </label>
            <select
              value={filterPositionType}
              onChange={(e) => setFilterPositionType(e.target.value as any)}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-3 py-2 focus:border-bitcoin-orange focus:outline-none"
            >
              <option value="ALL">All Positions</option>
              <option value="LONG">Long Only</option>
              <option value="SHORT">Short Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-12 text-center">
          <RefreshCw size={48} className="text-bitcoin-orange animate-spin mx-auto mb-4" />
          <p className="text-bitcoin-white-80">Loading performance metrics...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500 bg-opacity-10 border-2 border-red-500 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-bold mb-1">Error</p>
              <p className="text-bitcoin-white-80 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {!loading && !error && metrics && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Win Rate */}
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 transition-all hover:border-bitcoin-orange">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                  <Target size={24} className="text-bitcoin-orange" />
                </div>
                <div className="flex-1">
                  <p className="text-bitcoin-white-60 text-xs uppercase font-semibold">Win Rate</p>
                  <p className={`font-bold font-mono text-3xl ${getWinRateColor(metrics.win_rate)}`}>
                    {formatPercent(metrics.win_rate)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-bitcoin-white-60">
                {metrics.winning_trades}W / {metrics.losing_trades}L of {metrics.total_trades} trades
              </div>
            </div>

            {/* Average Profit */}
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 transition-all hover:border-bitcoin-orange">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                  <TrendingUp size={24} className="text-bitcoin-orange" />
                </div>
                <div className="flex-1">
                  <p className="text-bitcoin-white-60 text-xs uppercase font-semibold">Avg Profit</p>
                  <p className={`font-bold font-mono text-3xl ${getPLColor(metrics.average_profit)}`}>
                    {formatCurrency(metrics.average_profit)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-bitcoin-white-60">
                Per winning trade
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 transition-all hover:border-bitcoin-orange">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                  <TrendingDown size={24} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-bitcoin-white-60 text-xs uppercase font-semibold">Max Drawdown</p>
                  <p className="font-bold font-mono text-3xl text-red-500">
                    {formatCurrency(Math.abs(metrics.max_drawdown))}
                  </p>
                </div>
              </div>
              <div className="text-xs text-bitcoin-white-60">
                Largest peak-to-trough decline
              </div>
            </div>

            {/* Total P/L */}
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 transition-all hover:border-bitcoin-orange">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                  <DollarSign size={24} className="text-bitcoin-orange" />
                </div>
                <div className="flex-1">
                  <p className="text-bitcoin-white-60 text-xs uppercase font-semibold">Total P/L</p>
                  <p className={`font-bold font-mono text-3xl ${getPLColor(metrics.total_profit_loss)}`}>
                    {formatCurrency(metrics.total_profit_loss)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-bitcoin-white-60">
                Cumulative profit/loss
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 size={24} className="text-bitcoin-orange" />
              <div>
                <h3 className="text-xl font-bold text-bitcoin-white">
                  Cumulative P/L Over Time
                </h3>
                <p className="text-bitcoin-white-60 text-sm">
                  Track your trading performance across {filterTimeframe}
                </p>
              </div>
            </div>
            {renderChart()}
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Best Trade */}
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-bitcoin-white-60 text-xs uppercase font-semibold mb-2">
                Best Trade
              </p>
              <p className="text-bitcoin-orange font-bold font-mono text-2xl">
                {formatCurrency(metrics.best_trade)}
              </p>
            </div>

            {/* Worst Trade */}
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-bitcoin-white-60 text-xs uppercase font-semibold mb-2">
                Worst Trade
              </p>
              <p className="text-red-500 font-bold font-mono text-2xl">
                {formatCurrency(metrics.worst_trade)}
              </p>
            </div>

            {/* Average Loss */}
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-bitcoin-white-60 text-xs uppercase font-semibold mb-2">
                Avg Loss
              </p>
              <p className="text-red-500 font-bold font-mono text-2xl">
                {formatCurrency(Math.abs(metrics.average_loss))}
              </p>
            </div>

            {/* Average Risk/Reward */}
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-bitcoin-white-60 text-xs uppercase font-semibold mb-2">
                Avg Risk:Reward
              </p>
              <p className="text-bitcoin-white font-bold font-mono text-2xl">
                1:{metrics.average_risk_reward.toFixed(2)}
              </p>
            </div>

            {/* Average Confidence */}
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-bitcoin-white-60 text-xs uppercase font-semibold mb-2">
                Avg Confidence
              </p>
              <p className="text-bitcoin-white font-bold font-mono text-2xl">
                {formatPercent(metrics.average_confidence)}
              </p>
            </div>

            {/* Total Trades */}
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-bitcoin-white-60 text-xs uppercase font-semibold mb-2">
                Total Trades
              </p>
              <p className="text-bitcoin-white font-bold font-mono text-2xl">
                {metrics.total_trades}
              </p>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-bitcoin-white mb-4">
              Performance Insights
            </h3>
            <div className="space-y-3 text-sm">
              {/* Win Rate Insight */}
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  metrics.win_rate >= 65 ? 'bg-bitcoin-orange' : 
                  metrics.win_rate >= 50 ? 'bg-bitcoin-white' : 'bg-red-500'
                }`} />
                <p className="text-bitcoin-white-80">
                  {metrics.win_rate >= 65 ? (
                    <>Your win rate of <span className="text-bitcoin-orange font-bold">{formatPercent(metrics.win_rate)}</span> is excellent and above industry standards (65%+).</>
                  ) : metrics.win_rate >= 50 ? (
                    <>Your win rate of <span className="text-bitcoin-white font-bold">{formatPercent(metrics.win_rate)}</span> is solid. Focus on improving risk management to reach 65%+.</>
                  ) : (
                    <>Your win rate of <span className="text-red-500 font-bold">{formatPercent(metrics.win_rate)}</span> needs improvement. Review your strategy and consider adjusting entry criteria.</>
                  )}
                </p>
              </div>

              {/* Risk/Reward Insight */}
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  metrics.average_risk_reward >= 2 ? 'bg-bitcoin-orange' : 'bg-red-500'
                }`} />
                <p className="text-bitcoin-white-80">
                  {metrics.average_risk_reward >= 2 ? (
                    <>Your average risk:reward ratio of <span className="text-bitcoin-orange font-bold">1:{metrics.average_risk_reward.toFixed(2)}</span> meets the minimum 2:1 requirement.</>
                  ) : (
                    <>Your average risk:reward ratio of <span className="text-red-500 font-bold">1:{metrics.average_risk_reward.toFixed(2)}</span> is below the recommended 2:1 minimum.</>
                  )}
                </p>
              </div>

              {/* Drawdown Insight */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                <p className="text-bitcoin-white-80">
                  Your maximum drawdown of <span className="text-red-500 font-bold">{formatCurrency(Math.abs(metrics.max_drawdown))}</span> represents your largest peak-to-trough decline. Keep this under control with proper position sizing.
                </p>
              </div>

              {/* Total P/L Insight */}
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${getPLColor(metrics.total_profit_loss).replace('text-', 'bg-')}`} />
                <p className="text-bitcoin-white-80">
                  {metrics.total_profit_loss > 0 ? (
                    <>You've generated a total profit of <span className="text-bitcoin-orange font-bold">{formatCurrency(metrics.total_profit_loss)}</span> across {metrics.total_trades} trades. Keep up the good work!</>
                  ) : metrics.total_profit_loss < 0 ? (
                    <>You currently have a total loss of <span className="text-red-500 font-bold">{formatCurrency(Math.abs(metrics.total_profit_loss))}</span>. Review your strategy and focus on high-confidence setups.</>
                  ) : (
                    <>You're currently break-even across {metrics.total_trades} trades. Focus on consistency and risk management.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No Data State */}
      {!loading && !error && !metrics && (
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-12 text-center">
          <BarChart3 size={48} className="text-bitcoin-white-60 mx-auto mb-4" />
          <p className="text-bitcoin-white-80 mb-2">No performance data available</p>
          <p className="text-bitcoin-white-60 text-sm">
            Execute some trades to see your performance metrics
          </p>
        </div>
      )}
    </div>
  );
}
