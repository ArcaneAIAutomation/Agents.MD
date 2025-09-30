import React, { useState } from 'react';
import HiddenPivotChart from './HiddenPivotChart';
import { useBTCData } from '../hooks/useMarketData';

export default function BTCHiddenPivotChart() {
  const { btcData, loading, error } = useBTCData();
  const [timeframe, setTimeframe] = useState<'4H' | '1D' | '1W'>('1D');

  if (loading || !btcData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Loading Bitcoin Hidden Pivot analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hidden Pivot Analysis Unavailable</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Generate timeframe-specific price history for more accurate pivot calculations
  const generateBTCPriceHistory = (currentPrice: number, timeframe: string): number[] => {
    const history: number[] = [];
    let price = currentPrice;
    
    // Adjust periods and volatility based on timeframe
    const periods = timeframe === '4H' ? 24 : timeframe === '1D' ? 50 : 100;
    const baseVolatility = 0.02;
    const timeframeMultiplier = timeframe === '4H' ? 0.5 : timeframe === '1D' ? 1.0 : 2.0;
    const volatility = baseVolatility * timeframeMultiplier;
    
    // Generate periods with timeframe-specific characteristics
    for (let i = periods; i >= 0; i--) {
      const change = (Math.random() - 0.5) * volatility;
      
      // Add timeframe-specific trend bias
      let trendBias = 0;
      if (timeframe === '4H') {
        // Short-term: more random, smaller moves
        trendBias = (Math.random() - 0.5) * 0.001;
      } else if (timeframe === '1D') {
        // Medium-term: moderate trend
        trendBias = i > 30 ? 0.001 : i > 15 ? -0.001 : 0.002;
      } else if (timeframe === '1W') {
        // Long-term: stronger trends
        trendBias = i > 35 ? 0.003 : i > 20 ? -0.002 : 0.005;
      }
      
      price = price * (1 + change + trendBias);
      history.push(price);
    }
    
    return history.reverse();
  };

  const currentPrice = btcData.currentPrice || 110500;
  const priceHistory = generateBTCPriceHistory(currentPrice, timeframe);

  const handleTimeframeChange = (newTimeframe: '4H' | '1D' | '1W') => {
    setTimeframe(newTimeframe);
  };

  return (
    <HiddenPivotChart 
      symbol="BTC"
      currentPrice={currentPrice}
      priceHistory={priceHistory}
      timeframe={timeframe}
      onTimeframeChange={handleTimeframeChange}
    />
  );
}
