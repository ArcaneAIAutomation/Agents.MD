import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Database, Clock } from 'lucide-react';

/**
 * Data Source Health Panel Component
 * 
 * Displays health status for all 13+ API data sources used by Einstein Engine.
 * Shows real-time status indicators, response times, and overall health score.
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 * 
 * Features:
 * - Green checkmark for successful sources
 * - Red X for failed sources
 * - Orange warning for slow sources (>5s)
 * - Response time display for each source
 * - Overall health score percentage
 * - Bitcoin Sovereign styling (black, orange, white)
 */

interface DataSource {
  name: string;
  status: 'SUCCESS' | 'FAILED' | 'SLOW';
  responseTime: number; // milliseconds
  error?: string;
}

interface DataSourceHealth {
  overall: number; // 0-100 percentage
  sources: DataSource[];
  lastChecked: string; // ISO timestamp
}

interface DataSourceHealthPanelProps {
  health: DataSourceHealth | null;
  loading?: boolean;
  className?: string;
}

/**
 * Format response time for display
 * Requirements: 18.3
 */
const formatResponseTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Get status icon based on source status
 * Requirements: 18.2, 18.3, 18.4
 */
const getStatusIcon = (status: 'SUCCESS' | 'FAILED' | 'SLOW') => {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle size={20} className="text-bitcoin-orange" />;
    case 'FAILED':
      return <XCircle size={20} className="text-red-500" />;
    case 'SLOW':
      return <AlertTriangle size={20} className="text-bitcoin-orange" />;
  }
};

/**
 * Get status color class
 * Requirements: 18.2, 18.3, 18.4
 */
const getStatusColor = (status: 'SUCCESS' | 'FAILED' | 'SLOW'): string => {
  switch (status) {
    case 'SUCCESS':
      return 'text-bitcoin-orange';
    case 'FAILED':
      return 'text-red-500';
    case 'SLOW':
      return 'text-bitcoin-orange';
  }
};

/**
 * Get overall health color based on percentage
 * Requirements: 18.5
 */
const getHealthColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-bitcoin-orange';
  if (percentage >= 70) return 'text-bitcoin-white';
  return 'text-red-500';
};

/**
 * Get health status text
 * Requirements: 18.5
 */
const getHealthStatus = (percentage: number): string => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 50) return 'Fair';
  return 'Poor';
};

export default function DataSourceHealthPanel({
  health,
  loading = false,
  className = ''
}: DataSourceHealthPanelProps) {
  // Loading state
  if (loading) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Database size={24} className="text-bitcoin-orange" />
          <h3 className="text-xl font-bold text-bitcoin-white">
            Data Source Health
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-bitcoin-orange-20 border-t-bitcoin-orange"></div>
        </div>
        <p className="text-center text-bitcoin-white-60 text-sm">
          Checking data sources...
        </p>
      </div>
    );
  }

  // No data state
  if (!health) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Database size={24} className="text-bitcoin-orange" />
          <h3 className="text-xl font-bold text-bitcoin-white">
            Data Source Health
          </h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle size={48} className="text-bitcoin-white-60 mx-auto mb-3" />
          <p className="text-bitcoin-white-80">
            No health data available
          </p>
          <p className="text-bitcoin-white-60 text-sm mt-2">
            Generate a trade signal to check data sources
          </p>
        </div>
      </div>
    );
  }

  // Calculate successful and failed counts
  const successCount = health.sources.filter(s => s.status === 'SUCCESS').length;
  const failedCount = health.sources.filter(s => s.status === 'FAILED').length;
  const slowCount = health.sources.filter(s => s.status === 'SLOW').length;
  const totalCount = health.sources.length;

  return (
    <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database size={24} className="text-bitcoin-orange" />
          <h3 className="text-xl font-bold text-bitcoin-white">
            Data Source Health
          </h3>
        </div>
        
        {/* Last Checked Timestamp */}
        <div className="flex items-center gap-2 text-bitcoin-white-60 text-sm">
          <Clock size={16} />
          <span>
            {new Date(health.lastChecked).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Overall Health Score - Requirements: 18.5 */}
      <div className="mb-6 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-bitcoin-white-60 text-sm font-semibold uppercase">
            Overall Health Score
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold font-mono ${getHealthColor(health.overall)}`}>
              {health.overall}%
            </span>
            <span className={`text-sm font-semibold ${getHealthColor(health.overall)}`}>
              {getHealthStatus(health.overall)}
            </span>
          </div>
        </div>
        
        {/* Health Score Progress Bar */}
        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-3">
          <div 
            className={`h-full rounded-full transition-all ${
              health.overall >= 90 ? 'bg-bitcoin-orange' : 
              health.overall >= 70 ? 'bg-bitcoin-white' : 
              'bg-red-500'
            }`}
            style={{ width: `${health.overall}%` }}
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <p className="text-bitcoin-orange font-bold font-mono text-lg">
              {successCount}
            </p>
            <p className="text-bitcoin-white-60 text-xs uppercase">
              Success
            </p>
          </div>
          <div className="text-center">
            <p className="text-bitcoin-orange font-bold font-mono text-lg">
              {slowCount}
            </p>
            <p className="text-bitcoin-white-60 text-xs uppercase">
              Slow
            </p>
          </div>
          <div className="text-center">
            <p className="text-red-500 font-bold font-mono text-lg">
              {failedCount}
            </p>
            <p className="text-bitcoin-white-60 text-xs uppercase">
              Failed
            </p>
          </div>
        </div>
      </div>

      {/* Individual Data Sources - Requirements: 18.1, 18.2, 18.3, 18.4 */}
      <div className="space-y-2">
        <p className="text-bitcoin-white-60 text-sm font-semibold uppercase mb-3">
          Data Sources ({totalCount})
        </p>
        
        {health.sources.map((source, index) => (
          <div
            key={index}
            className={`bg-bitcoin-orange bg-opacity-5 border rounded-lg p-3 transition-all ${
              source.status === 'SUCCESS' 
                ? 'border-bitcoin-orange-20 hover:border-bitcoin-orange' 
                : source.status === 'SLOW'
                ? 'border-bitcoin-orange-20 hover:border-bitcoin-orange'
                : 'border-red-500 border-opacity-30 hover:border-red-500'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Source Name and Status Icon */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(source.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-bitcoin-white-80 font-semibold text-sm truncate">
                    {source.name}
                  </p>
                  {source.error && (
                    <p className="text-red-500 text-xs mt-1 truncate">
                      {source.error}
                    </p>
                  )}
                </div>
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`font-mono text-sm font-semibold ${getStatusColor(source.status)}`}>
                  {formatResponseTime(source.responseTime)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning Message for Low Health */}
      {health.overall < 70 && (
        <div className="mt-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-semibold text-sm">
                Low Data Quality Warning
              </p>
              <p className="text-bitcoin-white-80 text-xs mt-1">
                Some data sources are unavailable. Trade signals may have reduced accuracy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
