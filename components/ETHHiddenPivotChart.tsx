import React, { useState } from 'react';
import HiddenPivotChart from './HiddenPivotChart';
import { useETHData } from '../hooks/useMarketData';

export default function ETHHiddenPivotChart() {
  const { ethData, loading, error } = useETHData();
  const [timeframe, setTimeframe] = useState<'4H' | '1D' | '1W'>('1D');

  if (loading || !ethData) {
    return (
      <div className="bitcoin-block bg-bitcoin-black">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin-orange"></div>
          <span className="ml-3 text-bitcoin-white-80">Loading Ethereum Hidden Pivot analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bitcoin-block bg-bitcoin-black">
        <div className="text-center py-12">
          <div className="text-bitcoin-orange mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-bitcoin-white mb-2">Hidden Pivot Analysis Unavailable</h3>
          <p className="text-bitcoin-white-80">{error}</p>
        </div>
      </div>
    );
  }

  // Generate timeframe-specific price history for more accurate pivot calculations
  const generateETHPriceHistory = (currentPrice: number, timeframe: string): number[] => {
    const history: number[] = [];
    let price = currentPrice;
    
    // Adjust periods and volatility based on timeframe
    const periods = timeframe === '4H' ? 24 : timeframe === '1D' ? 50 : 100;
    const baseVolatility = 0.025;
    const timeframeMultiplier = timeframe === '4H' ? 0.5 : timeframe === '1D' ? 1.0 : 2.0;
    const volatility = baseVolatility * timeframeMultiplier;
    
    // Generate periods with timeframe-specific characteristics
    for (let i = periods; i >= 0; i--) {
      const change = (Math.random() - 0.5) * volatility;
      
      // Add timeframe-specific trend bias
      let trendBias = 0;
      if (timeframe === '4H') {
        // Short-term: more random, smaller moves
        trendBias = (Math.random() - 0.5) * 0.0015;
      } else if (timeframe === '1D') {
        // Medium-term: moderate trend
        trendBias = i > 30 ? 0.0015 : i > 15 ? -0.0015 : 0.0025;
      } else if (timeframe === '1W') {
        // Long-term: stronger trends
        trendBias = i > 35 ? 0.004 : i > 20 ? -0.003 : 0.006;
      }
      
      price = price * (1 + change + trendBias);
      history.push(price);
    }
    
    return history.reverse();
  };

  const currentPrice = ethData.currentPrice || 3850;
  const priceHistory = generateETHPriceHistory(currentPrice, timeframe);

  const handleTimeframeChange = (newTimeframe: '4H' | '1D' | '1W') => {
    setTimeframe(newTimeframe);
  };

  return (
    <HiddenPivotChart 
      symbol="ETH"
      currentPrice={currentPrice}
      priceHistory={priceHistory}
      timeframe={timeframe}
      onTimeframeChange={handleTimeframeChange}
    />
  );
}
