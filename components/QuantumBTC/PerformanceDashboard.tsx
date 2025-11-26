import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Clock, Target } from 'lucide-react';

interface PerformanceMetrics {
  totalTrades: number;
  overallAccuracy: number;
  totalProfitLoss: number;
  averageConfidenceWinning: number;
  averageConfidenceLosing: number;
  bestTimeframe: string;
  worstTimeframe: string;
  recentTrades: any[];
  dataQualityTrend: number[];
  apiReliability: {
    cmc: number;
    coingecko: number;
    kraken: number;
    blockchain: number;
    lunarcrush: number;
  };
  anomalyCount: number;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceMetrics();
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/quantum/performance-dashboard');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch performance metrics');
      }

      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Performance metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin-orange"></div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <div className="flex items-center gap-3 text-bitcoin-orange">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">Performance Data Unavailable</p>
            <p className="text-sm text-bitcoin-white-80 mt-1">
              {error || 'No performance data available'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isProfitable = metrics.totalProfitLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
          Quantum Performance Dashboard
        </h2>
        <p className="text-bitcoin-white-60 text-sm italic">
          Real-time tracking of trade accuracy and system performance
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trades */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 transition-all hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
            Total Trades
          </p>
          <p className="font-mono text-2xl font-bold text-bitcoin-white tracking-tight">
            {metrics.totalTrades}
          </p>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 transition-all hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
            Accuracy Rate
          </p>
          <p className="font-mono text-2xl font-bold text-bitcoin-orange tracking-tight">
            {metrics.overallAccuracy.toFixed(1)}%
          </p>
        </div>

        {/* Profit/Loss */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 transition-all hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
            Total P/L
          </p>
          <div className="flex items-center gap-2">
            {isProfitable ? (
              <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
            ) : (
              <TrendingDown className="w-5 h-5 text-bitcoin-white-80" />
            )}
            <p className={`font-mono text-2xl font-bold tracking-tight ${isProfitable ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
              ${Math.abs(metrics.totalProfitLoss).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Anomaly Count */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 transition-all hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
            Anomalies
          </p>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-bitcoin-orange" />
            <p className="font-mono text-2xl font-bold text-bitcoin-white tracking-tight">
              {metrics.anomalyCount}
            </p>
          </div>
        </div>
      </div>

      {/* Confidence Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
          <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-bitcoin-orange" />
            Confidence Analysis
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-bitcoin-white-60 mb-1">Winning Trades</p>
              <p className="font-mono text-xl font-bold text-bitcoin-orange">
                {metrics.averageConfidenceWinning.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-bitcoin-white-60 mb-1">Losing Trades</p>
              <p className="font-mono text-xl font-bold text-bitcoin-white-80">
                {metrics.averageConfidenceLosing.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
          <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-bitcoin-orange" />
            Timeframe Performance
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-bitcoin-white-60 mb-1">Best Timeframe</p>
              <p className="font-mono text-xl font-bold text-bitcoin-orange">
                {metrics.bestTimeframe}
              </p>
            </div>
            <div>
              <p className="text-sm text-bitcoin-white-60 mb-1">Worst Timeframe</p>
              <p className="font-mono text-xl font-bold text-bitcoin-white-80">
                {metrics.worstTimeframe}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Reliability */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-bitcoin-orange" />
          API Reliability
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(metrics.apiReliability).map(([api, reliability]) => (
            <div key={api} className="text-center">
              <p className="text-xs text-bitcoin-white-60 uppercase mb-1">
                {api.toUpperCase()}
              </p>
              <p className={`font-mono text-lg font-bold ${reliability >= 95 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
                {reliability.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4">
          Recent Trades
        </h3>
        {metrics.recentTrades.length === 0 ? (
          <p className="text-bitcoin-white-60 text-center py-8">
            No recent trades available
          </p>
        ) : (
          <div className="space-y-2">
            {metrics.recentTrades.slice(0, 5).map((trade, index) => (
              <div
                key={trade.id || index}
                className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-bitcoin-white">
                      {trade.symbol} - {trade.timeframe}
                    </p>
                    <p className="text-xs text-bitcoin-white-60 mt-1">
                      {new Date(trade.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-bitcoin-orange">
                      {trade.confidence}% confidence
                    </p>
                    <p className="text-xs text-bitcoin-white-60 mt-1">
                      Status: {trade.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
