import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Calendar, 
  BarChart3, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  AlertCircle
} from 'lucide-react';

/**
 * Einstein Trade History Component
 * 
 * Displays Einstein-generated trades with full analysis data.
 * Features:
 * - Filtering by position type, confidence, date
 * - Sorting by confidence, date, profit/loss
 * - Full analysis data display
 * - Responsive design
 * 
 * Requirements: 11.4
 */

interface TradeSignal {
  id: string;
  symbol: string;
  position_type: 'LONG' | 'SHORT';
  entry: number;
  stop_loss: number;
  tp1_price: number;
  tp1_allocation: number;
  tp2_price: number;
  tp2_allocation: number;
  tp3_price: number;
  tp3_allocation: number;
  confidence_overall: number;
  confidence_technical: number;
  confidence_sentiment: number;
  confidence_onchain: number;
  confidence_risk: number;
  risk_reward: number;
  position_size: number;
  max_loss: number;
  timeframe: string;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CLOSED';
  data_quality_overall: number;
  analysis_technical?: any;
  analysis_sentiment?: any;
  analysis_onchain?: any;
  analysis_risk?: any;
  analysis_reasoning?: any;
  timeframe_alignment?: any;
  // Execution tracking fields
  executed_at?: string;
  entry_price?: number;
  current_price?: number;
  exit_prices?: Array<{
    target: 'TP1' | 'TP2' | 'TP3' | 'STOP_LOSS';
    price: number;
    percentage: number;
    timestamp: string;
  }>;
  percent_filled?: number;
  unrealized_pl?: number;
  unrealized_pl_percent?: number;
  realized_pl?: number;
  realized_pl_percent?: number;
}

interface TradeHistoryStats {
  total_trades: number;
  approved_trades: number;
  executed_trades: number;
  closed_trades: number;
  // Aggregate statistics (Requirement 17.5)
  total_pl?: number;
  total_pl_percent?: number;
  win_rate?: number;
  average_return?: number;
  winning_trades?: number;
  losing_trades?: number;
}

interface EinsteinTradeHistoryProps {
  className?: string;
}

