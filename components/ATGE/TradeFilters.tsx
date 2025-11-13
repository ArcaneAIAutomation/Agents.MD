import React from 'react';
import { Filter, Calendar, TrendingUp, DollarSign, ArrowUpDown } from 'lucide-react';

export interface TradeFilters {
  status: 'all' | 'active' | 'completed_success' | 'completed_failure' | 'expired';
  timeframe: 'all' | '1h' | '4h' | '1d' | '1w';
  dateRange: '7d' | '30d' | '90d' | 'all' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
  profitLossMin?: number;
  profitLossMax?: number;
  sortBy: 'date' | 'profit' | 'confidence' | 'duration';
  sortOrder: 'asc' | 'desc';
}

interface TradeFiltersProps {
  filters: TradeFilters;
  onChange: (filters: TradeFilters) => void;
  className?: string;
}

export default function TradeFiltersComponent({
  filters,
  onChange,
  className = ''
}: TradeFiltersProps) {
  // Update filter handler
  const updateFilter = <K extends keyof TradeFilters>(
    key: K,
    value: TradeFilters[K]
  ) => {
    onChange({
      ...filters,
      [key]: value
    });
  };

  // Reset filters
  const resetFilters = () => {
    onChange({
      status: 'all',
      timeframe: 'all',
      dateRange: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.status !== 'all' ||
    filters.timeframe !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.profitLossMin !== undefined ||
    filters.profitLossMax !== undefined;

  return (
    <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter size={24} className="text-bitcoin-orange" />
          <h3 className="text-xl font-bold text-bitcoin-white">Filter & Sort Trades</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-bitcoin-orange hover:text-bitcoin-white text-sm font-semibold transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label className="flex items-center gap-2 text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-2">
            <TrendingUp size={16} />
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value as TradeFilters['status'])}
            className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-2 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors"
          >
            <option value="all">All Trades</option>
            <option value="active">Active</option>
            <option value="completed_success">Completed (Success)</option>
            <option value="completed_failure">Completed (Failure)</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Timeframe Filter */}
        <div>
          <label className="flex items-center gap-2 text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-2">
            <Calendar size={16} />
            Timeframe
          </label>
          <select
            value={filters.timeframe}
            onChange={(e) => updateFilter('timeframe', e.target.value as TradeFilters['timeframe'])}
            className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-2 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors"
          >
            <option value="all">All Timeframes</option>
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="flex items-center gap-2 text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-2">
            <Calendar size={16} />
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value as TradeFilters['dateRange'])}
            className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-2 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range (shown when custom is selected) */}
      {filters.dateRange === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg">
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              Start Date
            </label>
            <input
              type="date"
              value={filters.customStartDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => updateFilter('customStartDate', e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-2 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-bitcoin-white-60 text-sm font-semibold mb-2 block">
              End Date
            </label>
            <input
              type="date"
              value={filters.customEndDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => updateFilter('customEndDate', e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-2 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Profit/Loss Range Filter */}
      <div className="p-4 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg">
        <label className="flex items-center gap-2 text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-3">
          <DollarSign size={16} />
          Profit/Loss Range (USD)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-bitcoin-white-60 text-xs mb-2 block">Minimum</label>
            <input
              type="number"
              placeholder="e.g., -100"
              value={filters.profitLossMin || ''}
              onChange={(e) => updateFilter('profitLossMin', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-2 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-bitcoin-white-60 text-xs mb-2 block">Maximum</label>
            <input
              type="number"
              placeholder="e.g., 500"
              value={filters.profitLossMax || ''}
              onChange={(e) => updateFilter('profitLossMax', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-2 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              updateFilter('profitLossMin', 0);
              updateFilter('profitLossMax', undefined);
            }}
            className="text-xs bg-bitcoin-orange bg-opacity-20 border border-bitcoin-orange text-bitcoin-orange px-3 py-1 rounded hover:bg-opacity-30 transition-colors"
          >
            Profitable Only
          </button>
          <button
            onClick={() => {
              updateFilter('profitLossMin', undefined);
              updateFilter('profitLossMax', 0);
            }}
            className="text-xs bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-3 py-1 rounded hover:bg-opacity-30 transition-colors"
          >
            Losses Only
          </button>
        </div>
      </div>

      {/* Sort Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sort By */}
        <div>
          <label className="flex items-center gap-2 text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-2">
            <ArrowUpDown size={16} />
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as TradeFilters['sortBy'])}
            className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-2 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors"
          >
            <option value="date">Date Generated</option>
            <option value="profit">Profit/Loss</option>
            <option value="confidence">Confidence Score</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="flex items-center gap-2 text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider mb-2">
            <ArrowUpDown size={16} />
            Sort Order
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilter('sortOrder', e.target.value as TradeFilters['sortOrder'])}
            className="w-full bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg px-4 py-2 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none transition-colors"
          >
            <option value="desc">Descending (High to Low)</option>
            <option value="asc">Ascending (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="p-4 bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg">
          <p className="text-bitcoin-white text-sm font-semibold mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.status !== 'all' && (
              <span className="bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-3 py-1 rounded-full">
                Status: {filters.status}
              </span>
            )}
            {filters.timeframe !== 'all' && (
              <span className="bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-3 py-1 rounded-full">
                Timeframe: {filters.timeframe}
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-3 py-1 rounded-full">
                Date: {filters.dateRange}
              </span>
            )}
            {(filters.profitLossMin !== undefined || filters.profitLossMax !== undefined) && (
              <span className="bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-3 py-1 rounded-full">
                P/L Range: {filters.profitLossMin || '-∞'} to {filters.profitLossMax || '+∞'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
