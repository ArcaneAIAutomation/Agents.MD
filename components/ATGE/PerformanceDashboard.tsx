import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import PerformanceSummaryCard, { PerformanceStats } from './PerformanceSummaryCard';
import ProofOfPerformance, { ProofStats } from './ProofOfPerformance';
import VisualAnalytics, { AnalyticsData } from './VisualAnalytics';
import AdvancedMetrics, { AdvancedMetricsData } from './AdvancedMetrics';
import RecentTradeHistory from './RecentTradeHistory';

interface PerformanceDashboardProps {
  symbol: string;
  onViewAllTrades?: () => void;
  className?: string;
  lastGeneratedAt?: Date | null;
}

// Mobile viewport detection hook
function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return { isMobile, isTablet };
}

export default function PerformanceDashboard({
  symbol,
  onViewAllTrades,
  className = '',
  lastGeneratedAt
}: PerformanceDashboardProps) {
  const { isMobile, isTablet } = useMobileViewport();
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [proofStats, setProofStats] = useState<ProofStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetricsData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false); // Disabled by default
  const [refreshingTrades, setRefreshingTrades] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Fetch performance statistics
  const fetchPerformanceStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to /api/atge/stats
      // For now, using mock data
      const response = await fetch(`/api/atge/stats?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance statistics');
      }

      const data = await response.json();

      // Set performance stats
      setPerformanceStats(data.performanceStats || null);
      setProofStats(data.proofStats || null);
      setAnalyticsData(data.analyticsData || null);
      setAdvancedMetrics(data.advancedMetrics || null);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching performance stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
      
      // Set null data on error
      setPerformanceStats(null);
      setProofStats(null);
      setAnalyticsData(null);
      setAdvancedMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh when new trade is generated
  useEffect(() => {
    fetchPerformanceStats();
  }, [symbol, lastGeneratedAt]); // Refresh when lastGeneratedAt changes

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPerformanceStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, symbol]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchPerformanceStats();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  // Handle refresh trades (verify all active trades)
  const handleRefreshTrades = async () => {
    try {
      setRefreshingTrades(true);
      setRefreshMessage(null);

      const response = await fetch('/api/atge/verify-trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify trades');
      }

      const data = await response.json();

      if (data.success) {
        setRefreshMessage(
          `✅ Verified ${data.verified} trades. ${data.updated} updated.`
        );
        
        // Also refresh the performance stats after verification
        await fetchPerformanceStats();
        
        // Clear message after 5 seconds
        setTimeout(() => setRefreshMessage(null), 5000);
      } else {
        throw new Error(data.errors?.[0] || 'Verification failed');
      }
    } catch (err) {
      console.error('Error refreshing trades:', err);
      setRefreshMessage(
        `❌ ${err instanceof Error ? err.message : 'Failed to verify trades'}`
      );
      
      // Clear error message after 5 seconds
      setTimeout(() => setRefreshMessage(null), 5000);
    } finally {
      setRefreshingTrades(false);
    }
  };

  // Error state
  if (error && !loading) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 ${className}`}>
        <div className="text-center max-w-md mx-auto">
          <AlertCircle size={48} className="text-bitcoin-orange mx-auto mb-4" />
          <h3 className="text-xl font-bold text-bitcoin-white mb-3">
            Failed to Load Performance Data
          </h3>
          <p className="text-bitcoin-white-60 mb-6">
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 bg-bitcoin-orange text-bitcoin-black font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 md:space-y-6 ${className}`}>
      {/* Dashboard Header with Controls - Mobile Optimized */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className={isMobile ? 'text-center' : ''}>
            <h2 className={`font-bold text-bitcoin-white mb-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              Performance Dashboard
            </h2>
            <p className={`text-bitcoin-white-60 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {symbol} • {isMobile ? 'Real-time metrics' : 'Real-time performance metrics and analytics'}
            </p>
          </div>

          <div className={`flex items-center gap-2 md:gap-3 ${isMobile ? 'flex-col w-full' : ''}`}>
            {/* Refresh Trades button - Verify all active trades */}
            <button
              onClick={handleRefreshTrades}
              disabled={refreshingTrades}
              className={`flex items-center justify-center gap-2 bg-bitcoin-orange text-bitcoin-black font-bold px-4 py-2 min-h-[48px] rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'w-full' : ''}`}
              title="Verify all active trades against live market data"
            >
              <RefreshCw size={16} className={refreshingTrades ? 'animate-spin' : ''} />
              <span className={isMobile ? 'text-xs' : ''}>
                {refreshingTrades ? 'Verifying...' : 'Refresh Trades'}
              </span>
            </button>

            {/* Manual refresh button - Touch-friendly */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`flex items-center justify-center gap-2 bg-bitcoin-orange text-bitcoin-black font-bold px-4 py-2 min-h-[48px] rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'w-full' : ''}`}
              title="Refresh performance statistics"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className={isMobile ? 'text-xs' : ''}>
                {loading ? 'Loading...' : 'Refresh Stats'}
              </span>
            </button>
          </div>
        </div>

        {/* Refresh message */}
        {refreshMessage && (
          <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
            <p className={`text-bitcoin-orange font-semibold ${isMobile ? 'text-xs text-center' : 'text-sm'}`}>
              {refreshMessage}
            </p>
          </div>
        )}

        {/* Last updated timestamp */}
        {lastUpdated && (
          <div className={`${refreshMessage ? 'mt-2' : 'mt-4'} pt-4 border-t border-bitcoin-orange-20`}>
            <p className={`text-bitcoin-white-60 ${isMobile ? 'text-xs text-center' : 'text-xs'}`}>
              Last Updated: {isMobile ? lastUpdated.toLocaleTimeString() : lastUpdated.toLocaleString()}
              {autoRefresh && !isMobile && ' • Auto-refreshing every 30 seconds'}
            </p>
          </div>
        )}
      </div>

      {/* Performance Summary Card */}
      <PerformanceSummaryCard
        stats={performanceStats}
        loading={loading}
      />

      {/* Proof of Performance Section */}
      <ProofOfPerformance
        stats={proofStats}
        loading={loading}
        onViewAllTrades={onViewAllTrades}
      />

      {/* Visual Analytics */}
      <VisualAnalytics
        data={analyticsData}
        loading={loading}
      />

      {/* Advanced Metrics */}
      <AdvancedMetrics
        data={advancedMetrics}
        loading={loading}
      />

      {/* Recent Trade History */}
      <RecentTradeHistory
        symbol={symbol}
        lastGeneratedAt={lastGeneratedAt}
      />

      {/* Disclaimer - Mobile Optimized */}
      <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-4 md:p-6 text-center">
        <p className={`text-bitcoin-white-60 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          ⚠️ <strong className="text-bitcoin-white">Disclaimer:</strong> Past performance does not guarantee future results. 
          {isMobile ? (
            <> All trades use 100% real data. Trading involves risk.</>
          ) : (
            <> All trades are backtested using 100% real historical data with standardized $1000 trade sizes. 
            Trading cryptocurrencies involves substantial risk of loss.</>
          )}
        </p>
      </div>

      {/* Methodology Link - Touch-friendly */}
      <div className="text-center">
        <button
          onClick={() => {
            // TODO: Open methodology modal or navigate to methodology page
            console.log('Open methodology documentation');
          }}
          className={`text-bitcoin-orange hover:text-bitcoin-white transition-colors underline min-h-[44px] inline-flex items-center ${isMobile ? 'text-xs' : 'text-sm'}`}
        >
          View Detailed Backtesting Methodology
        </button>
      </div>
    </div>
  );
}
