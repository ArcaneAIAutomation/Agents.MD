/**
 * Einstein RefreshButton - Usage Examples
 * 
 * This file demonstrates how to integrate the RefreshButton component
 * into various parts of the Einstein Trade Engine UI.
 */

import React, { useState } from 'react';
import { RefreshButton } from './RefreshButton';

// ============================================================================
// Example 1: Basic Usage in Trade Signal Card
// ============================================================================

export const TradeSignalCardExample: React.FC = () => {
  const [dataQuality, setDataQuality] = useState(95);
  const [lastPrice, setLastPrice] = useState(95000);
  const [changedFields, setChangedFields] = useState<string[]>([]);

  const handleRefreshComplete = (result: any) => {
    console.log('Refresh complete:', result);
    
    // Update data quality
    setDataQuality(result.dataQuality.overall);
    
    // Highlight changed fields (Requirement 16.3)
    if (result.changes.priceChanged) {
      setChangedFields(prev => [...prev, 'price']);
      setLastPrice(prev => prev + result.changes.priceDelta);
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setChangedFields(prev => prev.filter(f => f !== 'price'));
      }, 3000);
    }
    
    // Show notification if significant changes
    if (result.changes.significantChanges) {
      alert('Significant market changes detected! Review updated analysis.');
    }
  };

  const handleRefreshError = (error: Error) => {
    console.error('Refresh failed:', error);
    alert(`Failed to refresh data: ${error.message}`);
  };

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-bitcoin-white">
          BTC Trade Signal
        </h3>
        
        {/* Compact Refresh Button */}
        <RefreshButton
          symbol="BTC"
          timeframe="1h"
          onRefreshComplete={handleRefreshComplete}
          onRefreshError={handleRefreshError}
          compact
        />
      </div>

      {/* Data Quality Badge */}
      <div className="mb-4">
        <span className={`
          inline-block px-3 py-1 rounded-full text-sm font-semibold
          ${dataQuality >= 90 ? 'bg-green-500 text-bitcoin-black' : 
            dataQuality >= 70 ? 'bg-orange-500 text-bitcoin-black' : 
            'bg-red-500 text-bitcoin-white'}
        `}>
          {dataQuality}% Data Quality
        </span>
      </div>

      {/* Price Display with Change Highlight */}
      <div className={`
        p-4 rounded-lg transition-all duration-300
        ${changedFields.includes('price') 
          ? 'bg-bitcoin-orange-10 shadow-[0_0_20px_rgba(247,147,26,0.3)]' 
          : 'bg-bitcoin-black'}
      `}>
        <p className="text-bitcoin-white-60 text-sm mb-1">Current Price</p>
        <p className="text-bitcoin-orange text-3xl font-mono font-bold">
          ${lastPrice.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Example 2: Full Refresh Button in Analysis Modal
// ============================================================================

export const AnalysisModalExample: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  const handleRefreshComplete = (result: any) => {
    setRefreshResult(result);
    setIsRefreshing(false);
    
    // Log changes for debugging
    console.log('Data changes:', {
      priceChanged: result.changes.priceChanged,
      priceDelta: result.changes.priceDelta,
      indicatorsChanged: result.changes.indicatorsChanged,
      significantChanges: result.changes.significantChanges
    });
  };

  const handleRefreshError = (error: Error) => {
    setIsRefreshing(false);
    console.error('Refresh error:', error);
  };

  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 max-w-4xl mx-auto">
      {/* Modal Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-bitcoin-white mb-2">
          Einstein Analysis
        </h2>
        <p className="text-bitcoin-white-80">
          Comprehensive multi-dimensional trade analysis
        </p>
      </div>

      {/* Full Refresh Button */}
      <div className="mb-6">
        <RefreshButton
          symbol="BTC"
          timeframe="4h"
          onRefreshComplete={handleRefreshComplete}
          onRefreshError={handleRefreshError}
          className="w-full"
        />
      </div>

      {/* Refresh Results Display */}
      {refreshResult && (
        <div className="space-y-4">
          {/* Data Quality */}
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <h4 className="text-bitcoin-white font-bold mb-2">Data Quality</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div>
                <p className="text-bitcoin-white-60 text-xs">Overall</p>
                <p className="text-bitcoin-orange font-mono font-bold">
                  {refreshResult.dataQuality.overall}%
                </p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-xs">Market</p>
                <p className="text-bitcoin-white font-mono">
                  {refreshResult.dataQuality.market}%
                </p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-xs">Sentiment</p>
                <p className="text-bitcoin-white font-mono">
                  {refreshResult.dataQuality.sentiment}%
                </p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-xs">On-Chain</p>
                <p className="text-bitcoin-white font-mono">
                  {refreshResult.dataQuality.onChain}%
                </p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-xs">Technical</p>
                <p className="text-bitcoin-white font-mono">
                  {refreshResult.dataQuality.technical}%
                </p>
              </div>
            </div>
          </div>

          {/* Changes Detected */}
          {refreshResult.changes.significantChanges && (
            <div className="bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg p-4">
              <h4 className="text-bitcoin-orange font-bold mb-2">
                ⚠️ Significant Changes Detected
              </h4>
              <ul className="space-y-1 text-bitcoin-white-80 text-sm">
                {refreshResult.changes.priceChanged && (
                  <li>
                    • Price changed by ${Math.abs(refreshResult.changes.priceDelta).toFixed(2)}
                  </li>
                )}
                {refreshResult.changes.indicatorsChanged.length > 0 && (
                  <li>
                    • Indicators changed: {refreshResult.changes.indicatorsChanged.join(', ')}
                  </li>
                )}
                {refreshResult.changes.sentimentChanged && (
                  <li>• Sentiment analysis updated</li>
                )}
                {refreshResult.changes.onChainChanged && (
                  <li>• On-chain metrics updated</li>
                )}
              </ul>
            </div>
          )}

          {/* Successful Sources */}
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <h4 className="text-bitcoin-white font-bold mb-2">
              Data Sources ({refreshResult.dataQuality.sources.successful.length} successful)
            </h4>
            <div className="flex flex-wrap gap-2">
              {refreshResult.dataQuality.sources.successful.map((source: string) => (
                <span
                  key={source}
                  className="px-2 py-1 bg-green-500 text-bitcoin-black text-xs rounded"
                >
                  ✓ {source}
                </span>
              ))}
              {refreshResult.dataQuality.sources.failed.map((source: string) => (
                <span
                  key={source}
                  className="px-2 py-1 bg-red-500 text-bitcoin-white text-xs rounded"
                >
                  ✗ {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 3: Refresh Button in Trade History
// ============================================================================

export const TradeHistoryExample: React.FC = () => {
  const [trades, setTrades] = useState([
    { id: '1', symbol: 'BTC', price: 95000, status: 'EXECUTED' },
    { id: '2', symbol: 'ETH', price: 3500, status: 'PENDING' }
  ]);

  const handleRefreshTrade = (tradeId: string) => (result: any) => {
    console.log(`Trade ${tradeId} refreshed:`, result);
    
    // Update trade data
    setTrades(prev => prev.map(trade => {
      if (trade.id === tradeId) {
        return {
          ...trade,
          price: trade.price + result.changes.priceDelta,
          lastRefreshed: result.timestamp
        };
      }
      return trade;
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-bitcoin-white">Trade History</h2>
      
      {trades.map(trade => (
        <div
          key={trade.id}
          className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-bitcoin-white font-bold">{trade.symbol}</h3>
              <p className="text-bitcoin-white-60 text-sm">
                ${trade.price.toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`
                px-3 py-1 rounded-full text-sm font-semibold
                ${trade.status === 'EXECUTED' 
                  ? 'bg-green-500 text-bitcoin-black' 
                  : 'bg-orange-500 text-bitcoin-black'}
              `}>
                {trade.status}
              </span>
              
              <RefreshButton
                symbol={trade.symbol}
                onRefreshComplete={handleRefreshTrade(trade.id)}
                compact
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Example 4: Refresh Button with Target Hit Detection
// ============================================================================

export const TargetHitDetectionExample: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [targetHitMessage, setTargetHitMessage] = useState('');

  const handleRefreshComplete = (result: any) => {
    // Requirement 16.4: Detect if price targets hit
    // This would be implemented in the parent component with actual trade data
    
    // Example: Check if TP1 was hit
    const currentPrice = 96000; // Would come from result
    const tp1 = 95500;
    
    if (currentPrice >= tp1) {
      setTargetHitMessage('🎯 TP1 target hit! Consider updating trade status.');
      setShowNotification(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  return (
    <div className="relative">
      <RefreshButton
        symbol="BTC"
        onRefreshComplete={handleRefreshComplete}
      />
      
      {/* Target Hit Notification (Requirement 16.4) */}
      {showNotification && (
        <div className="mt-4 p-4 bg-bitcoin-orange text-bitcoin-black rounded-lg animate-pulse">
          <p className="font-bold">{targetHitMessage}</p>
          <button
            onClick={() => setShowNotification(false)}
            className="mt-2 px-4 py-2 bg-bitcoin-black text-bitcoin-orange rounded"
          >
            Update Status
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Export All Examples
// ============================================================================

export default {
  TradeSignalCardExample,
  AnalysisModalExample,
  TradeHistoryExample,
  TargetHitDetectionExample
};
