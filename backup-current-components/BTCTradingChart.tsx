import React, { useState, useEffect } from 'react';
import TradingChart from './TradingChart';

interface TradingAnalysisData {
  success: boolean;
  data: Array<{
    timestamp: number;
    price: number;
    volume: number;
    high: number;
    low: number;
    open: number;
    close: number;
  }>;
  symbol: string;
  timeframe: string;
  source: string;
  cached?: boolean;
  analysis: {
    supportLevels: number[];
    resistanceLevels: number[];
    fibonacciLevels: {
      retracement: number[];
      extension: number[];
    };
    hiddenPivots: {
      highs: Array<{ price: number; timestamp: number }>;
      lows: Array<{ price: number; timestamp: number }>;
    };
    tradingZones: Array<{
      type: 'support' | 'resistance';
      price: number;
      strength: number;
      touches: number;
    }>;
  };
}

export default function BTCTradingChart() {
  const [tradingData, setTradingData] = useState<TradingAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('1D');

  // Fetch CoinMarketCap trading analysis data
  const fetchTradingData = async (tf: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🎯 Fetching BTC trading analysis from CoinMarketCap (${tf})`);
      
      const response = await fetch(`/api/cmc-trading-analysis?symbol=BTC&timeframe=${tf}`);
      const result = await response.json();

      if (result.success || result.data.length > 0) {
        console.log(`✅ BTC trading analysis received:`, {
          dataPoints: result.data.length,
          source: result.source,
          supportLevels: result.analysis.supportLevels.length,
          resistanceLevels: result.analysis.resistanceLevels.length,
          tradingZones: result.analysis.tradingZones.length,
          hiddenPivots: result.analysis.hiddenPivots.highs.length + result.analysis.hiddenPivots.lows.length
        });
        
        setTradingData(result);
      } else {
        throw new Error(result.error || 'Failed to fetch trading data');
      }
    } catch (err) {
      console.error('❌ BTC trading analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradingData(timeframe);
  }, [timeframe]);

  if (loading || !tradingData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Loading BTC trading analysis from CoinMarketCap...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64 text-red-600">
          <span>Error loading BTC trading data: {error}</span>
          <button 
            onClick={() => fetchTradingData(timeframe)}
            className="ml-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = tradingData.data.length > 0 ? 
    tradingData.data[tradingData.data.length - 1].close : 110000;
  
  // Transform CoinMarketCap trading zones to our format
  const tradingZones = {
    buyZones: tradingData.analysis.tradingZones
      .filter(zone => zone.type === 'support')
      .map(zone => ({
        level: zone.price,
        strength: zone.strength > 60 ? 'Strong' as const : 'Moderate' as const,
        type: 'buy' as const,
        volume: zone.touches * 5000000,
        touches: zone.touches
      })),
    sellZones: tradingData.analysis.tradingZones
      .filter(zone => zone.type === 'resistance')
      .map(zone => ({
        level: zone.price,
        strength: zone.strength > 60 ? 'Strong' as const : 'Moderate' as const,
        type: 'sell' as const,
        volume: zone.touches * 5000000,
        touches: zone.touches
      }))
  };

  // Enhanced support/resistance from CoinMarketCap analysis
  const supportResistance = {
    strongSupport: tradingData.analysis.supportLevels[0] || currentPrice * 0.95,
    support: tradingData.analysis.supportLevels[1] || currentPrice * 0.97,
    resistance: tradingData.analysis.resistanceLevels[1] || currentPrice * 1.03,
    strongResistance: tradingData.analysis.resistanceLevels[0] || currentPrice * 1.05
  };

  return (
    <div className="space-y-4">
      {/* Header with data source indicator */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">BTC Trading Zones Analysis</h3>
            <p className="text-sm text-gray-600">
              📊 Data Source: <span className="font-semibold text-blue-600">{tradingData.source}</span>
              {tradingData.cached && <span className="ml-2 text-green-600">📦 Cached</span>}
            </p>
          </div>
          
          {/* Timeframe selector */}
          <div className="flex space-x-2">
            {['1H', '4H', '1D'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* Trading zones summary */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{tradingZones.buyZones.length}</div>
            <div className="text-gray-600">Buy Zones</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600">{tradingZones.sellZones.length}</div>
            <div className="text-gray-600">Sell Zones</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{tradingData.analysis.fibonacciLevels.retracement.length}</div>
            <div className="text-gray-600">Fib Levels</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">
              {tradingData.analysis.hiddenPivots.highs.length + tradingData.analysis.hiddenPivots.lows.length}
            </div>
            <div className="text-gray-600">Hidden Pivots</div>
          </div>
        </div>
      </div>

      {/* Trading chart */}
      <TradingChart
        symbol="BTC"
        currentPrice={currentPrice}
        supportResistance={supportResistance}
        tradingZones={tradingZones}
      />
    </div>
  );
}
