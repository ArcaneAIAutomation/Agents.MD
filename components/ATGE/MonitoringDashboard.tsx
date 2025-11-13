import React, { useState, useEffect } from 'react';
import { MonitoringStats } from '../../lib/atge/monitoring';

interface MonitoringDashboardProps {
  className?: string;
}

export default function MonitoringDashboard({ className = '' }: MonitoringDashboardProps) {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/atge/monitoring/stats?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className={`bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 ${className}`}>
        <div className="text-bitcoin-white-80 text-center">Loading monitoring data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 ${className}`}>
        <div className="text-bitcoin-orange text-center">Error: {error}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-bitcoin-white">
            ATGE Production Monitoring
          </h2>
          <div className="flex gap-2">
            {(['1h', '24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-bitcoin-orange text-bitcoin-black'
                    : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Statistics */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">Error Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Errors"
            value={stats.errors.total}
            color={stats.errors.total > 100 ? 'orange' : 'white'}
          />
          <StatCard
            label="Critical Errors"
            value={stats.errors.bySeverity.critical || 0}
            color={stats.errors.bySeverity.critical > 0 ? 'orange' : 'white'}
          />
          <StatCard
            label="High Severity"
            value={stats.errors.bySeverity.high || 0}
            color="white"
          />
        </div>

        {/* Error Types Breakdown */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-bitcoin-white-80 mb-3">Errors by Type</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stats.errors.byType).map(([type, count]) => (
              <div key={type} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
                <div className="text-bitcoin-white-60 text-sm uppercase">{type}</div>
                <div className="text-bitcoin-white text-xl font-mono font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Errors */}
        {stats.errors.recentErrors.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-bitcoin-white-80 mb-3">Recent Errors</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.errors.recentErrors.map((error, index) => (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${
                      error.severity === 'critical' ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'
                    }`}>
                      {error.errorType.toUpperCase()}
                    </span>
                    <span className="text-bitcoin-white-60 text-xs">
                      {new Date(error.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-bitcoin-white-80 text-sm">{error.errorMessage}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Avg API Response"
            value={`${stats.performance.averageApiResponseTime.toFixed(0)}ms`}
            color={stats.performance.averageApiResponseTime > 1000 ? 'orange' : 'white'}
          />
          <StatCard
            label="Avg DB Query"
            value={`${stats.performance.averageDatabaseQueryTime.toFixed(0)}ms`}
            color={stats.performance.averageDatabaseQueryTime > 500 ? 'orange' : 'white'}
          />
          <StatCard
            label="Avg Generation"
            value={`${(stats.performance.averageGenerationTime / 1000).toFixed(1)}s`}
            color="white"
          />
          <StatCard
            label="Avg Backtest"
            value={`${(stats.performance.averageBacktestTime / 1000).toFixed(1)}s`}
            color="white"
          />
          <StatCard
            label="Avg Analysis"
            value={`${(stats.performance.averageAnalysisTime / 1000).toFixed(1)}s`}
            color="white"
          />
        </div>

        {/* Slowest Operations */}
        {stats.performance.slowestOperations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-bitcoin-white-80 mb-3">Slowest Operations</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.performance.slowestOperations.slice(0, 5).map((op, index) => (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-bitcoin-white-80 text-sm">{op.metricName}</span>
                    <span className="text-bitcoin-orange font-mono font-bold">
                      {op.value.toFixed(0)}{op.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Database Statistics */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">Database Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Trades"
            value={stats.database.totalTrades}
            color="white"
          />
          <StatCard
            label="Active Trades"
            value={stats.database.activeTrades}
            color="orange"
          />
          <StatCard
            label="Completed Trades"
            value={stats.database.completedTrades}
            color="white"
          />
          <StatCard
            label="Success Rate"
            value={`${stats.database.averageTradeSuccessRate.toFixed(1)}%`}
            color={stats.database.averageTradeSuccessRate >= 60 ? 'white' : 'orange'}
          />
        </div>
      </div>

      {/* User Feedback */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">User Feedback</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Feedback"
            value={stats.userFeedback.totalFeedback}
            color="white"
          />
          <StatCard
            label="Average Rating"
            value={`${stats.userFeedback.averageRating.toFixed(1)}/5`}
            color={stats.userFeedback.averageRating >= 4 ? 'white' : 'orange'}
          />
        </div>

        {/* Feedback by Type */}
        {Object.keys(stats.userFeedback.byType).length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-bitcoin-white-80 mb-3">Feedback by Type</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(stats.userFeedback.byType).map(([type, count]) => (
                <div key={type} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
                  <div className="text-bitcoin-white-60 text-sm uppercase">{type.replace('_', ' ')}</div>
                  <div className="text-bitcoin-white text-xl font-mono font-bold">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        {stats.userFeedback.recentFeedback.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-bitcoin-white-80 mb-3">Recent Feedback</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.userFeedback.recentFeedback.map((feedback, index) => (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-bitcoin-white-80 text-sm font-semibold">
                      {feedback.feedbackType.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      {feedback.rating && (
                        <span className="text-bitcoin-orange font-mono font-bold">
                          {feedback.rating}/5
                        </span>
                      )}
                      <span className="text-bitcoin-white-60 text-xs">
                        {new Date(feedback.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {feedback.comment && (
                    <div className="text-bitcoin-white-80 text-sm mt-2">{feedback.comment}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  color?: 'white' | 'orange';
}

function StatCard({ label, value, color = 'white' }: StatCardProps) {
  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
      <div className="text-bitcoin-white-60 text-xs uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`font-mono text-2xl font-bold ${
        color === 'orange' ? 'text-bitcoin-orange' : 'text-bitcoin-white'
      }`}>
        {value}
      </div>
    </div>
  );
}
