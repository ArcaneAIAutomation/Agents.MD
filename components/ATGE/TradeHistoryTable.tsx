import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import TradeFiltersComponent, { TradeFilters } from './TradeFilters';
import TradeRow, { TradeSignal } from './TradeRow';
import TradeDetailModal from './TradeDetailModal';

interface TradeHistoryTableProps {
  symbol: string;
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

export default function TradeHistoryTable({
  symbol,
  className = '',
  lastGeneratedAt
}: TradeHistoryTableProps) {
  const { isMobile, isTablet } = useMobileViewport();
  
  // State
  const [trades, setTrades] = useState<TradeSignal[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<TradeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<TradeFilters>({
    status: 'all',
    timeframe: 'all',
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 25;

  // Modal
  const [selectedTrade, setSelectedTrade] = useState<TradeSignal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Trade counts
  const [tradeCounts, setTradeCounts] = useState({
    total: 0,
    active: 0,
    completed: 0
  });

  // Cumulative P/L
  const [cumulativePL, setCumulativePL] = useState(0);

  // Fetch trades
  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to /api/atge/trades
      const response = await fetch(`/api/atge/trades?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }

      const data = await response.json();
      
      if (data.success && data.trades) {
        setTrades(data.trades);
        
        // Calculate trade counts
        const counts = {
          total: data.trades.length,
          active: data.trades.filter((t: TradeSignal) => t.status === 'active').length,
          completed: data.trades.filter((t: TradeSignal) => 
            t.status === 'completed_success' || t.status === 'completed_failure'
          ).length
        };
        setTradeCounts(counts);

        // Calculate cumulative P/L
        const totalPL = data.trades.reduce((sum: number, trade: TradeSignal) => {
          return sum + (trade.result?.netProfitLossUsd || 0);
        }, 0);
        setCumulativePL(totalPL);
      } else {
        setTrades([]);
        setTradeCounts({ total: 0, active: 0, completed: 0 });
        setCumulativePL(0);
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trades');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh when new trade is generated
  useEffect(() => {
    fetchTrades();
  }, [symbol, lastGeneratedAt]); // Refresh when lastGeneratedAt changes

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...trades];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(trade => trade.status === filters.status);
    }

    // Timeframe filter
    if (filters.timeframe !== 'all') {
      filtered = filtered.filter(trade => trade.timeframe === filters.timeframe);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (filters.customStartDate && filters.customEndDate) {
            filtered = filtered.filter(trade => {
              const tradeDate = new Date(trade.generatedAt);
              return tradeDate >= filters.customStartDate! && tradeDate <= filters.customEndDate!;
            });
          }
          break;
        default:
          startDate = new Date(0);
      }

      if (filters.dateRange !== 'custom') {
        filtered = filtered.filter(trade => new Date(trade.generatedAt) >= startDate);
      }
    }

    // Profit/Loss range filter
    if (filters.profitLossMin !== undefined) {
      filtered = filtered.filter(trade => 
        (trade.result?.netProfitLossUsd || 0) >= filters.profitLossMin!
      );
    }
    if (filters.profitLossMax !== undefined) {
      filtered = filtered.filter(trade => 
        (trade.result?.netProfitLossUsd || 0) <= filters.profitLossMax!
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
          break;
        case 'profit':
          comparison = (a.result?.netProfitLossUsd || 0) - (b.result?.netProfitLossUsd || 0);
          break;
        case 'confidence':
          comparison = a.confidenceScore - b.confidenceScore;
          break;
        case 'duration':
          comparison = (a.result?.tradeDurationMinutes || 0) - (b.result?.tradeDurationMinutes || 0);
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredTrades(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [trades, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const endIndex = startIndex + tradesPerPage;
  const currentTrades = filteredTrades.slice(startIndex, endIndex);

  // Handle trade click
  const handleTradeClick = (trade: TradeSignal) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  // Handle download
  const handleDownload = () => {
    // TODO: Implement CSV/JSON/PDF export
    console.log('Download full history');
    alert('Export functionality will be implemented in Phase 12');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin-orange"></div>
          <p className="text-bitcoin-white-60 ml-4">Loading trade history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 ${className}`}>
        <div className="text-center max-w-md mx-auto">
          <AlertCircle size={48} className="text-bitcoin-orange mx-auto mb-4" />
          <h3 className="text-xl font-bold text-bitcoin-white mb-3">
            Failed to Load Trade History
          </h3>
          <p className="text-bitcoin-white-60 mb-6">{error}</p>
          <button
            onClick={fetchTrades}
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
      {/* Header - Mobile Optimized */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className={`flex items-center gap-3 ${isMobile ? 'flex-col text-center w-full' : ''}`}>
            <TrendingUp size={isMobile ? 28 : 32} className="text-bitcoin-orange" />
            <div className={isMobile ? 'w-full' : ''}>
              <h2 className={`font-bold text-bitcoin-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Complete Trade History
              </h2>
              <p className={`text-bitcoin-white-60 ${isMobile ? 'text-xs mt-1' : 'text-sm'}`}>
                {isMobile ? '100% Transparency' : '100% Transparency • All Trades Visible • No Hidden Results'}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 md:gap-3 ${isMobile ? 'flex-col w-full' : ''}`}>
            {/* Refresh button - Touch-friendly */}
            <button
              onClick={fetchTrades}
              className={`flex items-center justify-center gap-2 bg-bitcoin-orange text-bitcoin-black font-bold px-4 py-2 min-h-[48px] rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] ${isMobile ? 'w-full' : ''}`}
            >
              <RefreshCw size={16} />
              <span className={isMobile ? 'text-xs' : ''}>Refresh</span>
            </button>

            {/* Download button - Touch-friendly */}
            <button
              onClick={handleDownload}
              className={`flex items-center justify-center gap-2 bg-transparent border-2 border-bitcoin-orange text-bitcoin-orange font-bold px-4 py-2 min-h-[48px] rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black ${isMobile ? 'w-full' : ''}`}
            >
              <Download size={16} />
              <span className={isMobile ? 'text-xs' : ''}>Download</span>
            </button>
          </div>
        </div>

        {/* Trade Count Display - Mobile Optimized */}
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t-2 border-bitcoin-orange-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-3 md:p-4">
              <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
                Total
              </p>
              <p className={`font-bold text-bitcoin-white font-mono ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                {tradeCounts.total}
              </p>
            </div>
            <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-3 md:p-4">
              <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
                Active
              </p>
              <p className={`font-bold text-bitcoin-orange font-mono ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                {tradeCounts.active}
              </p>
            </div>
            <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-3 md:p-4">
              <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
                Done
              </p>
              <p className={`font-bold text-bitcoin-white font-mono ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                {tradeCounts.completed}
              </p>
            </div>
            <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-3 md:p-4">
              <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
                P/L
              </p>
              <p className={`font-bold font-mono ${isMobile ? 'text-xl' : 'text-3xl'} ${cumulativePL >= 0 ? 'text-bitcoin-orange' : 'text-red-500'}`}>
                {formatCurrency(cumulativePL)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TradeFiltersComponent
        filters={filters}
        onChange={setFilters}
      />

      {/* Trade List */}
      {filteredTrades.length === 0 ? (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-8 text-center">
          <AlertCircle size={48} className="text-bitcoin-orange mx-auto mb-4" />
          <h3 className="text-xl font-bold text-bitcoin-white mb-3">
            No Trades Found
          </h3>
          <p className="text-bitcoin-white-60">
            {trades.length === 0
              ? 'Generate your first trade signal to see it here.'
              : 'No trades match your current filters. Try adjusting your filter criteria.'}
          </p>
        </div>
      ) : (
        <>
          {/* Results info - Mobile Optimized */}
          <div className={`flex items-center justify-between text-bitcoin-white-60 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <p>
              {isMobile ? (
                <>{startIndex + 1}-{Math.min(endIndex, filteredTrades.length)} of {filteredTrades.length}</>
              ) : (
                <>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredTrades.length)} of {filteredTrades.length} trades
                  {filteredTrades.length !== tradeCounts.total && (
                    <span className="text-bitcoin-orange ml-2">
                      (Filtered from {tradeCounts.total} total)
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Trade rows - Card-based on mobile */}
          <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
            {currentTrades.map(trade => (
              <TradeRow
                key={trade.id}
                trade={trade}
                onClick={() => handleTradeClick(trade)}
              />
            ))}
          </div>

          {/* Pagination - Touch-friendly */}
          {totalPages > 1 && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-3 md:p-4">
              <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center gap-2 bg-bitcoin-orange text-bitcoin-black font-bold px-4 py-2 min-h-[48px] rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'w-full' : ''}`}
                >
                  <ChevronLeft size={20} />
                  <span className={isMobile ? 'text-xs' : ''}>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className={`text-bitcoin-white-60 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center justify-center gap-2 bg-bitcoin-orange text-bitcoin-black font-bold px-4 py-2 min-h-[48px] rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'w-full' : ''}`}
                >
                  <span className={isMobile ? 'text-xs' : ''}>Next</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Running Total - Mobile Optimized */}
          <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-4 md:p-6 text-center">
            <p className={`text-bitcoin-white-60 font-semibold uppercase tracking-wider mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {isMobile ? 'Running Total' : 'Running Total (Filtered Trades)'}
            </p>
            <p className={`font-bold font-mono ${isMobile ? 'text-2xl' : 'text-4xl'} ${
              filteredTrades.reduce((sum, t) => sum + (t.result?.netProfitLossUsd || 0), 0) >= 0
                ? 'text-bitcoin-orange'
                : 'text-red-500'
            }`}>
              {formatCurrency(
                filteredTrades.reduce((sum, t) => sum + (t.result?.netProfitLossUsd || 0), 0)
              )}
            </p>
          </div>
        </>
      )}

      {/* Trade Detail Modal */}
      <TradeDetailModal
        trade={selectedTrade}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTrade(null);
        }}
      />
    </div>
  );
}
