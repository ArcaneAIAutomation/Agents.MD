import React, { useState } from 'react';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';

interface TradingZone {
  level: number;
  strength: 'Strong' | 'Moderate' | 'Weak';
  type: 'buy' | 'sell';
  volume: number;
  source?: string;
  confidence?: number;
}

interface ChartProps {
  symbol: 'BTC' | 'ETH';
  currentPrice: number;
  tradingZones?: {
    buyZones: TradingZone[];
    sellZones: TradingZone[];
  };
  timeframe?: '1H' | '4H' | '1D';
}

export default function ModernTradingChart({ symbol, currentPrice, tradingZones, timeframe = '4H' }: ChartProps) {
  const [hoveredZone, setHoveredZone] = useState<TradingZone | null>(null);

  // Calculate price range
  const allZones = [
    ...(tradingZones?.buyZones || []),
    ...(tradingZones?.sellZones || [])
  ];
  
  const prices = allZones.map(z => z.level);
  const minPrice = Math.min(...prices, currentPrice * 0.95);
  const maxPrice = Math.max(...prices, currentPrice * 1.05);
  const priceRange = maxPrice - minPrice;

  // Sort zones by price (high to low)
  const sortedZones = [...allZones].sort((a, b) => b.level - a.level);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
            {symbol} Trading Zones
          </h3>
          <div className="flex items-center space-x-4 text-sm mt-2">
            <div className="flex items-center">
              <span className="text-gray-600">Current Price:</span>
              <span className="font-bold text-black ml-2 text-lg">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Timeframe Display */}
        <div className="flex flex-col items-end space-y-2">
          <div className="text-xs text-gray-500 font-medium">Selected Timeframe</div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{timeframe}</span>
              <span className="text-xs opacity-90">
                {timeframe === '1H' ? 'Scalping' : timeframe === '4H' ? 'Swing Trading' : 'Position Trading'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-2">
          <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-blue-900 text-base">📊 Chart Guide</div>
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                {timeframe} TIMEFRAME
              </div>
            </div>
            <div className="text-blue-800 space-y-1">
              <div>• <span className="font-medium text-green-600">Green Zones:</span> Buy/Support levels - Consider long positions</div>
              <div>• <span className="font-medium text-red-600">Red Zones:</span> Sell/Resistance levels - Consider taking profits</div>
              <div>• <span className="font-medium">Strength:</span> Strong zones have higher volume and confidence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Zone List */}
      <div className="space-y-3">
        {sortedZones.map((zone, index) => {
          const isBuy = zone.type === 'buy';
          const distanceFromPrice = ((zone.level - currentPrice) / currentPrice) * 100;
          const isNearPrice = Math.abs(distanceFromPrice) < 2;
          
          return (
            <div
              key={`${zone.type}-${index}`}
              className={`relative rounded-lg border-2 transition-all duration-200 ${
                isBuy 
                  ? 'bg-green-50 border-green-300 hover:border-green-500 hover:shadow-lg' 
                  : 'bg-red-50 border-red-300 hover:border-red-500 hover:shadow-lg'
              } ${isNearPrice ? 'ring-2 ring-yellow-400' : ''}`}
              onMouseEnter={() => setHoveredZone(zone)}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {/* Left: Zone Info */}
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-16 h-16 rounded-lg ${
                      isBuy ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      <span className="text-3xl">{isBuy ? '🟢' : '🔴'}</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xl font-bold ${isBuy ? 'text-green-700' : 'text-red-700'}`}>
                          {isBuy ? 'BUY' : 'SELL'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          zone.strength === 'Strong' ? 'bg-yellow-400 text-yellow-900' :
                          zone.strength === 'Moderate' ? 'bg-blue-400 text-blue-900' :
                          'bg-gray-400 text-gray-900'
                        }`}>
                          {zone.strength}
                        </span>
                        {isNearPrice && (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-400 text-yellow-900 animate-pulse">
                            NEAR PRICE
                          </span>
                        )}
                      </div>
                      
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        ${zone.level.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="font-medium">Volume:</span>
                          <span className="ml-1 font-bold text-gray-900">
                            {zone.volume > 0 ? `${zone.volume.toFixed(2)} ${symbol}` : 'N/A'}
                          </span>
                        </div>
                        {zone.confidence && (
                          <div className="flex items-center">
                            <span className="font-medium">Confidence:</span>
                            <span className="ml-1 font-bold text-gray-900">{zone.confidence.toFixed(0)}%</span>
                          </div>
                        )}
                        {zone.source && (
                          <div className="flex items-center">
                            <span className="font-medium">Source:</span>
                            <span className="ml-1 font-bold text-gray-900 capitalize">{zone.source}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Distance from Current Price */}
                  <div className="text-right">
                    <div className="text-xs text-gray-500 font-medium">Distance</div>
                    <div className={`text-lg font-bold ${
                      distanceFromPrice > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {distanceFromPrice > 0 ? '+' : ''}{distanceFromPrice.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${Math.abs(zone.level - currentPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* Progress bar showing strength */}
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isBuy ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ 
                        width: `${zone.confidence || (zone.strength === 'Strong' ? 85 : zone.strength === 'Moderate' ? 65 : 45)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {tradingZones?.buyZones.length || 0}
          </div>
          <div className="text-sm text-gray-600 mt-1">Buy Zones</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {tradingZones?.sellZones.length || 0}
          </div>
          <div className="text-sm text-gray-600 mt-1">Sell Zones</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {sortedZones.filter(z => Math.abs(((z.level - currentPrice) / currentPrice) * 100) < 2).length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Near Price</div>
        </div>
      </div>
    </div>
  );
}
