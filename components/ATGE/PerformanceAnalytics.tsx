/**
 * ATGE Performance Analytics Dashboard Component
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Displays comprehensive analytics including:
 * - Win rate chart (line graph over time)
 * - Profit/loss distribution (histogram)
 * - Best/worst trades table (top 5 each)
 * - Symbol performance comparison (BTC vs ETH)
 * - Timeframe performance breakdown
 * 
 * Requirements: 2.4
 */

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Pattern {
  indicator: string;
  condition: string;
  occurrenceInWinning: number;
  occurrenceInLosing: number;
  winningPercentage: number;
  losingPercentage: number;
  predictivePower: number;
  pValue: number;
  isSignificant: boolean;
  confidence: number;
}

interface PatternData {
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    expiredTrades: number;
    winRate: number;
  };
  patterns: {
    successFactors: Pattern[];
    failureFactors: Pattern[];
  };
}

interface BatchAnalysisData {
  aggregateStats: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    totalProfitLoss: number;
    largestWin: number;
    largestLoss: number;
    averageTradeDuration: number;
  };
  bestConditions: {
    rsiRanges: Array<{
      range: string;
      winRate: number;
      avgProfitLoss: number;
      tradeCount: number;
    }>;
    macdSignals: Array<{
      signal: string;
      winRate: number;
      avgProfitLoss: number;
      tradeCount: number;
    }>;
    timeframes: Array<{
      timeframe: string;
      winRate: number;
      avgProfitLoss: number;
      tradeCount: number;
    }>;
    marketConditions: Array<{
      condition: string;
      winRate: number;
      avgProfitLoss: number;
      tradeCount: number;
    }>;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'entry' | 'exit' | 'risk' | 'timing' | 'position_sizing';
    recommendation: string;
    potentialImpact: string;
    confidence: number;
  }>;
}

interface AnalyticsData {
  winRateOverTime: {
    daily: Array<{
      date: string;
      winRate: number;
      totalTrades: number;
      winningTrades: number;
    }>;
    weekly: Array<{
      week: string;
      winRate: number;
      totalTrades: number;
      winningTrades: number;
    }>;
  };
  profitLossDistribution: Array<{
    bucket: string;
    count: number;
    percentage: number;
  }>;
  bestTrades: Array<{
    id: string;
    symbol: string;
    entryPrice: number;
    exitPrice: number;
    profitLoss: number;
    profitLossPercentage: number;
    timeframe: string;
    generatedAt: string;
  }>;
  worstTrades: Array<{
    id: string;
    symbol: string;
    entryPrice: number;
    exitPrice: number;
    profitLoss: number;
    profitLossPercentage: number;
    timeframe: string;
    generatedAt: string;
  }>;
  symbolPerformance: {
    BTC: {
      totalTrades: number;
      winRate: number;
      totalProfitLoss: number;
      averageProfitLoss: number;
    };
    ETH: {
      totalTrades: number;
      winRate: number;
      totalProfitLoss: number;
      averageProfitLoss: number;
    };
  };
  timeframePerformance: Array<{
    timeframe: string;
    totalTrades: number;
    winRate: number;
    totalProfitLoss: number;
    averageProfitLoss: number;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
  totalTradesAnalyzed: number;
}

interface PerformanceAnalyticsProps {
  userId?: string;
  initialFilters?: {
    startDate?: string;
    endDate?: string;
    symbol?: string;
    status?: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PerformanceAnalytics({ userId, initialFilters }: PerformanceAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [patterns, setPatterns] = useState<PatternData | null>(null);
  const [batchAnalysis, setBatchAnalysis] = useState<BatchAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patternsError, setPatternsError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [timeView, setTimeView] = useState<'daily' | 'weekly'>('daily');
  
  // Filter state
  const [dateRange, setDateRange] = useState<string>(initialFilters?.startDate && initialFilters?.endDate ? 'custom' : '30');
  const [symbol, setSymbol] = useState<string>(initialFilters?.symbol || 'all');
  const [status, setStatus] = useState<string>(initialFilters?.status || 'all');
  const [customStartDate, setCustomStartDate] = useState<string>(initialFilters?.startDate || '');
  const [customEndDate, setCustomEndDate] = useState<string>(initialFilters?.endDate || '');

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
    fetchPatterns();
    fetchBatchAnalysis();
  }, [dateRange, symbol, status, customStartDate, customEndDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Calculate date range based on selection
      if (dateRange === 'custom') {
        if (customStartDate) params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      } else if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }
      
      // Add symbol filter
      if (symbol !== 'all') {
        params.append('symbol', symbol);
      }
      
      // Add status filter
      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/atge/analytics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatterns = async () => {
    setPatternsLoading(true);
    setPatternsError(null);

    try {
      const response = await fetch('/api/atge/patterns');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pattern analysis');
      }

      const data = await response.json();
      
      if (data.success) {
        setPatterns(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch pattern analysis');
      }
    } catch (err) {
      console.error('Error fetching patterns:', err);
      setPatternsError(err instanceof Error ? err.message : 'Failed to fetch pattern analysis');
    } finally {
      setPatternsLoading(false);
    }
  };

  const fetchBatchAnalysis = async () => {
    setBatchLoading(true);
    setBatchError(null);

    try {
      // Build query parameters (same as analytics)
      const params = new URLSearchParams();
      
      // Calculate date range based on selection
      if (dateRange === 'custom') {
        if (customStartDate) params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      } else if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }
      
      // Add symbol filter
      if (symbol !== 'all') {
        params.append('symbol', symbol);
      }
      
      // Add status filter
      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/atge/batch-analysis?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch batch analysis');
      }

      const data = await response.json();
      
      if (data.success) {
        setBatchAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Failed to fetch batch analysis');
      }
    } catch (err) {
      console.error('Error fetching batch analysis:', err);
      setBatchError(err instanceof Error ? err.message : 'Failed to fetch batch analysis');
    } finally {
      setBatchLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!analytics) return;

