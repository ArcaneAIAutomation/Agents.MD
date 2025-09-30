import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, BarChart3, Zap } from 'lucide-react';

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
  supportResistance?: {
    strongSupport: number;
    support: number;
    resistance: number;
    strongResistance: number;
  };
  tradingZones?: {
    buyZones: TradingZone[];
    sellZones: TradingZone[];
  };
}

export default function TradingChart({ symbol, currentPrice, supportResistance, tradingZones }: ChartProps) {
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D'>('4H');
  const [hoveredZone, setHoveredZone] = useState<TradingZone | null>(null);

  // Calculate optimal price range for better visual distribution
  const calculateOptimalRange = () => {
    // Collect all zone levels
    const allLevels = [
      currentPrice,
      ...(tradingZones?.buyZones.map(z => z.level) || []),
      ...(tradingZones?.sellZones.map(z => z.level) || []),
      ...(supportResistance ? [
        supportResistance.strongSupport,
        supportResistance.support,
        supportResistance.resistance,
        supportResistance.strongResistance
      ] : [])
    ].filter(level => level > 0);

    if (allLevels.length === 0) {
      return {
        min: currentPrice * 0.85,
        max: currentPrice * 1.15
      };
    }

    const minLevel = Math.min(...allLevels);
    const maxLevel = Math.max(...allLevels);
    const range = maxLevel - minLevel;
    
    // Ensure minimum 10% range for visibility
    const minRange = currentPrice * 0.1;
    const actualRange = Math.max(range, minRange);
    
    // Add 15% padding on each side
    const padding = actualRange * 0.15;
    
    return {
      min: Math.max(0, minLevel - padding),
      max: maxLevel + padding
    };
  };

  const priceRange = calculateOptimalRange();
  const chartHeight = 400;
  const chartWidth = 800;

  // Scale function for price to Y coordinate
  const priceToY = (price: number) => {
    const ratio = (price - priceRange.min) / (priceRange.max - priceRange.min);
    return chartHeight - (ratio * (chartHeight - 60)) - 30; // 30px padding top/bottom
  };

  // Generate price levels for Y-axis
  const generatePriceLevels = () => {
    const levels = [];
    const step = (priceRange.max - priceRange.min) / 8;
    for (let i = 0; i <= 8; i++) {
      levels.push(priceRange.min + (step * i));
    }
    return levels;
  };

  const priceLevels = generatePriceLevels();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
            {symbol} Trading Zones Chart
          </h3>
          <div className="flex items-center space-x-4 text-sm mt-2">
            <div className="flex items-center">
              <span className="text-gray-600">Current Price:</span>
              <span className="font-bold text-black ml-2 text-lg">${currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-black border-dashed"></div>
              <span className="text-xs text-gray-500">(Black Dotted Line)</span>
            </div>
          </div>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex flex-col items-end space-y-2">
          <div className="text-xs text-gray-500 font-medium">Time Range</div>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {['1H', '4H', '1D'].map((tf) => {
              const isActive = timeframe === tf;
              const dataPoints = tf === '1H' ? '60pts' : tf === '4H' ? '72pts' : '90pts';
              return (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as any)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{tf}</span>
                    {isActive && <span className="text-xs opacity-80">{dataPoints}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-2">
          <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-blue-900 mb-2">Chart Guide ({timeframe} Timeframe):</div>
            <div className="text-blue-800 space-y-1">
              <div>• <span className="font-medium text-black">Black Dotted Line:</span> Current real-time price (${currentPrice.toLocaleString()})</div>
              <div>• <span className="font-medium text-green-600">Green Zones:</span> Buy/Support areas with real order book + volume data</div>
              <div>• <span className="font-medium text-red-600">Red Zones:</span> Sell/Resistance areas with real order book + volume data</div>
              <div>• <span className="font-medium">Zone Intensity:</span> Darker = Stronger, Lighter = Weaker</div>
              <div className="text-xs mt-2 italic text-green-700 font-medium">
                ✅ 100% Real Market Data: Live order book walls + Historical volume levels
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chart */}
      <div className="relative bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />
          
          {/* Y-axis price levels */}
          {priceLevels.map((price, index) => {
            const y = priceToY(price);
            const isCurrentPrice = Math.abs(price - currentPrice) < (priceRange.max - priceRange.min) * 0.02;
            
            return (
              <g key={index}>
                {/* Grid line */}
                <line 
                  x1={60} 
                  y1={y} 
                  x2={chartWidth - 20} 
                  y2={y} 
                  stroke={isCurrentPrice ? "#EF4444" : "#D1D5DB"}
                  strokeWidth={isCurrentPrice ? 2 : 1}
                  strokeDasharray={isCurrentPrice ? "8,4" : "0"}
                />
                
                {/* Price label */}
                <text 
                  x={50} 
                  y={y + 5} 
                  textAnchor="end" 
                  fontSize="12"
                  fontWeight={isCurrentPrice ? "700" : "500"}
                  fill={isCurrentPrice ? "#EF4444" : "#6B7280"}
                >
                  ${Math.round(price).toLocaleString()}
                </text>
                
                {/* Current price indicator */}
                {isCurrentPrice && (
                  <g>
                    <rect
                      x={chartWidth - 150}
                      y={y - 12}
                      width={130}
                      height={24}
                      fill="#EF4444"
                      rx={4}
                    />
                    <text
                      x={chartWidth - 85}
                      y={y + 5}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="white"
                    >
                      CURRENT ${Math.round(currentPrice).toLocaleString()}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Trading Zones */}
          {tradingZones && (
            <>
              {/* Buy Zones (Support) */}
              {tradingZones.buyZones.map((zone, index) => {
                const y = priceToY(zone.level);
                const zoneHeight = zone.strength === 'Strong' ? 25 : zone.strength === 'Moderate' ? 20 : 15;
                const opacity = zone.strength === 'Strong' ? 0.7 : zone.strength === 'Moderate' ? 0.5 : 0.3;
                
                return (
                  <g key={`buy-${index}`}>
                    {/* Zone rectangle */}
                    <rect
                      x={60}
                      y={y - zoneHeight / 2}
                      width={chartWidth - 200}
                      height={zoneHeight}
                      fill="#10B981"
                      fillOpacity={opacity}
                      stroke="#059669"
                      strokeWidth={zone.strength === 'Strong' ? 3 : 2}
                      onMouseEnter={() => setHoveredZone(zone)}
                      onMouseLeave={() => setHoveredZone(null)}
                      className="cursor-pointer"
                    />
                    
                    {/* Zone label */}
                    <rect
                      x={chartWidth - 190}
                      y={y - 10}
                      width={170}
                      height={20}
                      fill="white"
                      stroke="#059669"
                      strokeWidth={1}
                      rx={3}
                    />
                    <text
                      x={chartWidth - 105}
                      y={y + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#059669"
                    >
                      🟢 BUY ${Math.round(zone.level).toLocaleString()}
                    </text>
                    <text
                      x={chartWidth - 105}
                      y={y - 2}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#059669"
                      opacity={0.8}
                    >
                      {zone.strength} • {zone.volume.toFixed(1)} BTC
                      {zone.source && ` • ${zone.source === 'orderbook' ? 'OrderBook' : 'Historical'}`}
                    </text>
                  </g>
                );
              })}

              {/* Sell Zones (Resistance) */}
              {tradingZones.sellZones.map((zone, index) => {
                const y = priceToY(zone.level);
                const zoneHeight = zone.strength === 'Strong' ? 25 : zone.strength === 'Moderate' ? 20 : 15;
                const opacity = zone.strength === 'Strong' ? 0.7 : zone.strength === 'Moderate' ? 0.5 : 0.3;
                
                return (
                  <g key={`sell-${index}`}>
                    {/* Zone rectangle */}
                    <rect
                      x={60}
                      y={y - zoneHeight / 2}
                      width={chartWidth - 200}
                      height={zoneHeight}
                      fill="#EF4444"
                      fillOpacity={opacity}
                      stroke="#DC2626"
                      strokeWidth={zone.strength === 'Strong' ? 3 : 2}
                      onMouseEnter={() => setHoveredZone(zone)}
                      onMouseLeave={() => setHoveredZone(null)}
                      className="cursor-pointer"
                    />
                    
                    {/* Zone label */}
                    <rect
                      x={chartWidth - 190}
                      y={y - 10}
                      width={170}
                      height={20}
                      fill="white"
                      stroke="#DC2626"
                      strokeWidth={1}
                      rx={3}
                    />
                    <text
                      x={chartWidth - 105}
                      y={y + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#DC2626"
                    >
                      🔴 SELL ${Math.round(zone.level).toLocaleString()}
                    </text>
                    <text
                      x={chartWidth - 105}
                      y={y - 2}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#DC2626"
                      opacity={0.8}
                    >
                      {zone.strength} • {zone.volume.toFixed(1)} BTC
                      {zone.source && ` • ${zone.source === 'orderbook' ? 'OrderBook' : 'Historical'}`}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Time axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const x = 60 + (chartWidth - 220) * ratio;
            const now = new Date();
            const timeOffset = timeframe === '1H' ? 60 * 60 * 1000 : 
                              timeframe === '4H' ? 4 * 60 * 60 * 1000 : 
                              24 * 60 * 60 * 1000;
            const timestamp = now.getTime() - (timeOffset * (1 - ratio));
            const date = new Date(timestamp);
            
            const getTimeLabel = () => {
              if (timeframe === '1H') {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              } else if (timeframe === '4H') {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
                       ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit' });
              } else {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
            };

            return (
              <g key={index}>
                <line 
                  x1={x} 
                  y1={30} 
                  x2={x} 
                  y2={chartHeight - 30}
                  stroke="#E5E7EB"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                />
                <text 
                  x={x} 
                  y={chartHeight - 10} 
                  textAnchor="middle" 
                  fontSize="11"
                  fill="#6B7280"
                  fontWeight="500"
                >
                  {getTimeLabel()}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredZone && (
          <div className="absolute top-4 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg z-10">
            <div className="text-sm font-semibold text-gray-900">
              {hoveredZone.type === 'buy' ? '🟢 Buy Zone' : '🔴 Sell Zone'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              <div>Price: ${hoveredZone.level.toLocaleString()}</div>
              <div>Strength: {hoveredZone.strength}</div>
              <div>Volume: {hoveredZone.volume.toFixed(2)} BTC</div>
              {hoveredZone.source && <div>Source: {hoveredZone.source}</div>}
              {hoveredZone.confidence && <div>Confidence: {hoveredZone.confidence.toFixed(0)}%</div>}
            </div>
          </div>
        )}
      </div>

      {/* Zone Summary */}
      {tradingZones && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">🟢 Buy Zones (Support)</h4>
            <div className="space-y-2">
              {tradingZones.buyZones.slice(0, 3).map((zone, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">${Math.round(zone.level).toLocaleString()}</span>
                  <span className="text-green-600 ml-2">({zone.strength})</span>
                  <span className="text-gray-600 ml-2">{zone.volume.toFixed(1)} BTC</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-800 mb-2">🔴 Sell Zones (Resistance)</h4>
            <div className="space-y-2">
              {tradingZones.sellZones.slice(0, 3).map((zone, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">${Math.round(zone.level).toLocaleString()}</span>
                  <span className="text-red-600 ml-2">({zone.strength})</span>
                  <span className="text-gray-600 ml-2">{zone.volume.toFixed(1)} BTC</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}