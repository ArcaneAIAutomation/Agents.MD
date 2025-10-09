import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Calculator, Zap } from 'lucide-react';

interface FibLevel {
  level: number;
  price: number;
  type: 'extension' | 'retracement';
  strength: 'Strong' | 'Moderate' | 'Weak';
}

interface HiddenPivotData {
  pivotHigh: number;
  pivotLow: number;
  currentPrice: number;
  fibExtensions: FibLevel[];
  hiddenPivots: {
    bullish: number[];
    bearish: number[];
  };
}

interface HiddenPivotChartProps {
  symbol: 'BTC' | 'ETH';
  currentPrice: number;
  priceHistory?: number[];
  timeframe?: '4H' | '1D' | '1W';
  onTimeframeChange?: (timeframe: '4H' | '1D' | '1W') => void;
}

export default function HiddenPivotChart({ symbol, currentPrice, priceHistory = [], timeframe: propTimeframe, onTimeframeChange }: HiddenPivotChartProps) {
  const [pivotData, setPivotData] = useState<HiddenPivotData | null>(null);
  const [timeframe, setTimeframe] = useState<'4H' | '1D' | '1W'>(propTimeframe || '1D');
  const [activeView, setActiveView] = useState<'extensions' | 'pivots'>('extensions');

  // Handle timeframe changes
  const handleTimeframeChange = (newTimeframe: '4H' | '1D' | '1W') => {
    setTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  // Sync with prop timeframe
  useEffect(() => {
    if (propTimeframe && propTimeframe !== timeframe) {
      setTimeframe(propTimeframe);
    }
  }, [propTimeframe]);

  // Calculate Hidden Pivots and Fibonacci Extensions
  const calculateHiddenPivots = (prices: number[], current: number): HiddenPivotData => {
    if (prices.length < 10) {
      // Generate timeframe-specific price history if not provided
      const periods = timeframe === '4H' ? 24 : timeframe === '1D' ? 50 : 100;
      prices = generatePriceHistory(current, periods);
    }

    // Find pivot points with timeframe-adjusted lookback
    const lookback = timeframe === '4H' ? 3 : timeframe === '1D' ? 5 : 10;
    const pivots = findPivotPoints(prices, lookback);
    
    // Use timeframe-appropriate range for calculations
    const rangePeriods = timeframe === '4H' ? 12 : timeframe === '1D' ? 20 : 40;
    const recentPrices = prices.slice(-rangePeriods);
    const lastHigh = Math.max(...recentPrices);
    const lastLow = Math.min(...recentPrices);
    
    // Calculate Fibonacci extensions
    const range = lastHigh - lastLow;
    const fibLevels = [0.618, 1.0, 1.272, 1.414, 1.618, 2.0, 2.618];
    
    const fibExtensions: FibLevel[] = fibLevels.map(level => {
      const bullishTarget = lastHigh + (range * (level - 1));
      const bearishTarget = lastLow - (range * (level - 1));
      
      return {
        level: level,
        price: current > lastLow + (range * 0.5) ? bullishTarget : bearishTarget,
        type: 'extension' as const,
        strength: level === 1.618 || level === 2.618 ? 'Strong' : 
                 level === 1.272 || level === 2.0 ? 'Moderate' : 'Weak'
      };
    });

    // Calculate hidden pivot levels
    const hiddenBullishPivots = calculateHiddenBullishPivots(prices, lastLow, lastHigh);
    const hiddenBearishPivots = calculateHiddenBearishPivots(prices, lastLow, lastHigh);

    return {
      pivotHigh: lastHigh,
      pivotLow: lastLow,
      currentPrice: current,
      fibExtensions,
      hiddenPivots: {
        bullish: hiddenBullishPivots,
        bearish: hiddenBearishPivots
      }
    };
  };

  // Seeded random number generator for consistent results
  const seededRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate realistic price history based on timeframe
  const generatePriceHistory = (basePrice: number, periods: number): number[] => {
    const prices: number[] = [];
    let price = basePrice;
    
    // Create a consistent seed based on timeframe and symbol
    const timeframeSeed = timeframe === '4H' ? 1 : timeframe === '1D' ? 2 : 3;
    const symbolSeed = symbol === 'BTC' ? 100 : 200;
    let seedCounter = 1000; // Offset to avoid conflicts with parent components
    
    // Adjust volatility based on timeframe
    const baseVolatility = symbol === 'BTC' ? 0.02 : 0.025;
    const timeframeMultiplier = timeframe === '4H' ? 0.5 : timeframe === '1D' ? 1.0 : 2.0;
    const volatility = baseVolatility * timeframeMultiplier;

    // Generate periods with timeframe-specific characteristics
    for (let i = periods; i >= 0; i--) {
      const randomSeed1 = timeframeSeed + symbolSeed + seedCounter++;
      const randomSeed2 = timeframeSeed + symbolSeed + seedCounter++;
      
      const change = (seededRandom(randomSeed1) - 0.5) * volatility;
      
      // Add timeframe-specific trend bias
      let trendBias = 0;
      if (timeframe === '4H') {
        // Short-term: more random, smaller moves
        trendBias = (seededRandom(randomSeed2) - 0.5) * 0.001;
      } else if (timeframe === '1D') {
        // Medium-term: moderate trend
        trendBias = i > 30 ? 0.002 : i > 15 ? -0.001 : 0.003;
      } else if (timeframe === '1W') {
        // Long-term: stronger trends
        trendBias = i > 35 ? 0.005 : i > 20 ? -0.003 : 0.008;
      }
      
      price = price * (1 + change + trendBias);
      prices.push(price);
    }
    
    return prices.reverse();
  };

  // Find pivot points with adjustable lookback
  const findPivotPoints = (prices: number[], lookback: number = 2): { highs: number[], lows: number[] } => {
    const highs: number[] = [];
    const lows: number[] = [];
    
    for (let i = lookback; i < prices.length - lookback; i++) {
      // Pivot High: current price higher than lookback periods before and after
      let isHigh = true;
      let isLow = true;
      
      for (let j = 1; j <= lookback; j++) {
        if (prices[i] <= prices[i-j] || prices[i] <= prices[i+j]) {
          isHigh = false;
        }
        if (prices[i] >= prices[i-j] || prices[i] >= prices[i+j]) {
          isLow = false;
        }
      }
      
      if (isHigh) highs.push(prices[i]);
      if (isLow) lows.push(prices[i]);
    }
    
    return { highs, lows };
  };

  // Calculate hidden bullish pivots
  const calculateHiddenBullishPivots = (prices: number[], low: number, high: number): number[] => {
    const range = high - low;
    const golden = 0.618;
    
    return [
      low + (range * golden), // 61.8% retracement
      low + (range * 0.786), // 78.6% retracement
      low + (range * 0.5),   // 50% retracement
      high + (range * 0.272), // 27.2% extension
      high + (range * 0.618), // 61.8% extension
    ];
  };

  // Calculate hidden bearish pivots
  const calculateHiddenBearishPivots = (prices: number[], low: number, high: number): number[] => {
    const range = high - low;
    
    return [
      high - (range * 0.618), // 61.8% retracement
      high - (range * 0.786), // 78.6% retracement
      high - (range * 0.5),   // 50% retracement
      low - (range * 0.272),  // 27.2% extension
      low - (range * 0.618),  // 61.8% extension
    ];
  };

  // Format price for display
  const formatPrice = (price: number): string => {
    if (symbol === 'BTC') {
      return price >= 1000 ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` 
                           : `$${price.toFixed(2)}`;
    }
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  // Calculate percentage from current price
  const getPercentageChange = (targetPrice: number): string => {
    const change = ((targetPrice - currentPrice) / currentPrice) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  useEffect(() => {
    const data = calculateHiddenPivots(priceHistory, currentPrice);
    setPivotData(data);
  }, [currentPrice, priceHistory, symbol, timeframe]); // Added timeframe dependency

  if (!pivotData) {
    return (
      <div className="bitcoin-block-subtle p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin-orange"></div>
          <span className="ml-3 text-bitcoin-white-80">Calculating Hidden Pivots...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bitcoin-block-subtle p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-bitcoin-black border border-bitcoin-orange rounded-lg">
            <Calculator className="h-6 w-6 text-bitcoin-orange" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-bitcoin-white">
              {symbol} Hidden Pivot Analysis
            </h3>
            <p className="text-sm text-bitcoin-white-60">
              Fibonacci Extensions & Hidden Support/Resistance
            </p>
          </div>
        </div>
        
        {/* Timeframe Selector - Bitcoin Sovereign Style */}
        <div className="flex bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-1">
          {(['4H', '1D', '1W'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-bitcoin-orange text-bitcoin-black shadow-sm'
                  : 'text-bitcoin-white-80 hover:text-bitcoin-orange'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle - Bitcoin Sovereign Style */}
      <div className="flex bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveView('extensions')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
            activeView === 'extensions'
              ? 'bg-bitcoin-orange text-bitcoin-black shadow-sm'
              : 'text-bitcoin-white-80 hover:text-bitcoin-orange'
          }`}
        >
          Fib Extensions
        </button>
        <button
          onClick={() => setActiveView('pivots')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
            activeView === 'pivots'
              ? 'bg-bitcoin-orange text-bitcoin-black shadow-sm'
              : 'text-bitcoin-white-80 hover:text-bitcoin-orange'
          }`}
        >
          Hidden Pivots
        </button>
      </div>

      {/* Current Price Display - Bitcoin Sovereign Style */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-bitcoin-white-60">Current {symbol} Price</p>
            <p className="text-2xl font-bold text-bitcoin-orange font-mono">{formatPrice(currentPrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-bitcoin-white-60">Pivot Range ({timeframe})</p>
            <p className="text-lg font-semibold text-bitcoin-orange font-mono">
              {formatPrice(pivotData.pivotLow)} - {formatPrice(pivotData.pivotHigh)}
            </p>
          </div>
        </div>
      </div>

      {/* Fibonacci Extensions View */}
      {activeView === 'extensions' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-5 w-5 text-bitcoin-orange" />
            <h4 className="font-semibold text-bitcoin-white">Fibonacci Extension Levels</h4>
          </div>
          
          <div className="grid gap-3">
            {pivotData.fibExtensions.map((fib, index) => {
              const isAboveCurrent = fib.price > currentPrice;
              const distance = Math.abs(fib.price - currentPrice);
              const percentageChange = getPercentageChange(fib.price);
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    fib.strength === 'Strong'
                      ? 'border-bitcoin-orange bg-bitcoin-black hover:border-bitcoin-orange hover:shadow-[0_0_10px_rgba(247,147,26,0.3)]'
                      : fib.strength === 'Moderate'
                      ? 'border-bitcoin-orange-20 bg-bitcoin-black hover:border-bitcoin-orange'
                      : 'border-bitcoin-orange-20 bg-bitcoin-black hover:border-bitcoin-orange-20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        fib.strength === 'Strong'
                          ? 'bg-bitcoin-orange'
                          : fib.strength === 'Moderate'
                          ? 'bg-bitcoin-orange border border-bitcoin-black'
                          : 'bg-bitcoin-white-60'
                      }`} />
                      <div>
                        <p className="font-semibold text-bitcoin-white">
                          {fib.level}x Extension
                        </p>
                        <p className="text-sm text-bitcoin-white-60">
                          {fib.strength} Level
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-bitcoin-orange font-mono">{formatPrice(fib.price)}</p>
                      <p className="text-sm font-medium text-bitcoin-orange">
                        {percentageChange}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-bitcoin-white-60">
                    {isAboveCurrent ? '↗ Resistance Target' : '↘ Support Target'} • 
                    Distance: {formatPrice(distance)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hidden Pivots View */}
      {activeView === 'pivots' && (
        <div className="space-y-6">
          {/* Bullish Hidden Pivots */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-bitcoin-orange" />
              <h4 className="font-semibold text-bitcoin-white">Bullish Hidden Pivots</h4>
            </div>
            
            <div className="grid gap-2">
              {pivotData.hiddenPivots.bullish.map((price, index) => {
                const percentageChange = getPercentageChange(price);
                const isReached = currentPrice >= price;
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-all ${
                      isReached
                        ? 'border-bitcoin-orange bg-bitcoin-black shadow-[0_0_10px_rgba(247,147,26,0.3)]'
                        : 'border-bitcoin-orange-20 bg-bitcoin-black hover:border-bitcoin-orange'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-bitcoin-orange" />
                        <span className="font-medium text-bitcoin-white">
                          Hidden Pivot {index + 1}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-bitcoin-orange font-mono">{formatPrice(price)}</p>
                        <p className="text-sm text-bitcoin-orange">{percentageChange}</p>
                      </div>
                    </div>
                    {isReached && (
                      <p className="text-xs text-bitcoin-orange mt-1">✓ Level Reached</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bearish Hidden Pivots */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-bitcoin-orange rotate-180" />
              <h4 className="font-semibold text-bitcoin-white">Bearish Hidden Pivots</h4>
            </div>
            
            <div className="grid gap-2">
              {pivotData.hiddenPivots.bearish.map((price, index) => {
                const percentageChange = getPercentageChange(price);
                const isReached = currentPrice <= price;
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-all ${
                      isReached
                        ? 'border-bitcoin-orange bg-bitcoin-black shadow-[0_0_10px_rgba(247,147,26,0.3)]'
                        : 'border-bitcoin-orange-20 bg-bitcoin-black hover:border-bitcoin-orange'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-bitcoin-orange" />
                        <span className="font-medium text-bitcoin-white">
                          Hidden Pivot {index + 1}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-bitcoin-orange font-mono">{formatPrice(price)}</p>
                        <p className="text-sm text-bitcoin-orange">{percentageChange}</p>
                      </div>
                    </div>
                    {isReached && (
                      <p className="text-xs text-bitcoin-orange mt-1">✓ Level Reached</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Summary - Bitcoin Sovereign Style */}
      <div className="mt-6 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-bitcoin-white">Hidden Pivot Analysis</h4>
          <div className="text-xs text-bitcoin-black bg-bitcoin-orange px-2 py-1 rounded">
            {timeframe} Analysis
          </div>
        </div>
        <p className="text-sm text-bitcoin-white-80">
          Hidden pivots use Fibonacci relationships to identify potential reversal points that may not be 
          visible on standard charts. These levels often act as magnetic price zones where significant 
          market reactions occur. Analysis period: {timeframe === '4H' ? '4 Hours' : timeframe === '1D' ? '1 Day' : '1 Week'}.
        </p>
      </div>
    </div>
  );
}
