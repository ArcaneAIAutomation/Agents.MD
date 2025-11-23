import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, AlertCircle, Eye } from 'lucide-react';

interface TradeResult {
  id: string;
  actualEntryPrice: number;
  actualExitPrice?: number;
  tp1Hit: boolean;
  tp1HitAt?: Date;
  tp1HitPrice?: number;
  tp2Hit: boolean;
  tp2HitAt?: Date;
  tp2HitPrice?: number;
  tp3Hit: boolean;
  tp3HitAt?: Date;
  tp3HitPrice?: number;
  stopLossHit: boolean;
  stopLossHitAt?: Date;
  stopLossHitPrice?: number;
  profitLossUsd?: number;
  profitLossPercentage?: number;
  netProfitLossUsd?: number;
}

interface Trade {
  id: string;
  symbol: string;
  status: string;
  entryPrice: number;
  tp1Price: number;
  tp2Price: number;
  tp3Price: number;
  stopLossPrice: number;
  timeframe: string;
  confidenceScore: number;
  generatedAt: Date;
  expiresAt: Date;
  result?: TradeResult;
}

interface RecentTradeHistoryProps {
  symbol: string;
  lastGeneratedAt?: Date | null;
  className?: string;
}

// Mobile viewport detection hook
function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return { isMobile };
}