    // Prepare CSV data
    const csvRows: string[] = [];
    
    // Header
    csvRows.push('Trade ID,Symbol,Entry Price,Exit Price,Profit/Loss (USD),Profit/Loss (%),Timeframe,Status,Generated At');
    
    // Combine best and worst trades for export
    const allTrades = [...analytics.bestTrades, ...analytics.worstTrades];
    
    // Add data rows
    allTrades.forEach(trade => {
      csvRows.push([
        trade.id,
        trade.symbol,
        trade.entryPrice.toFixed(2),
        trade.exitPrice.toFixed(2),
        trade.profitLoss.toFixed(2),
        trade.profitLossPercentage.toFixed(2),
        trade.timeframe,
        trade.profitLoss >= 0 ? 'Profit' : 'Loss',
        new Date(trade.generatedAt).toLocaleString()
      ].join(','));
    });
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `atge-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bitcoin-orange"></div>
          <span className="ml-4 text-bitcoin-white-80">Loading analytics...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
        <h3 className="text-bitcoin-orange font-bold text-xl mb-2">Error Loading Analytics</h3>
        <p className="text-bitcoin-white-80 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="bg-bitcoin-orange text-bitcoin-black font-bold px-6 py-2 rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!analytics || analytics.totalTradesAnalyzed === 0) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-8">
        <h3 className="text-bitcoin-white font-bold text-xl mb-2">No Analytics Data</h3>
        <p className="text-bitcoin-white-60">
          Generate some trades to see performance analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-bitcoin-black border-b-2 border-bitcoin-orange px-6 py-4 rounded-t-xl">
        <h2 className="text-2xl font-bold text-bitcoin-white">Performance Analytics</h2>
        <p className="text-sm text-bitcoin-white-60 italic mt-1">
          Analyzing {analytics.totalTradesAnalyzed} trades from{' '}
          {new Date(analytics.dateRange.start).toLocaleDateString()} to{' '}
          {new Date(analytics.dateRange.end).toLocaleDateString()}
        </p>
      </div>

      {/* Filters and Export */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-bitcoin-white-60 text-sm font-semibold mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-bitcoin-black border border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-4 py-2 focus:border-bitcoin-orange focus:outline-none transition-all"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Symbol Filter */}
          <div>
            <label className="block text-bitcoin-white-60 text-sm font-semibold mb-2">
              Symbol
            </label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-bitcoin-black border border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-4 py-2 focus:border-bitcoin-orange focus:outline-none transition-all"
            >
              <option value="all">All Symbols</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-bitcoin-white-60 text-sm font-semibold mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-bitcoin-black border border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-4 py-2 focus:border-bitcoin-orange focus:outline-none transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Export Button */}
          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              disabled={!analytics || analytics.totalTradesAnalyzed === 0}
              className="w-full bg-bitcoin-orange text-bitcoin-black font-bold px-6 py-2 rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-bitcoin-orange-20">
            <div>
              <label className="block text-bitcoin-white-60 text-sm font-semibold mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-bitcoin-black border border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-4 py-2 focus:border-bitcoin-orange focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-bitcoin-white-60 text-sm font-semibold mb-2">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-bitcoin-black border border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-4 py-2 focus:border-bitcoin-orange focus:outline-none transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Win Rate Over Time Chart */}
      <WinRateChart
        data={timeView === 'daily' ? analytics.winRateOverTime.daily : analytics.winRateOverTime.weekly}
        timeView={timeView}
        onTimeViewChange={setTimeView}
      />

      {/* Profit/Loss Distribution Histogram */}
      <PLDistributionChart data={analytics.profitLossDistribution} />

      {/* Symbol Performance Comparison */}
      <SymbolPerformanceComparison data={analytics.symbolPerformance} />

      {/* Timeframe Performance */}
      <TimeframePerformance data={analytics.timeframePerformance} />

      {/* Pattern Recognition */}
      <PatternRecognition 
        patterns={patterns}
        loading={patternsLoading}
        error={patternsError}
        onRetry={fetchPatterns}
      />

      {/* Batch Analysis */}
      <BatchAnalysis
        batchAnalysis={batchAnalysis}
        loading={batchLoading}
        error={batchError}
        onRetry={fetchBatchAnalysis}
        filters={{ symbol, dateRange, status }}
      />

      {/* Recommendations Section */}
      <RecommendationsSection
        recommendations={batchAnalysis?.recommendations || []}
        loading={batchLoading}
        error={batchError}
        onRetry={fetchBatchAnalysis}
      />

      {/* Best/Worst Trades Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BestTradesTable trades={analytics.bestTrades} />
        <WorstTradesTable trades={analytics.worstTrades} />
      </div>
    </div>
  );
}

// ============================================================================
// WIN RATE CHART COMPONENT
// ============================================================================

interface WinRateChartProps {
  data: Array<{
    date?: string;
    week?: string;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
  }>;
  timeView: 'daily' | 'weekly';
  onTimeViewChange: (view: 'daily' | 'weekly') => void;
}

function WinRateChart({ data, timeView, onTimeViewChange }: WinRateChartProps) {
  const chartData = {
    labels: data.map(d => d.date || d.week || '').reverse(),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: data.map(d => d.winRate).reverse(),
        borderColor: '#F7931A',
        backgroundColor: 'rgba(247, 147, 26, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#F7931A',
        pointBorderColor: '#000000',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#FFFFFF',
        bodyColor: '#F7931A',
        borderColor: '#F7931A',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const dataPoint = data[data.length - 1 - index];
            return [
              `Win Rate: ${context.parsed.y.toFixed(2)}%`,
              `Winning: ${dataPoint.winningTrades}/${dataPoint.totalTrades} trades`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(247, 147, 26, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(247, 147, 26, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value) => `${value}%`
        },
        min: 0,
        max: 100
      }
    }
  };

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-bitcoin-white">Win Rate Over Time</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onTimeViewChange('daily')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              timeView === 'daily'
                ? 'bg-bitcoin-orange text-bitcoin-black'
                : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => onTimeViewChange('weekly')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              timeView === 'weekly'
                ? 'bg-bitcoin-orange text-bitcoin-black'
                : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

// ============================================================================
// P/L DISTRIBUTION CHART COMPONENT
// ============================================================================

interface PLDistributionChartProps {
  data: Array<{
    bucket: string;
    count: number;
    percentage: number;
  }>;
}

function PLDistributionChart({ data }: PLDistributionChartProps) {
  const chartData = {
    labels: data.map(d => d.bucket),
    datasets: [
      {
        label: 'Number of Trades',
        data: data.map(d => d.count),
        backgroundColor: data.map(d => {
          // Color bars based on profit/loss
          if (d.bucket.includes('-') && !d.bucket.startsWith('0')) {
            return 'rgba(247, 147, 26, 0.3)'; // Loss - lighter orange
          } else {
            return 'rgba(247, 147, 26, 0.8)'; // Profit - brighter orange
          }
        }),
        borderColor: '#F7931A',
        borderWidth: 1
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#FFFFFF',
        bodyColor: '#F7931A',
        borderColor: '#F7931A',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const dataPoint = data[index];
            return [
              `Trades: ${dataPoint.count}`,
              `Percentage: ${dataPoint.percentage.toFixed(2)}%`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(247, 147, 26, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(247, 147, 26, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      }
    }
  };

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-xl font-bold text-bitcoin-white mb-4">Profit/Loss Distribution</h3>
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

// ============================================================================
// SYMBOL PERFORMANCE COMPARISON COMPONENT
// ============================================================================

interface SymbolPerformanceComparisonProps {
  data: {
    BTC: {
      totalTrades: number;
      winRate: number;
      totalProfitLoss: number;
      averageProfitLoss: number;
    };
    ETH: {
      totalTrades: number;
      winRate: number;
      totalProfitLoss: number;
      averageProfitLoss: number;
    };
  };
}

function SymbolPerformanceComparison({ data }: SymbolPerformanceComparisonProps) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-xl font-bold text-bitcoin-white mb-4">Symbol Performance Comparison</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BTC Performance */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <h4 className="text-lg font-bold text-bitcoin-orange mb-3">Bitcoin (BTC)</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Total Trades:</span>
              <span className="font-mono text-bitcoin-white font-bold">{data.BTC.totalTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Win Rate:</span>
              <span className="font-mono text-bitcoin-orange font-bold">{data.BTC.winRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Total P/L:</span>
              <span className={`font-mono font-bold ${data.BTC.totalProfitLoss >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
                ${data.BTC.totalProfitLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Avg P/L:</span>
              <span className={`font-mono font-bold ${data.BTC.averageProfitLoss >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
                ${data.BTC.averageProfitLoss.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ETH Performance */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <h4 className="text-lg font-bold text-bitcoin-orange mb-3">Ethereum (ETH)</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Total Trades:</span>
              <span className="font-mono text-bitcoin-white font-bold">{data.ETH.totalTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Win Rate:</span>
              <span className="font-mono text-bitcoin-orange font-bold">{data.ETH.winRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Total P/L:</span>
              <span className={`font-mono font-bold ${data.ETH.totalProfitLoss >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
                ${data.ETH.totalProfitLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-bitcoin-white-60">Avg P/L:</span>
              <span className={`font-mono font-bold ${data.ETH.averageProfitLoss >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
                ${data.ETH.averageProfitLoss.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TIMEFRAME PERFORMANCE COMPONENT
// ============================================================================

interface TimeframePerformanceProps {
  data: Array<{
    timeframe: string;
    totalTrades: number;
    winRate: number;
    totalProfitLoss: number;
    averageProfitLoss: number;
  }>;
}

function TimeframePerformance({ data }: TimeframePerformanceProps) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-xl font-bold text-bitcoin-white mb-4">Timeframe Performance</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bitcoin-orange-20">
              <th className="text-left py-3 px-4 text-bitcoin-white-60 font-semibold">Timeframe</th>
              <th className="text-right py-3 px-4 text-bitcoin-white-60 font-semibold">Trades</th>
              <th className="text-right py-3 px-4 text-bitcoin-white-60 font-semibold">Win Rate</th>
              <th className="text-right py-3 px-4 text-bitcoin-white-60 font-semibold">Total P/L</th>
              <th className="text-right py-3 px-4 text-bitcoin-white-60 font-semibold">Avg P/L</th>
            </tr>
          </thead>
          <tbody>
            {data.map((tf, index) => (
              <tr key={tf.timeframe} className={index !== data.length - 1 ? 'border-b border-bitcoin-orange-10' : ''}>
                <td className="py-3 px-4 text-bitcoin-orange font-bold">{tf.timeframe}</td>
                <td className="py-3 px-4 text-right font-mono text-bitcoin-white">{tf.totalTrades}</td>
                <td className="py-3 px-4 text-right font-mono text-bitcoin-orange font-bold">{tf.winRate.toFixed(2)}%</td>
                <td className={`py-3 px-4 text-right font-mono font-bold ${tf.totalProfitLoss >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
                  ${tf.totalProfitLoss.toFixed(2)}
                </td>
                <td className={`py-3 px-4 text-right font-mono font-bold ${tf.averageProfitLoss >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
                  ${tf.averageProfitLoss.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// BEST TRADES TABLE COMPONENT
// ============================================================================

interface BestTradesTableProps {
  trades: Array<{
    id: string;
    symbol: string;
    entryPrice: number;
    exitPrice: number;
    profitLoss: number;
    profitLossPercentage: number;
    timeframe: string;
    generatedAt: string;
  }>;
}

function BestTradesTable({ trades }: BestTradesTableProps) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-xl font-bold text-bitcoin-orange mb-4">🏆 Top 5 Best Trades</h3>
      {trades.length === 0 ? (
        <p className="text-bitcoin-white-60">No profitable trades yet.</p>
      ) : (
        <div className="space-y-3">
          {trades.map((trade, index) => (
            <div key={trade.id} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-bitcoin-orange font-bold text-lg">#{index + 1}</span>
                  <span className="text-bitcoin-white font-bold">{trade.symbol}</span>
                  <span className="text-bitcoin-white-60 text-sm">{trade.timeframe}</span>
                </div>
                <span className="font-mono text-bitcoin-orange font-bold">
                  +${trade.profitLoss.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-bitcoin-white-60">Entry: </span>
                  <span className="font-mono text-bitcoin-white">${trade.entryPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-bitcoin-white-60">Exit: </span>
                  <span className="font-mono text-bitcoin-white">${trade.exitPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-bitcoin-white-60">Gain: </span>
                  <span className="font-mono text-bitcoin-orange font-bold">+{trade.profitLossPercentage.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-bitcoin-white-60">Date: </span>
                  <span className="text-bitcoin-white-60 text-xs">{new Date(trade.generatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PATTERN RECOGNITION COMPONENT
// ============================================================================

interface PatternRecognitionProps {
  patterns: PatternData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function PatternRecognition({ patterns, loading, error, onRetry }: PatternRecognitionProps) {
  // Loading state
  if (loading) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bitcoin-orange"></div>
          <span className="ml-4 text-bitcoin-white-80">Analyzing patterns...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
        <h3 className="text-bitcoin-orange font-bold text-xl mb-2">Error Loading Pattern Analysis</h3>
        <p className="text-bitcoin-white-80 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-bitcoin-orange text-bitcoin-black font-bold px-6 py-2 rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!patterns || patterns.summary.totalTrades === 0) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-8">
        <h3 className="text-bitcoin-white font-bold text-xl mb-2">Pattern Recognition</h3>
        <p className="text-bitcoin-white-60">
          Not enough completed trades to identify patterns. Generate and complete more trades to see pattern analysis.
        </p>
      </div>
    );
  }

  const { successFactors, failureFactors } = patterns.patterns;

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-2">Pattern Recognition</h3>
        <p className="text-sm text-bitcoin-white-60 italic">
          Statistical analysis of {patterns.summary.totalTrades} completed trades 
          ({patterns.summary.winningTrades} winning, {patterns.summary.losingTrades} losing, {patterns.summary.expiredTrades} expired)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Factors */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <h4 className="text-lg font-bold text-bitcoin-orange mb-4">
            ✅ Top 5 Success Factors
          </h4>
          {successFactors.length === 0 ? (
            <p className="text-bitcoin-white-60 text-sm">No statistically significant success factors identified.</p>
          ) : (
            <div className="space-y-3">
              {successFactors.map((pattern, index) => (
                <div key={`success-${index}`} className="bg-bitcoin-black border border-bitcoin-orange-10 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-bitcoin-orange font-bold text-sm">#{index + 1}</span>
                        <span className="text-bitcoin-white font-semibold text-sm">{pattern.indicator}</span>
                      </div>
                      <p className="text-bitcoin-white-80 text-xs">{pattern.condition}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-bitcoin-orange font-bold text-lg">
                        {pattern.confidence.toFixed(0)}%
                      </div>
                      <div className="text-bitcoin-white-60 text-xs">confidence</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-bitcoin-orange-10">
                    <div>
                      <span className="text-bitcoin-white-60">In Winning: </span>
                      <span className="font-mono text-bitcoin-orange font-bold">
                        {pattern.winningPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-bitcoin-white-60">In Losing: </span>
                      <span className="font-mono text-bitcoin-white-80">
                        {pattern.losingPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-bitcoin-white-60">Power: </span>
                      <span className="font-mono text-bitcoin-white">
                        {pattern.predictivePower.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-bitcoin-white-60">p-value: </span>
                      <span className="font-mono text-bitcoin-white">
                        {pattern.pValue.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Failure Factors */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <h4 className="text-lg font-bold text-bitcoin-white-80 mb-4">
            ⚠️ Top 5 Failure Factors
          </h4>
          {failureFactors.length === 0 ? (
            <p className="text-bitcoin-white-60 text-sm">No statistically significant failure factors identified.</p>
          ) : (
            <div className="space-y-3">
              {failureFactors.map((pattern, index) => (
                <div key={`failure-${index}`} className="bg-bitcoin-black border border-bitcoin-orange-10 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-bitcoin-white-60 font-bold text-sm">#{index + 1}</span>
                        <span className="text-bitcoin-white font-semibold text-sm">{pattern.indicator}</span>
                      </div>
                      <p className="text-bitcoin-white-80 text-xs">{pattern.condition}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-bitcoin-white-80 font-bold text-lg">
                        {pattern.confidence.toFixed(0)}%
                      </div>
                      <div className="text-bitcoin-white-60 text-xs">confidence</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-bitcoin-orange-10">
                    <div>
                      <span className="text-bitcoin-white-60">In Winning: </span>
                      <span className="font-mono text-bitcoin-white-80">
                        {pattern.winningPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-bitcoin-white-60">In Losing: </span>
                      <span className="font-mono text-bitcoin-white-80 font-bold">
                        {pattern.losingPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-bitcoin-white-60">Power: </span>
                      <span className="font-mono text-bitcoin-white">
                        {pattern.predictivePower.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-bitcoin-white-60">p-value: </span>
                      <span className="font-mono text-bitcoin-white">
                        {pattern.pValue.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistical Significance Note */}
      <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
        <p className="text-bitcoin-white-60 text-xs">
          <span className="font-semibold text-bitcoin-orange">Statistical Significance:</span> All patterns shown have p-value &lt; 0.05, 
          indicating they are statistically significant. Confidence level represents the strength of the pattern's predictive power.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// BATCH ANALYSIS COMPONENT
// ============================================================================

interface BatchAnalysisProps {
  batchAnalysis: BatchAnalysisData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  filters: {
    symbol: string;
    dateRange: string;
    status: string;
  };
}

function BatchAnalysis({ batchAnalysis, loading, error, onRetry, filters }: BatchAnalysisProps) {
  // Loading state
  if (loading) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bitcoin-orange"></div>
          <span className="ml-4 text-bitcoin-white-80">Analyzing batch data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
        <h3 className="text-bitcoin-orange font-bold text-xl mb-2">Error Loading Batch Analysis</h3>
        <p className="text-bitcoin-white-80 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-bitcoin-orange text-bitcoin-black font-bold px-6 py-2 rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!batchAnalysis || batchAnalysis.aggregateStats.totalTrades === 0) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-8">
        <h3 className="text-bitcoin-white font-bold text-xl mb-2">Batch Analysis</h3>
        <p className="text-bitcoin-white-60">
          Not enough completed trades to perform batch analysis. Generate and complete more trades to see comprehensive insights.
        </p>
      </div>
    );
  }

  const { aggregateStats, bestConditions, recommendations } = batchAnalysis;

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-2">Batch Analysis</h3>
        <p className="text-sm text-bitcoin-white-60 italic">
          Comprehensive analysis of {aggregateStats.totalTrades} trades with actionable recommendations
        </p>
      </div>

      {/* Aggregate Statistics */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-bitcoin-orange mb-4">📊 Aggregate Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-1">Win Rate</p>
            <p className="font-mono text-2xl font-bold text-bitcoin-orange">
              {aggregateStats.winRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-1">Profit Factor</p>
            <p className="font-mono text-2xl font-bold text-bitcoin-white">
              {aggregateStats.profitFactor.toFixed(2)}
            </p>
          </div>
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-1">Avg Win</p>
            <p className="font-mono text-2xl font-bold text-bitcoin-orange">
              ${aggregateStats.averageWin.toFixed(2)}
            </p>
          </div>
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-1">Avg Loss</p>
            <p className="font-mono text-2xl font-bold text-bitcoin-white-80">
              ${Math.abs(aggregateStats.averageLoss).toFixed(2)}
            </p>
          </div>
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-1">Total P/L</p>
            <p className={`font-mono text-2xl font-bold ${aggregateStats.totalProfitLoss >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
              ${aggregateStats.totalProfitLoss.toFixed(2)}
            </p>
          </div>
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-1">Largest Win</p>
            <p className="font-mono text-2xl font-bold text-bitcoin-orange">
              ${aggregateStats.largestWin.toFixed(2)}
            </p>
          </div>
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-1">Largest Loss</p>
            <p className="font-mono text-2xl font-bold text-bitcoin-white-80">
              ${Math.abs(aggregateStats.largestLoss).toFixed(2)}
            </p>
          </div>
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-1">Avg Duration</p>
            <p className="font-mono text-2xl font-bold text-bitcoin-white">
              {aggregateStats.averageTradeDuration.toFixed(1)}h
            </p>
          </div>
        </div>
      </div>

      {/* Best Performing Conditions */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-bitcoin-orange mb-4">🎯 Best Performing Conditions</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* RSI Ranges */}
          {bestConditions.rsiRanges.length > 0 && (
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <h5 className="text-bitcoin-white font-semibold mb-3">RSI Ranges</h5>
              <div className="space-y-2">
                {bestConditions.rsiRanges.map((rsi, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-bitcoin-white-80">{rsi.range}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-bitcoin-orange font-bold">{rsi.winRate.toFixed(1)}%</span>
                      <span className="text-bitcoin-white-60 text-xs">({rsi.tradeCount} trades)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MACD Signals */}
          {bestConditions.macdSignals.length > 0 && (
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <h5 className="text-bitcoin-white font-semibold mb-3">MACD Signals</h5>
              <div className="space-y-2">
                {bestConditions.macdSignals.map((macd, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-bitcoin-white-80">{macd.signal}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-bitcoin-orange font-bold">{macd.winRate.toFixed(1)}%</span>
                      <span className="text-bitcoin-white-60 text-xs">({macd.tradeCount} trades)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeframes */}
          {bestConditions.timeframes.length > 0 && (
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <h5 className="text-bitcoin-white font-semibold mb-3">Timeframes</h5>
              <div className="space-y-2">
                {bestConditions.timeframes.map((tf, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-bitcoin-white-80">{tf.timeframe}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-bitcoin-orange font-bold">{tf.winRate.toFixed(1)}%</span>
                      <span className="text-bitcoin-white-60 text-xs">({tf.tradeCount} trades)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Conditions */}
          {bestConditions.marketConditions.length > 0 && (
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <h5 className="text-bitcoin-white font-semibold mb-3">Market Conditions</h5>
              <div className="space-y-2">
                {bestConditions.marketConditions.map((mc, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-bitcoin-white-80">{mc.condition}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-bitcoin-orange font-bold">{mc.winRate.toFixed(1)}%</span>
                      <span className="text-bitcoin-white-60 text-xs">({mc.tradeCount} trades)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-bitcoin-orange mb-4">💡 Recommendations</h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div 
                key={index} 
                className={`bg-bitcoin-black border rounded-lg p-4 ${
                  rec.priority === 'high' 
                    ? 'border-bitcoin-orange' 
                    : rec.priority === 'medium'
                    ? 'border-bitcoin-orange-20'
                    : 'border-bitcoin-orange-10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      rec.priority === 'high'
                        ? 'bg-bitcoin-orange text-bitcoin-black'
                        : rec.priority === 'medium'
                        ? 'bg-bitcoin-orange-20 text-bitcoin-orange'
                        : 'bg-bitcoin-orange-10 text-bitcoin-white-60'
                    }`}>
                      {rec.priority}
                    </span>
                    <span className="text-bitcoin-white-60 text-xs uppercase font-semibold">
                      {rec.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-bitcoin-orange font-bold text-sm">
                      {rec.confidence}%
                    </div>
                    <div className="text-bitcoin-white-60 text-xs">confidence</div>
                  </div>
                </div>
                
                <p className="text-bitcoin-white-80 text-sm mb-2">
                  {rec.recommendation}
                </p>
                
                <div className="pt-2 border-t border-bitcoin-orange-10">
                  <p className="text-bitcoin-white-60 text-xs">
                    <span className="font-semibold text-bitcoin-orange">Potential Impact:</span> {rec.potentialImpact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Note */}
      <div className="mt-6 pt-4 border-t border-bitcoin-orange-20">
        <p className="text-bitcoin-white-60 text-xs">
          <span className="font-semibold text-bitcoin-orange">Active Filters:</span>{' '}
          Symbol: {filters.symbol === 'all' ? 'All' : filters.symbol},{' '}
          Date Range: {filters.dateRange === 'all' ? 'All Time' : `Last ${filters.dateRange} days`},{' '}
          Status: {filters.status === 'all' ? 'All' : filters.status}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// RECOMMENDATIONS SECTION COMPONENT
// ============================================================================

interface RecommendationsSectionProps {
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'entry' | 'exit' | 'risk' | 'timing' | 'position_sizing';
    recommendation: string;
    potentialImpact: string;
    confidence: number;
  }>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function RecommendationsSection({ recommendations, loading, error, onRetry }: RecommendationsSectionProps) {
  // Loading state
  if (loading) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bitcoin-orange"></div>
          <span className="ml-4 text-bitcoin-white-80">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8">
        <h3 className="text-bitcoin-orange font-bold text-xl mb-2">Error Loading Recommendations</h3>
        <p className="text-bitcoin-white-80 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-bitcoin-orange text-bitcoin-black font-bold px-6 py-2 rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-8">
        <h3 className="text-bitcoin-white font-bold text-xl mb-2">💡 Recommendations</h3>
        <p className="text-bitcoin-white-60">
          Not enough completed trades to generate recommendations. Complete more trades to receive actionable insights.
        </p>
      </div>
    );
  }

  // Show top 5 recommendations only
  const topRecommendations = recommendations.slice(0, 5);

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-2">💡 Recommendations</h3>
        <p className="text-sm text-bitcoin-white-60 italic">
          Top {topRecommendations.length} actionable insights to improve your trading performance
        </p>
      </div>

      <div className="space-y-4">
        {topRecommendations.map((rec, index) => (
          <div 
            key={index} 
            className={`bg-bitcoin-black border-2 rounded-xl p-5 transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] ${
              rec.priority === 'high' 
                ? 'border-bitcoin-orange' 
                : rec.priority === 'medium'
                ? 'border-bitcoin-orange-20'
                : 'border-bitcoin-orange-10'
            }`}
          >
            {/* Header with Priority and Confidence */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-bitcoin-orange font-bold text-2xl">#{index + 1}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      rec.priority === 'high'
                        ? 'bg-bitcoin-orange text-bitcoin-black'
                        : rec.priority === 'medium'
                        ? 'bg-bitcoin-orange-20 text-bitcoin-orange'
                        : 'bg-bitcoin-orange-10 text-bitcoin-white-60'
                    }`}>
                      {rec.priority} Priority
                    </span>
                    <span className="text-bitcoin-white-60 text-xs uppercase font-semibold tracking-wider">
                      {rec.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-bold text-2xl ${
                  rec.priority === 'high' ? 'text-bitcoin-orange' : 'text-bitcoin-white'
                }`}>
                  {rec.confidence}%
                </div>
                <div className="text-bitcoin-white-60 text-xs uppercase tracking-wider">confidence</div>
              </div>
            </div>
            
            {/* Recommendation Text */}
            <div className="mb-3">
              <p className="text-bitcoin-white text-base leading-relaxed">
                {rec.recommendation}
              </p>
            </div>
            
            {/* Potential Impact */}
            <div className="pt-3 border-t border-bitcoin-orange-20">
              <div className="flex items-start gap-2">
                <span className="text-bitcoin-orange font-bold text-sm uppercase tracking-wider flex-shrink-0">
                  Potential Impact:
                </span>
                <span className={`font-semibold text-sm ${
                  rec.priority === 'high' ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'
                }`}>
                  {rec.potentialImpact}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="mt-6 pt-4 border-t border-bitcoin-orange-20">
        <p className="text-bitcoin-white-60 text-xs">
          <span className="font-semibold text-bitcoin-orange">Note:</span> Recommendations are generated based on 
          statistical analysis of your completed trades. High-priority recommendations have the greatest potential 
          to improve your win rate and profitability.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// WORST TRADES TABLE COMPONENT
// ============================================================================

interface WorstTradesTableProps {
  trades: Array<{
    id: string;
    symbol: string;
    entryPrice: number;
    exitPrice: number;
    profitLoss: number;
    profitLossPercentage: number;
    timeframe: string;
    generatedAt: string;
  }>;
}

function WorstTradesTable({ trades }: WorstTradesTableProps) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      <h3 className="text-xl font-bold text-bitcoin-white-80 mb-4">📉 Top 5 Worst Trades</h3>
      {trades.length === 0 ? (
        <p className="text-bitcoin-white-60">No losing trades yet.</p>
      ) : (
        <div className="space-y-3">
          {trades.map((trade, index) => (
            <div key={trade.id} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-bitcoin-white-60 font-bold text-lg">#{index + 1}</span>
                  <span className="text-bitcoin-white font-bold">{trade.symbol}</span>
                  <span className="text-bitcoin-white-60 text-sm">{trade.timeframe}</span>
                </div>
                <span className="font-mono text-bitcoin-white-80 font-bold">
                  ${trade.profitLoss.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-bitcoin-white-60">Entry: </span>
                  <span className="font-mono text-bitcoin-white">${trade.entryPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-bitcoin-white-60">Exit: </span>
                  <span className="font-mono text-bitcoin-white">${trade.exitPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-bitcoin-white-60">Loss: </span>
                  <span className="font-mono text-bitcoin-white-80 font-bold">{trade.profitLossPercentage.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-bitcoin-white-60">Date: </span>
                  <span className="text-bitcoin-white-60 text-xs">{new Date(trade.generatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
