/**
 * Example Usage of PerformanceAnalytics Component
 * 
 * This file demonstrates how to integrate the PerformanceAnalytics component
 * into your application. You can copy this code into ATGEInterface.tsx or
 * create a separate analytics page.
 */

import React, { useState } from 'react';
import PerformanceAnalytics from './PerformanceAnalytics';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function PerformanceAnalyticsExample() {
  const [selectedSymbol, setSelectedSymbol] = useState<'BTC' | 'ETH' | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Calculate date range
  const getDateRange = () => {
    const end = new Date().toISOString();
    const start = new Date();
    
    switch (dateRange) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case 'all':
        return { startDate: undefined, endDate: undefined };
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end
    };
  };

  const { startDate, endDate } = getDateRange();

  return (
    <div className="min-h-screen bg-bitcoin-black p-6">
      {/* Header */}
      <div className="bg-bitcoin-black border-b-2 border-bitcoin-orange px-6 py-4 rounded-t-xl mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 size={32} className="text-bitcoin-orange" />
          <h1 className="text-3xl font-bold text-bitcoin-white">
            Performance Analytics
          </h1>
        </div>
        <p className="text-sm text-bitcoin-white-60 italic">
          Comprehensive trade performance analysis and insights
        </p>
      </div>

      {/* Filters */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Symbol Filter */}
          <div>
            <label className="block text-bitcoin-white-60 text-sm font-semibold mb-2">
              Symbol
            </label>
            <div className="flex gap-2">
              {(['ALL', 'BTC', 'ETH'] as const).map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedSymbol === symbol
                      ? 'bg-bitcoin-orange text-bitcoin-black'
                      : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-bitcoin-white-60 text-sm font-semibold mb-2">
              Date Range
            </label>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    dateRange === range
                      ? 'bg-bitcoin-orange text-bitcoin-black'
                      : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
                  }`}
                >
                  {range === 'all' ? 'All Time' : range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Component */}
      <PerformanceAnalytics
        filters={{
          symbol: selectedSymbol === 'ALL' ? undefined : selectedSymbol,
          startDate,
          endDate
        }}
      />

      {/* Info Box */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6 mt-6">
        <div className="flex items-start gap-3">
          <TrendingUp size={24} className="text-bitcoin-orange flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-bitcoin-white font-bold mb-2">About Performance Analytics</h4>
            <p className="text-bitcoin-white-80 text-sm mb-2">
              This dashboard provides comprehensive insights into your trading performance:
            </p>
            <ul className="text-bitcoin-white-60 text-sm space-y-1 list-disc list-inside">
              <li><strong className="text-bitcoin-orange">Win Rate Chart:</strong> Track your success rate over time</li>
              <li><strong className="text-bitcoin-orange">P/L Distribution:</strong> Visualize profit and loss patterns</li>
              <li><strong className="text-bitcoin-orange">Best/Worst Trades:</strong> Learn from your top performers and mistakes</li>
              <li><strong className="text-bitcoin-orange">Symbol Comparison:</strong> Compare BTC vs ETH performance</li>
              <li><strong className="text-bitcoin-orange">Timeframe Analysis:</strong> Identify optimal trading timeframes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
