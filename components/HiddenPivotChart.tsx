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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Calculating Hidden Pivots...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Calculator className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {symbol} Hidden Pivot Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Fibonacci Extensions & Hidden Support/Resistance
            </p>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['4H', '1D', '1W'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveView('extensions')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
            activeView === 'extensions'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Fib Extensions
        </button>
        <button
          onClick={() => setActiveView('pivots')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
            activeView === 'pivots'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Hidden Pivots
        </button>
      </div>

      {/* Current Price Display */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current {symbol} Price</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(currentPrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Pivot Range ({timeframe})</p>
            <p className="text-lg font-semibold text-purple-600">
              {formatPrice(pivotData.pivotLow)} - {formatPrice(pivotData.pivotHigh)}
            </p>
          </div>
        </div>
      </div>

      {/* Fibonacci Extensions View */}
      {activeView === 'extensions' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Fibonacci Extension Levels</h4>
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
                      ? 'border-red-200 bg-red-50 hover:border-red-300'
                      : fib.strength === 'Moderate'
                      ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        fib.strength === 'Strong'
                          ? 'bg-red-500'
                          : fib.strength === 'Moderate'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {fib.level}x Extension
                        </p>
                        <p className="text-sm text-gray-600">
                          {fib.strength} Level
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(fib.price)}</p>
                      <p className={`text-sm font-medium ${
                        isAboveCurrent ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {percentageChange}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
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
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Bullish Hidden Pivots</h4>
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
                        ? 'border-green-300 bg-green-50'
                        : 'border-green-200 bg-green-25 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className={`h-4 w-4 ${isReached ? 'text-green-700' : 'text-green-600'}`} />
                        <span className="font-medium text-gray-900">
                          Hidden Pivot {index + 1}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatPrice(price)}</p>
                        <p className="text-sm text-green-600">{percentageChange}</p>
                      </div>
                    </div>
                    {isReached && (
                      <p className="text-xs text-green-700 mt-1">✓ Level Reached</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bearish Hidden Pivots */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
              <h4 className="font-semibold text-gray-900">Bearish Hidden Pivots</h4>
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
                        ? 'border-red-300 bg-red-50'
                        : 'border-red-200 bg-red-25 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className={`h-4 w-4 ${isReached ? 'text-red-700' : 'text-red-600'}`} />
                        <span className="font-medium text-gray-900">
                          Hidden Pivot {index + 1}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatPrice(price)}</p>
                        <p className="text-sm text-red-600">{percentageChange}</p>
                      </div>
                    </div>
                    {isReached && (
                      <p className="text-xs text-red-700 mt-1">✓ Level Reached</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-gray-900">Hidden Pivot Analysis</h4>
          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
            {timeframe} Analysis
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Hidden pivots use Fibonacci relationships to identify potential reversal points that may not be 
          visible on standard charts. These levels often act as magnetic price zones where significant 
          market reactions occur. Analysis period: {timeframe === '4H' ? '4 Hours' : timeframe === '1D' ? '1 Day' : '1 Week'}.
        </p>
      </div>
    </div>
  );
}