export default function RecentTradeHistory({
  symbol,
  lastGeneratedAt,
  className = ''
}: RecentTradeHistoryProps) {
  const { isMobile } = useMobileViewport();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent trades
  const fetchRecentTrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/atge/trades?symbol=${symbol}&limit=10&sortBy=generated_at&sortOrder=DESC`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recent trades');
      }

      const data = await response.json();

      if (data.success) {
        setTrades(data.trades || []);
      } else {
        throw new Error(data.error || 'Failed to fetch trades');
      }
    } catch (err) {
      console.error('Error fetching recent trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trade history');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when new trade is generated
  useEffect(() => {
    fetchRecentTrades();
  }, [symbol, lastGeneratedAt]);

  // Get status display info
  const getStatusInfo = (trade: Trade) => {
    const status = trade.status.toLowerCase();
    
    if (status === 'active') {
      return {
        label: 'Active',
        color: 'text-bitcoin-orange',
        bgColor: 'bg-bitcoin-orange bg-opacity-10',
        borderColor: 'border-bitcoin-orange'
      };
    }
    
    if (status.includes('tp')) {
      return {
        label: 'Completed Success',
        color: 'text-bitcoin-orange',
        bgColor: 'bg-bitcoin-orange bg-opacity-10',
        borderColor: 'border-bitcoin-orange'
      };
    }
    
    if (status.includes('stop_loss')) {
      return {
        label: 'Completed Failure',
        color: 'text-bitcoin-white-60',
        bgColor: 'bg-bitcoin-white bg-opacity-5',
        borderColor: 'border-bitcoin-white-20'
      };
    }
    
    if (status === 'expired') {
      return {
        label: 'Expired',
        color: 'text-bitcoin-white-60',
        bgColor: 'bg-bitcoin-white bg-opacity-5',
        borderColor: 'border-bitcoin-white-20'
      };
    }
    
    return {
      label: status,
      color: 'text-bitcoin-white-60',
      bgColor: 'bg-bitcoin-white bg-opacity-5',
      borderColor: 'border-bitcoin-white-20'
    };
  };

  // Format profit/loss
  const formatProfitLoss = (trade: Trade) => {
    if (!trade.result || trade.result.netProfitLossUsd === undefined) {
      return null;
    }

    const pl = trade.result.netProfitLossUsd;
    const plPercent = trade.result.profitLossPercentage || 0;
    const isProfit = pl > 0;

    return {
      amount: `${isProfit ? '+' : ''}$${Math.abs(pl).toFixed(2)}`,
      percentage: `${isProfit ? '+' : ''}${plPercent.toFixed(2)}%`,
      isProfit
    };
  };

  // Handle view details
  const handleViewDetails = (tradeId: string) => {
    // TODO: Open trade details modal or navigate to trade details page
    console.log('View details for trade:', tradeId);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">
          Recent Trade History
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin-orange"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">
          Recent Trade History
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle size={48} className="text-bitcoin-orange mb-4" />
          <p className="text-bitcoin-white-60 mb-4">{error}</p>
          <button
            onClick={fetchRecentTrades}
            className="bg-bitcoin-orange text-bitcoin-black font-bold px-4 py-2 rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (trades.length === 0) {
    return (
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">
          Recent Trade History
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock size={48} className="text-bitcoin-white-60 mb-4" />
          <p className="text-bitcoin-white-60 mb-2">No trades yet</p>
          <p className="text-bitcoin-white-60 text-sm">
            Generate your first trade signal to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold text-bitcoin-white ${isMobile ? 'text-lg' : 'text-xl'}`}>
          Recent Trade History
        </h3>
        <span className="text-bitcoin-white-60 text-sm">
          Last {trades.length} trades
        </span>
      </div>

      {/* Mobile: Card layout */}
      {isMobile ? (
        <div className="space-y-3">
          {trades.map((trade) => {
            const statusInfo = getStatusInfo(trade);
            const plInfo = formatProfitLoss(trade);

            return (
              <div
                key={trade.id}
                className={`bg-bitcoin-black border ${statusInfo.borderColor} rounded-lg p-3`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-bitcoin-white">
                      {trade.symbol}
                    </span>
                    <span className="text-bitcoin-white-60 text-xs">
                      {trade.timeframe}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${statusInfo.bgColor} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Entry Price */}
                <div className="mb-2">
                  <span className="text-bitcoin-white-60 text-xs">Entry: </span>
                  <span className="font-mono text-sm text-bitcoin-white">
                    ${trade.entryPrice.toFixed(2)}
                  </span>
                </div>

                {/* P/L */}
                {plInfo && (
                  <div className="flex items-center gap-2 mb-2">
                    {plInfo.isProfit ? (
                      <TrendingUp size={16} className="text-bitcoin-orange" />
                    ) : (
                      <TrendingDown size={16} className="text-bitcoin-white-60" />
                    )}
                    <span className={`font-mono text-sm font-bold ${plInfo.isProfit ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                      {plInfo.amount}
                    </span>
                    <span className={`text-xs ${plInfo.isProfit ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                      ({plInfo.percentage})
                    </span>
                  </div>
                )}

                {/* Date */}
                <div className="text-bitcoin-white-60 text-xs mb-3">
                  {new Date(trade.generatedAt).toLocaleDateString()}
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => handleViewDetails(trade.id)}
                  className="w-full flex items-center justify-center gap-2 bg-bitcoin-orange text-bitcoin-black font-semibold text-sm px-3 py-2 rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange hover:border hover:border-bitcoin-orange transition-all min-h-[44px]"
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop: Table layout */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bitcoin-orange-20">
                <th className="text-left text-bitcoin-white-60 text-sm font-semibold pb-3 px-2">
                  Symbol
                </th>
                <th className="text-left text-bitcoin-white-60 text-sm font-semibold pb-3 px-2">
                  Status
                </th>
                <th className="text-right text-bitcoin-white-60 text-sm font-semibold pb-3 px-2">
                  Entry Price
                </th>
                <th className="text-right text-bitcoin-white-60 text-sm font-semibold pb-3 px-2">
                  P/L
                </th>
                <th className="text-left text-bitcoin-white-60 text-sm font-semibold pb-3 px-2">
                  Timeframe
                </th>
                <th className="text-left text-bitcoin-white-60 text-sm font-semibold pb-3 px-2">
                  Date
                </th>
                <th className="text-center text-bitcoin-white-60 text-sm font-semibold pb-3 px-2">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const statusInfo = getStatusInfo(trade);
                const plInfo = formatProfitLoss(trade);

                return (
                  <tr
                    key={trade.id}
                    className="border-b border-bitcoin-orange-20 hover:bg-bitcoin-white hover:bg-opacity-5 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <span className="font-mono font-bold text-bitcoin-white">
                        {trade.symbol}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-mono text-sm text-bitcoin-white">
                        ${trade.entryPrice.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {plInfo ? (
                        <div className="flex items-center justify-end gap-2">
                          {plInfo.isProfit ? (
                            <TrendingUp size={16} className="text-bitcoin-orange" />
                          ) : (
                            <TrendingDown size={16} className="text-bitcoin-white-60" />
                          )}
                          <div className="text-right">
                            <div className={`font-mono text-sm font-bold ${plInfo.isProfit ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                              {plInfo.amount}
                            </div>
                            <div className={`text-xs ${plInfo.isProfit ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                              {plInfo.percentage}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-bitcoin-white-60 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-bitcoin-white-60 text-sm">
                        {trade.timeframe}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-bitcoin-white-60 text-sm">
                        {new Date(trade.generatedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleViewDetails(trade.id)}
                        className="inline-flex items-center gap-2 bg-bitcoin-orange text-bitcoin-black font-semibold text-sm px-3 py-1.5 rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange hover:border hover:border-bitcoin-orange transition-all"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
