/**
 * Market Data Panel Component for UCIE
 * 
 * Displays multi-exchange price comparison, market metrics, and arbitrage opportunities
 * with Bitcoin Sovereign styling and mobile-optimized responsive layout.
 * 
 * Features:
 * - Multi-exchange price comparison table
 * - 24h volume, market cap, supply metrics
 * - Arbitrage opportunity highlights
 * - Real-time price updates (5-second interval)
 * - Mobile-first responsive design
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import type { PriceAggregation, ExchangePrice, ArbitrageOpportunity } from '../../lib/ucie/priceAggregation';

interface MarketDataPanelProps {
  symbol: string;
  aggregation?: PriceAggregation;
  data?: any; // Alternative prop name for compatibility
  marketCap?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export default function MarketDataPanel({
  symbol,
  aggregation: aggregationProp,
  data,
  marketCap,
  circulatingSupply,
  totalSupply,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 5000,
}: MarketDataPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Use either aggregation or data prop (for compatibility)
  const aggregation = aggregationProp || data?.priceAggregation || data;

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  const handleRefresh = async () => {
    if (isRefreshing || !onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastUpdate(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatSupply = (supply: number): string => {
    if (supply >= 1e9) return `${(supply / 1e9).toFixed(2)}B`;
    if (supply >= 1e6) return `${(supply / 1e6).toFixed(2)}M`;
    if (supply >= 1e3) return `${(supply / 1e3).toFixed(2)}K`;
    return supply.toFixed(2);
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-bitcoin-orange';
    if (change < 0) return 'text-bitcoin-white-80';
    return 'text-bitcoin-white-60';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-bitcoin-white mb-1">
            Market Data
          </h2>
          <p className="text-sm text-bitcoin-white-60">
            Multi-exchange price aggregation for {symbol}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Key Metrics Grid */}
      {aggregation ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* VWAP */}
          {aggregation.vwap !== undefined && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                VWAP
              </p>
              <p className="font-mono text-2xl font-bold text-bitcoin-orange">
                {formatPrice(aggregation.vwap)}
              </p>
            </div>
          )}

          {/* Average Price */}
          {aggregation.averagePrice !== undefined && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Avg Price
              </p>
              <p className="font-mono text-2xl font-bold text-bitcoin-white">
                {formatPrice(aggregation.averagePrice)}
              </p>
            </div>
          )}

          {/* 24h Volume */}
          {aggregation.totalVolume24h !== undefined && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                24h Volume
              </p>
              <p className="font-mono text-2xl font-bold text-bitcoin-white">
                {formatLargeNumber(aggregation.totalVolume24h)}
              </p>
            </div>
          )}

          {/* 24h Change */}
          {aggregation.averageChange24h !== undefined && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                24h Change
              </p>
              <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${getChangeColor(aggregation.averageChange24h)}`}>
                {getChangeIcon(aggregation.averageChange24h)}
                <span>{aggregation.averageChange24h.toFixed(2)}%</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-8 text-center">
          <p className="text-bitcoin-white-60">No market data available</p>
        </div>
      )}

      {/* Additional Metrics (if provided) */}
      {(marketCap || circulatingSupply || totalSupply) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketCap && (
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Market Cap
              </p>
              <p className="font-mono text-xl font-bold text-bitcoin-white">
                {formatLargeNumber(marketCap)}
              </p>
            </div>
          )}
          {circulatingSupply && (
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Circulating Supply
              </p>
              <p className="font-mono text-xl font-bold text-bitcoin-white">
                {formatSupply(circulatingSupply)}
              </p>
            </div>
          )}
          {totalSupply && (
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Total Supply
              </p>
              <p className="font-mono text-xl font-bold text-bitcoin-white">
                {formatSupply(totalSupply)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Price Variance Warning */}
      {aggregation.priceVariancePercentage > 2 && (
        <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-bitcoin-orange flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-bitcoin-orange mb-1">
              Significant Price Discrepancy Detected
            </p>
            <p className="text-sm text-bitcoin-white-80">
              Price variance of {aggregation.priceVariancePercentage.toFixed(2)}% detected across exchanges. 
              Range: {formatPrice(aggregation.lowestPrice)} - {formatPrice(aggregation.highestPrice)}
            </p>
          </div>
        </div>
      )}

      {/* Exchange Price Comparison Table */}
      <div>
        <h3 className="text-lg font-bold text-bitcoin-white mb-3">
          Exchange Prices
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bitcoin-orange-20">
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60">
                  Exchange
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60">
                  Price
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60">
                  24h Volume
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60">
                  24h Change
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {aggregation.prices.map((price, index) => (
                <tr
                  key={index}
                  className="border-b border-bitcoin-orange-20 hover:bg-bitcoin-orange hover:bg-opacity-5 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-bitcoin-white">
                    {price.exchange}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-bitcoin-white">
                    {price.success ? formatPrice(price.price) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-bitcoin-white-80">
                    {price.success && price.volume24h > 0 ? formatLargeNumber(price.volume24h) : '-'}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono ${getChangeColor(price.change24h)}`}>
                    {price.success ? (
                      <div className="flex items-center justify-end gap-1">
                        {getChangeIcon(price.change24h)}
                        <span>{price.change24h.toFixed(2)}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {price.success ? (
                      <CheckCircle className="w-5 h-5 text-bitcoin-orange inline-block" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-bitcoin-white-60 inline-block" title={price.error} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arbitrage Opportunities */}
      {aggregation.arbitrageOpportunities.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-bitcoin-white mb-3">
            Arbitrage Opportunities
          </h3>
          <div className="space-y-3">
            {aggregation.arbitrageOpportunities.map((opp, index) => (
              <div
                key={index}
                className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-bitcoin-orange">
                    {opp.spreadPercentage.toFixed(2)}% Spread
                  </span>
                  <span className="text-sm text-bitcoin-white-60">
                    Potential: {formatPrice(opp.potentialProfit)} per unit
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-bitcoin-white-60 mb-1">Buy from</p>
                    <p className="font-semibold text-bitcoin-white">{opp.buyExchange}</p>
                    <p className="font-mono text-bitcoin-white-80">{formatPrice(opp.buyPrice)}</p>
                  </div>
                  <div>
                    <p className="text-bitcoin-white-60 mb-1">Sell to</p>
                    <p className="font-semibold text-bitcoin-white">{opp.sellExchange}</p>
                    <p className="font-mono text-bitcoin-white-80">{formatPrice(opp.sellPrice)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Quality Indicator */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-bitcoin-white-60">Data Quality:</span>
          <span className={`font-semibold ${
            aggregation.dataQuality >= 80 ? 'text-bitcoin-orange' :
            aggregation.dataQuality >= 60 ? 'text-bitcoin-white' :
            'text-bitcoin-white-60'
          }`}>
            {aggregation.dataQuality.toFixed(0)}%
          </span>
        </div>
        <div className="text-bitcoin-white-60">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
