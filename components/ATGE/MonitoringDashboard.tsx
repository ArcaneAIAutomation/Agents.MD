import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface MonitoringData {
  timestamp: string;
  cronJobStatus: {
    lastRun: string | null;
    runsToday: number;
    failuresLast24h: number;
    status: 'healthy' | 'warning' | 'error';
  };
  tradeVerification: {
    totalActiveTrades: number;
    verifiedLast24h: number;
    failedVerifications: number;
    averageVerificationTime: number;
    status: 'healthy' | 'warning' | 'error';
  };
  apiCosts: {
    openaiCalls: number;
    estimatedCost: number;
    monthlyProjection: number;
    status: 'healthy' | 'warning' | 'error';
  };
  marketDataAPI: {
    coinMarketCapCalls: number;
    coinGeckoCalls: number;
    failureRate: number;
    status: 'healthy' | 'warning' | 'error';
  };
  systemHealth: {
    databaseConnected: boolean;
    recentErrors: number;
    performanceIssues: number;
    status: 'healthy' | 'warning' | 'error';
  };
  overallStatus: 'healthy' | 'warning' | 'error';
  alerts: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    action: string;
  }>;
}

const StatusIcon: React.FC<{ status: 'healthy' | 'warning' | 'error' }> = ({ status }) => {
  if (status === 'healthy') {
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  } else if (status === 'warning') {
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  } else {
    return <XCircle className="w-5 h-5 text-red-500" />;
  }
};

const MonitoringDashboard: React.FC = () => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/atge/monitoring');
      
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchMonitoringData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <p className="text-bitcoin-white-80">Loading monitoring data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bitcoin-black border border-red-500 rounded-xl p-6">
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={fetchMonitoringData}
          className="mt-4 bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded-lg font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-bitcoin-white">
            ATGE Production Monitoring
          </h2>
          <button
            onClick={fetchMonitoringData}
            disabled={loading}
            className="flex items-center gap-2 bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded-lg font-bold hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-3">
          <StatusIcon status={data.overallStatus} />
          <span className="text-bitcoin-white-80">
            Overall Status: <span className="font-bold text-bitcoin-white">
              {data.overallStatus.toUpperCase()}
            </span>
          </span>
          <span className="text-bitcoin-white-60 text-sm ml-auto">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="bg-bitcoin-black border-2 border-red-500 rounded-xl p-6">
          <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Active Alerts ({data.alerts.length})
          </h3>
          <div className="space-y-3">
            {data.alerts.map((alert, index) => (
              <div key={index} className="border-l-4 border-bitcoin-orange pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold ${
                    alert.severity === 'CRITICAL' ? 'text-red-500' :
                    alert.severity === 'HIGH' ? 'text-orange-500' :
                    alert.severity === 'MEDIUM' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`}>
                    [{alert.severity}]
                  </span>
                  <span className="text-bitcoin-white">{alert.message}</span>
                </div>
                <p className="text-bitcoin-white-60 text-sm">
                  Action: {alert.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cron Job Status */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-bitcoin-white">Cron Job Status</h3>
            <StatusIcon status={data.cronJobStatus.status} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Last Run:</span>
              <span className="text-bitcoin-white font-mono">
                {data.cronJobStatus.lastRun 
                  ? new Date(data.cronJobStatus.lastRun).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Runs Today:</span>
              <span className="text-bitcoin-orange font-bold">
                {data.cronJobStatus.runsToday}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Failures (24h):</span>
              <span className="text-bitcoin-white font-bold">
                {data.cronJobStatus.failuresLast24h}
              </span>
            </div>
          </div>
        </div>

        {/* Trade Verification */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-bitcoin-white">Trade Verification</h3>
            <StatusIcon status={data.tradeVerification.status} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Active Trades:</span>
              <span className="text-bitcoin-orange font-bold">
                {data.tradeVerification.totalActiveTrades}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Verified (24h):</span>
              <span className="text-bitcoin-white font-bold">
                {data.tradeVerification.verifiedLast24h}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Failed:</span>
              <span className="text-bitcoin-white font-bold">
                {data.tradeVerification.failedVerifications}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Avg Time:</span>
              <span className="text-bitcoin-white font-mono">
                {data.tradeVerification.averageVerificationTime}s
              </span>
            </div>
          </div>
        </div>

        {/* API Costs */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-bitcoin-white">API Costs (OpenAI)</h3>
            <StatusIcon status={data.apiCosts.status} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Calls (24h):</span>
              <span className="text-bitcoin-white font-bold">
                {data.apiCosts.openaiCalls}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Cost (24h):</span>
              <span className="text-bitcoin-orange font-bold font-mono">
                ${data.apiCosts.estimatedCost}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Monthly Projection:</span>
              <span className={`font-bold font-mono ${
                data.apiCosts.monthlyProjection > 100 ? 'text-red-500' : 'text-green-500'
              }`}>
                ${data.apiCosts.monthlyProjection}
              </span>
            </div>
          </div>
        </div>

        {/* Market Data API */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-bitcoin-white">Market Data API</h3>
            <StatusIcon status={data.marketDataAPI.status} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">CoinMarketCap:</span>
              <span className="text-bitcoin-white font-bold">
                {data.marketDataAPI.coinMarketCapCalls}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">CoinGecko:</span>
              <span className="text-bitcoin-white font-bold">
                {data.marketDataAPI.coinGeckoCalls}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Failure Rate:</span>
              <span className={`font-bold ${
                data.marketDataAPI.failureRate > 5 ? 'text-red-500' : 'text-green-500'
              }`}>
                {data.marketDataAPI.failureRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-bitcoin-white">System Health</h3>
          <StatusIcon status={data.systemHealth.status} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-bitcoin-white-60">Database:</span>
            <span className={`font-bold ${
              data.systemHealth.databaseConnected ? 'text-green-500' : 'text-red-500'
            }`}>
              {data.systemHealth.databaseConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-bitcoin-white-60">Recent Errors:</span>
            <span className="text-bitcoin-white font-bold">
              {data.systemHealth.recentErrors}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-bitcoin-white-60">Performance Issues:</span>
            <span className="text-bitcoin-white font-bold">
              {data.systemHealth.performanceIssues}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