export default function EinsteinTradeHistory({ className = '' }: EinsteinTradeHistoryProps) {
  // State
  const [trades, setTrades] = useState<TradeSignal[]>([]);
  const [stats, setStats] = useState<TradeHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  // Filter state
  const [filterPositionType, setFilterPositionType] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [filterMinConfidence, setFilterMinConfidence] = useState<number>(0);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'EXECUTED' | 'CLOSED'>('ALL');

  // Sort state
  const [sortBy, setSortBy] = useState<'created_at' | 'confidence_overall' | 'risk_reward'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTrades, setTotalTrades] = useState(0);

  /**
   * Fetch trade history from API
   */
  const fetchTradeHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
      });

      // Add filters
      if (filterPositionType !== 'ALL') {
        params.append('positionType', filterPositionType);
      }
      if (filterMinConfidence > 0) {
        params.append('minConfidence', filterMinConfidence.toString());
      }
      if (filterDateFrom) {
        params.append('dateFrom', filterDateFrom);
      }
      if (filterDateTo) {
        params.append('dateTo', filterDateTo);
      }
      if (filterStatus !== 'ALL') {
        params.append('status', filterStatus);
      }

      // Fetch data
      const response = await fetch(`/api/einstein/trade-history?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trade history');
      }

      const data = await response.json();

      setTrades(data.trades || []);
      setStats(data.stats || null);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalTrades(data.pagination?.total || 0);

    } catch (err) {
      console.error('❌ Failed to fetch trade history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch data on mount and when filters/sort change
   */
  useEffect(() => {
    fetchTradeHistory();
  }, [page, sortBy, sortOrder, filterPositionType, filterMinConfidence, filterDateFrom, filterDateTo, filterStatus]);

  /**
   * Toggle expanded trade details
   */
  const toggleExpanded = (tradeId: string) => {
    setExpandedTrade(expandedTrade === tradeId ? null : tradeId);
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get position color
   */
  const getPositionColor = (type: string) => {
    return type === 'LONG' ? 'text-bitcoin-orange' : 'text-red-500';
  };

  /**
   * Get confidence color
   */
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-bitcoin-orange';
    if (score >= 60) return 'text-bitcoin-white';
    return 'text-bitcoin-white-60';
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-bitcoin-orange text-bitcoin-black';
      case 'EXECUTED':
        return 'bg-green-500 text-bitcoin-black';
      case 'CLOSED':
        return 'bg-gray-500 text-bitcoin-white';
      case 'PENDING':
        return 'bg-bitcoin-orange-20 text-bitcoin-orange';
      case 'REJECTED':
        return 'bg-red-500 text-bitcoin-white';
      default:
        return 'bg-bitcoin-white-60 text-bitcoin-black';
    }
  };

  /**
   * Calculate unrealized P/L for executed trades (Requirement 17.2)
   */
  const calculateUnrealizedPL = (trade: TradeSignal): { pl: number; plPercent: number; isProfit: boolean } | null => {
    if (trade.status !== 'EXECUTED' || !trade.entry_price || !trade.current_price) {
      return null;
    }

    const entryPrice = trade.entry_price;
    const currentPrice = trade.current_price;
    const positionSize = trade.position_size;

    let pl: number;
    let plPercent: number;

    if (trade.position_type === 'LONG') {
      pl = (currentPrice - entryPrice) * positionSize;
      plPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    } else {
      // SHORT position
      pl = (entryPrice - currentPrice) * positionSize;
      plPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
    }

    return {
      pl,
      plPercent,
      isProfit: pl > 0
    };
  };

  /**
   * Get P/L display color
   */
  const getPLColor = (isProfit: boolean) => {
    return isProfit ? 'text-green-500' : 'text-red-500';
  };

  /**
   * Get P/L icon
   */
  const getPLIcon = (isProfit: boolean) => {
    return isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
              Einstein Trade History
            </h2>
            <p className="text-bitcoin-white-80 text-sm">
              View and analyze all Einstein-generated trade signals
            </p>
          </div>
          <button
            onClick={fetchTradeHistory}
            disabled={loading}
            className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Statistics (Requirement 17.5) */}
        {stats && (
          <div className="space-y-4">
            {/* Trade Count Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Total Trades</p>
                <p className="text-bitcoin-orange font-bold font-mono text-2xl">
                  {stats.total_trades}
                </p>
              </div>
              <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Approved</p>
                <p className="text-bitcoin-white font-bold font-mono text-2xl">
                  {stats.approved_trades}
                </p>
              </div>
              <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Executed</p>
                <p className="text-green-500 font-bold font-mono text-2xl">
                  {stats.executed_trades}
                </p>
              </div>
              <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Closed</p>
                <p className="text-gray-500 font-bold font-mono text-2xl">
                  {stats.closed_trades}
                </p>
              </div>
            </div>

            {/* Aggregate Performance Statistics (Requirement 17.5) */}
            {stats.closed_trades > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                    <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Total P/L</p>
                    <p className={`font-bold font-mono text-xl ${stats.total_pl && stats.total_pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.total_pl !== undefined ? (
                        <>
                          {stats.total_pl >= 0 ? '+' : ''}{formatCurrency(stats.total_pl)}
                          {stats.total_pl_percent !== undefined && (
                            <span className="text-sm ml-1">
                              ({stats.total_pl_percent >= 0 ? '+' : ''}{stats.total_pl_percent.toFixed(2)}%)
                            </span>
                          )}
                        </>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                    <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Win Rate</p>
                    <p className="text-bitcoin-orange font-bold font-mono text-xl">
                      {stats.win_rate !== undefined ? `${stats.win_rate.toFixed(1)}%` : 'N/A'}
                    </p>
                    {stats.winning_trades !== undefined && stats.losing_trades !== undefined && (
                      <p className="text-bitcoin-white-60 text-xs mt-1">
                        {stats.winning_trades}W / {stats.losing_trades}L
                      </p>
                    )}
                  </div>
                  <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                    <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Avg Return</p>
                    <p className={`font-bold font-mono text-xl ${stats.average_return && stats.average_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.average_return !== undefined ? (
                        <>
                          {stats.average_return >= 0 ? '+' : ''}{stats.average_return.toFixed(2)}%
                        </>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                    <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Max Drawdown</p>
                    <p className="text-red-500 font-bold font-mono text-xl">
                      {stats.max_drawdown !== undefined ? formatCurrency(stats.max_drawdown) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Visual Performance Chart (Requirement 17.5) */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={20} className="text-bitcoin-orange" />
                      <h4 className="text-sm font-bold text-bitcoin-white">Performance Summary</h4>
                    </div>
                    <p className="text-bitcoin-white-60 text-xs">
                      Based on {stats.closed_trades} closed trades
                    </p>
                  </div>
                  
                  {/* Simple bar chart visualization */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Win Rate Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-bitcoin-white-60 text-xs">Win Rate</span>
                        <span className="text-bitcoin-orange text-xs font-mono font-bold">
                          {stats.win_rate?.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-3">
                        <div 
                          className="bg-bitcoin-orange h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, stats.win_rate || 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Profit Factor Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-bitcoin-white-60 text-xs">Winning Trades</span>
                        <span className="text-green-500 text-xs font-mono font-bold">
                          {stats.winning_trades || 0}
                        </span>
                      </div>
                      <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-full rounded-full transition-all"
                          style={{ 
                            width: `${stats.closed_trades > 0 ? ((stats.winning_trades || 0) / stats.closed_trades) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Losing Trades Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-bitcoin-white-60 text-xs">Losing Trades</span>
                        <span className="text-red-500 text-xs font-mono font-bold">
                          {stats.losing_trades || 0}
                        </span>
                      </div>
                      <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-3">
                        <div 
                          className="bg-red-500 h-full rounded-full transition-all"
                          style={{ 
                            width: `${stats.closed_trades > 0 ? ((stats.losing_trades || 0) / stats.closed_trades) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Performance Insights */}
                  <div className="mt-4 pt-3 border-t border-bitcoin-orange-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stats.win_rate && stats.win_rate >= 65 ? 'bg-bitcoin-orange' : stats.win_rate && stats.win_rate >= 50 ? 'bg-bitcoin-white' : 'bg-red-500'}`} />
                        <span className="text-bitcoin-white-80">
                          {stats.win_rate && stats.win_rate >= 65 ? 'Excellent win rate (65%+)' : 
                           stats.win_rate && stats.win_rate >= 50 ? 'Good win rate (50%+)' : 
                           'Win rate needs improvement'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stats.total_pl && stats.total_pl > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-bitcoin-white-80">
                          {stats.total_pl && stats.total_pl > 0 ? 'Profitable overall' : 'Currently in loss'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters and Sorting */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-bitcoin-orange" />
          <h3 className="text-lg font-bold text-bitcoin-white">Filters & Sorting</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Position Type Filter */}
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              Position Type
            </label>
            <select
              value={filterPositionType}
              onChange={(e) => {
                setFilterPositionType(e.target.value as any);
                setPage(1);
              }}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-3 py-2 focus:border-bitcoin-orange focus:outline-none"
            >
              <option value="ALL">All Positions</option>
              <option value="LONG">Long Only</option>
              <option value="SHORT">Short Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-3 py-2 focus:border-bitcoin-orange focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="EXECUTED">Executed</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Minimum Confidence Filter */}
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              Min Confidence: {filterMinConfidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filterMinConfidence}
              onChange={(e) => {
                setFilterMinConfidence(parseInt(e.target.value));
                setPage(1);
              }}
              className="w-full"
            />
          </div>

          {/* Date From Filter */}
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              Date From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => {
                setFilterDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-3 py-2 focus:border-bitcoin-orange focus:outline-none"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              Date To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => {
                setFilterDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-3 py-2 focus:border-bitcoin-orange focus:outline-none"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-white rounded-lg px-3 py-2 focus:border-bitcoin-orange focus:outline-none"
              >
                <option value="created_at">Date</option>
                <option value="confidence_overall">Confidence</option>
                <option value="risk_reward">Risk/Reward</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-3 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4">
          <button
            onClick={() => {
              setFilterPositionType('ALL');
              setFilterStatus('ALL');
              setFilterMinConfidence(0);
              setFilterDateFrom('');
              setFilterDateTo('');
              setPage(1);
            }}
            className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black text-sm"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Trade List */}
      <div className="space-y-4">
        {loading && (
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-12 text-center">
            <RefreshCw size={48} className="text-bitcoin-orange animate-spin mx-auto mb-4" />
            <p className="text-bitcoin-white-80">Loading trade history...</p>
          </div>
        )}

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

        {!loading && !error && trades.length === 0 && (
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-12 text-center">
            <BarChart3 size={48} className="text-bitcoin-white-60 mx-auto mb-4" />
            <p className="text-bitcoin-white-80 mb-2">No trades found</p>
            <p className="text-bitcoin-white-60 text-sm">
              Try adjusting your filters or generate a new trade signal
            </p>
          </div>
        )}

        {!loading && !error && trades.map((trade) => (
          <div
            key={trade.id}
            className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl overflow-hidden transition-all hover:border-bitcoin-orange"
          >
            {/* Trade Summary */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-bitcoin-white">
                      {trade.symbol}
                    </h3>
                    <span className={`text-lg font-bold ${getPositionColor(trade.position_type)}`}>
                      {trade.position_type}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(trade.status)}`}>
                      {trade.status}
                    </span>
                  </div>
                  <p className="text-bitcoin-white-60 text-sm">
                    {formatDate(trade.created_at)} • {trade.timeframe}
                  </p>
                </div>
                <button
                  onClick={() => toggleExpanded(trade.id)}
                  className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange flex items-center gap-2"
                >
                  <Eye size={16} />
                  {expandedTrade === trade.id ? 'Hide' : 'View'} Details
                  {expandedTrade === trade.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                  <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Entry</p>
                  <p className="text-bitcoin-white font-bold font-mono">
                    {formatCurrency(trade.entry)}
                  </p>
                </div>
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                  <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Stop Loss</p>
                  <p className="text-red-500 font-bold font-mono">
                    {formatCurrency(trade.stop_loss)}
                  </p>
                </div>
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                  <p className="text-bitcoin-white-60 text-xs uppercase mb-1">TP1</p>
                  <p className="text-bitcoin-orange font-bold font-mono">
                    {formatCurrency(trade.tp1_price)}
                  </p>
                </div>
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                  <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Confidence</p>
                  <p className={`font-bold font-mono text-lg ${getConfidenceColor(trade.confidence_overall)}`}>
                    {trade.confidence_overall}%
                  </p>
                </div>
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                  <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Risk:Reward</p>
                  <p className="text-bitcoin-white font-bold font-mono">
                    1:{trade.risk_reward.toFixed(2)}
                  </p>
                </div>
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                  <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Data Quality</p>
                  <p className="text-bitcoin-white font-bold font-mono">
                    {trade.data_quality_overall}%
                  </p>
                </div>
              </div>

              {/* P/L Display for EXECUTED trades (Requirement 17.2) */}
              {trade.status === 'EXECUTED' && (() => {
                const plData = calculateUnrealizedPL(trade);
                return plData ? (
                  <div className="mt-4 bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPLIcon(plData.isProfit)}
                        <span className="text-bitcoin-white-60 text-sm font-semibold">
                          Unrealized P/L:
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold font-mono text-2xl ${getPLColor(plData.isProfit)}`}>
                          {plData.pl >= 0 ? '+' : ''}{formatCurrency(plData.pl)}
                        </p>
                        <p className={`font-mono text-sm ${getPLColor(plData.isProfit)}`}>
                          {plData.plPercent >= 0 ? '+' : ''}{plData.plPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    {trade.current_price && (
                      <p className="text-bitcoin-white-60 text-xs mt-2">
                        Current Price: {formatCurrency(trade.current_price)}
                      </p>
                    )}
                  </div>
                ) : null;
              })()}

              {/* P/L Display for CLOSED trades (Requirement 17.3) */}
              {trade.status === 'CLOSED' && trade.realized_pl !== undefined && (
                <div className="mt-4 bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPLIcon(trade.realized_pl >= 0)}
                      <span className="text-bitcoin-white-60 text-sm font-semibold">
                        Realized P/L:
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold font-mono text-2xl ${getPLColor(trade.realized_pl >= 0)}`}>
                        {trade.realized_pl >= 0 ? '+' : ''}{formatCurrency(trade.realized_pl)}
                      </p>
                      {trade.realized_pl_percent !== undefined && (
                        <p className={`font-mono text-sm ${getPLColor(trade.realized_pl >= 0)}`}>
                          {trade.realized_pl_percent >= 0 ? '+' : ''}{trade.realized_pl_percent.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                  {trade.exit_prices && trade.exit_prices.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
                      <p className="text-bitcoin-white-60 text-xs mb-2">Exit Details:</p>
                      <div className="space-y-1">
                        {trade.exit_prices.map((exit, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-bitcoin-white-60">{exit.target}:</span>
                            <span className="text-bitcoin-white font-mono">
                              {formatCurrency(exit.price)} ({exit.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Expanded Details */}
            {expandedTrade === trade.id && (
              <div className="border-t-2 border-bitcoin-orange-20 p-6 bg-bitcoin-orange bg-opacity-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Position Details */}
                  <div>
                    <h4 className="text-lg font-bold text-bitcoin-white mb-3">Position Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Position Size:</span>
                        <span className="text-bitcoin-white font-mono">
                          {trade.position_size.toFixed(4)} {trade.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Max Loss:</span>
                        <span className="text-red-500 font-mono">
                          {formatCurrency(trade.max_loss)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">TP2 (30%):</span>
                        <span className="text-bitcoin-orange font-mono">
                          {formatCurrency(trade.tp2_price)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">TP3 (20%):</span>
                        <span className="text-bitcoin-orange font-mono">
                          {formatCurrency(trade.tp3_price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Breakdown */}
                  <div>
                    <h4 className="text-lg font-bold text-bitcoin-white mb-3">Confidence Breakdown</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-bitcoin-white-60 text-sm">Technical</span>
                          <span className="text-bitcoin-white font-mono text-sm">
                            {trade.confidence_technical}%
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-orange h-full rounded-full transition-all"
                            style={{ width: `${trade.confidence_technical}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-bitcoin-white-60 text-sm">Sentiment</span>
                          <span className="text-bitcoin-white font-mono text-sm">
                            {trade.confidence_sentiment}%
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-orange h-full rounded-full transition-all"
                            style={{ width: `${trade.confidence_sentiment}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-bitcoin-white-60 text-sm">On-Chain</span>
                          <span className="text-bitcoin-white font-mono text-sm">
                            {trade.confidence_onchain}%
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-orange h-full rounded-full transition-all"
                            style={{ width: `${trade.confidence_onchain}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-bitcoin-white-60 text-sm">Risk</span>
                          <span className="text-bitcoin-white font-mono text-sm">
                            {trade.confidence_risk}%
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-orange h-full rounded-full transition-all"
                            style={{ width: `${trade.confidence_risk}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  {trade.analysis_reasoning && (
                    <div className="lg:col-span-2">
                      <h4 className="text-lg font-bold text-bitcoin-white mb-3">AI Reasoning</h4>
                      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                        <p className="text-bitcoin-white-80 text-sm leading-relaxed whitespace-pre-wrap">
                          {typeof trade.analysis_reasoning === 'string' 
                            ? trade.analysis_reasoning 
                            : trade.analysis_reasoning?.overall || 'No reasoning available'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-bitcoin-white-60 text-sm">
              Showing {((page - 1) * 10) + 1} - {Math.min(page * 10, totalTrades)} of {totalTrades} trades
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-bitcoin-white font-mono px-4">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
