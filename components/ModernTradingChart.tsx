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
    <div className="bitcoin-block bg-bitcoin-black rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-bitcoin-white flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-bitcoin-orange" />
            {symbol} Trading Zones
          </h3>
          <div className="flex items-center space-x-4 text-sm mt-2">
            <div className="flex items-center">
              <span className="text-bitcoin-white" style={{ opacity: 0.6 }}>Current Price:</span>
              <span className="font-bold text-bitcoin-orange ml-2 text-lg">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Timeframe Display */}
        <div className="flex flex-col items-end space-y-2">
          <div className="text-xs text-bitcoin-white font-medium" style={{ opacity: 0.6 }}>Selected Timeframe</div>
          <div className="bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded-lg shadow-md">
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
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 mb-6" style={{ borderOpacity: 0.3 }}>
        <div className="flex items-start space-x-2">
          <Target className="h-5 w-5 text-bitcoin-orange flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-bitcoin-white text-base">📊 Chart Guide</div>
              <div className="bg-bitcoin-orange text-bitcoin-black px-3 py-1 rounded-full text-xs font-bold">
                {timeframe} TIMEFRAME
              </div>
            </div>
            <div className="text-bitcoin-white space-y-1" style={{ opacity: 0.8 }}>
              <div>• <span className="font-medium text-bitcoin-orange">Green Zones:</span> Buy/Support levels - Consider long positions</div>
              <div>• <span className="font-medium text-bitcoin-orange">Red Zones:</span> Sell/Resistance levels - Consider taking profits</div>
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
                  ? 'bg-bitcoin-black border-green-500 hover:border-green-400 hover:shadow-lg' 
                  : 'bg-bitcoin-black border-red-500 hover:border-red-400 hover:shadow-lg'
              } ${isNearPrice ? 'ring-2 ring-bitcoin-orange' : ''}`}
              onMouseEnter={() => setHoveredZone(zone)}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Zone Info */}
                  <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                    <div className={`flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-lg flex-shrink-0 ${
                      isBuy ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      <span className="text-2xl md:text-3xl">{isBuy ? '🟢' : '🔴'}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`text-lg md:text-xl font-bold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                          {isBuy ? 'BUY' : 'SELL'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                          zone.strength === 'Strong' ? 'bg-bitcoin-orange text-bitcoin-black' :
                          zone.strength === 'Moderate' ? 'bg-bitcoin-orange text-bitcoin-black' :
                          'bg-bitcoin-black border border-bitcoin-orange text-bitcoin-orange'
                        }`} style={{ opacity: zone.strength === 'Strong' ? 1 : zone.strength === 'Moderate' ? 0.8 : 0.6 }}>
                          {zone.strength === 'Strong' ? 'Very Strong' : zone.strength}
                        </span>
                        {isNearPrice && (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-bitcoin-orange text-bitcoin-black animate-pulse whitespace-nowrap">
                            NEAR PRICE
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xl md:text-2xl font-bold text-bitcoin-orange mt-1">
                        ${zone.level.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs md:text-sm text-bitcoin-white" style={{ opacity: 0.6 }}>
                        <div className="flex items-center whitespace-nowrap">
                          <span className="font-medium">Volume:</span>
                          <span className="ml-1 font-bold text-bitcoin-white">
                            {zone.volume > 0 ? `${zone.volume.toFixed(2)} ${symbol}` : 'N/A'}
                          </span>
                        </div>
                        {zone.confidence && (
                          <div className="flex items-center whitespace-nowrap">
                            <span className="font-medium">Confidence:</span>
                            <span className="ml-1 font-bold text-bitcoin-white">{zone.confidence.toFixed(0)}%</span>
                          </div>
                        )}
                        {zone.source && (
                          <div className="flex items-center whitespace-nowrap">
                            <span className="font-medium">Source:</span>
                            <span className="ml-1 font-bold text-bitcoin-white capitalize">{zone.source}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Distance from Current Price */}
                  <div className="text-right flex-shrink-0 min-w-[80px]">
                    <div className="text-xs text-bitcoin-white font-medium" style={{ opacity: 0.6 }}>Distance</div>
                    <div className={`text-base md:text-lg font-bold ${
                      distanceFromPrice > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white'
                    }`}>
                      {distanceFromPrice > 0 ? '+' : ''}{distanceFromPrice.toFixed(2)}%
                    </div>
                    <div className="text-xs text-bitcoin-white mt-1" style={{ opacity: 0.6 }}>
                      ${Math.abs(zone.level - currentPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* Progress bar showing strength */}
                <div className="mt-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isBuy ? 'bg-green-500' : 'bg-red-500'
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
        <div className="bg-bitcoin-black border-2 border-green-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">
            {tradingZones?.buyZones.length || 0}
          </div>
          <div className="text-sm text-bitcoin-white mt-1" style={{ opacity: 0.6 }}>Buy Zones</div>
        </div>
        <div className="bg-bitcoin-black border-2 border-red-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-500">
            {tradingZones?.sellZones.length || 0}
          </div>
          <div className="text-sm text-bitcoin-white mt-1" style={{ opacity: 0.6 }}>Sell Zones</div>
        </div>
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-bitcoin-orange">
            {sortedZones.filter(z => Math.abs(((z.level - currentPrice) / currentPrice) * 100) < 2).length}
          </div>
          <div className="text-sm text-bitcoin-white mt-1" style={{ opacity: 0.6 }}>Near Price</div>
        </div>
      </div>
    </div>
  );
}
