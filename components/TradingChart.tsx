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
  timeframe?: '1H' | '4H' | '1D';
}

export default function TradingChart({ symbol, currentPrice, supportResistance, tradingZones, timeframe: propTimeframe }: ChartProps) {
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D'>(propTimeframe || '4H');
  const [hoveredZone, setHoveredZone] = useState<TradingZone | null>(null);
  
  // Update timeframe when prop changes
  useEffect(() => {
    if (propTimeframe) {
      setTimeframe(propTimeframe);
    }
  }, [propTimeframe]);

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
  
  // Responsive chart dimensions
  const [chartDimensions, setChartDimensions] = useState({
    height: 500,
    width: 1000,
    isMobile: false
  });

  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      setChartDimensions({
        height: isMobile ? 400 : isTablet ? 450 : 500,
        width: isMobile ? Math.min(window.innerWidth - 40, 700) : isTablet ? 900 : 1000,
        isMobile
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;

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
    <div className="bitcoin-block bg-bitcoin-black rounded-lg p-4 md:p-6">
      {/* Enhanced Header */}
      <div className={`${chartDimensions.isMobile ? 'space-y-4' : 'flex justify-between items-center'} mb-6`}>
        <div>
          <h3 className={`${chartDimensions.isMobile ? 'text-lg' : 'text-xl'} font-bold text-bitcoin-white flex items-center`}>
            <BarChart3 className={`${chartDimensions.isMobile ? 'h-5 w-5' : 'h-6 w-6'} mr-2 text-bitcoin-orange`} />
            {symbol} Trading Zones Chart
          </h3>
          <div className={`${chartDimensions.isMobile ? 'flex-col space-y-2' : 'flex items-center space-x-4'} text-sm mt-2`}>
            <div className="flex items-center">
              <span className="text-bitcoin-white" style={{ opacity: 0.6 }}>Current Price:</span>
              <span className={`font-bold text-bitcoin-orange ml-2 ${chartDimensions.isMobile ? 'text-base' : 'text-lg'}`}>
                ${chartDimensions.isMobile ? Math.round(currentPrice/1000) + 'k' : currentPrice.toLocaleString()}
              </span>
            </div>
            {!chartDimensions.isMobile && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-bitcoin-orange border-dashed"></div>
                <span className="text-xs text-bitcoin-white" style={{ opacity: 0.6 }}>(Orange Dotted Line)</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Timeframe Display */}
        <div className={`flex ${chartDimensions.isMobile ? 'justify-center' : 'flex-col items-end'} space-y-2`}>
          <div className="text-xs text-gray-500 font-medium">Selected Timeframe</div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{timeframe}</span>
              <span className="text-xs opacity-90">
                {timeframe === '1H' ? 'Scalping (60 data points)' : 
                 timeframe === '4H' ? 'Swing Trading (72 data points)' : 
                 'Position Trading (90 data points)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Guide with Prominent Timeframe Display */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-3 md:p-4 mb-4 md:mb-6" style={{ borderOpacity: 0.3 }}>
        <div className="flex items-start space-x-2">
          <Target className="h-5 w-5 text-bitcoin-orange flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-bitcoin-white text-base">
                📊 Chart Guide
              </div>
              <div className="bg-bitcoin-orange text-bitcoin-black px-3 py-1 rounded-full text-xs font-bold">
                {timeframe} TIMEFRAME
              </div>
            </div>
            <div className="text-bitcoin-white space-y-1" style={{ opacity: 0.8 }}>
              <div>• <span className="font-medium text-bitcoin-orange">Orange Dotted Line:</span> Current real-time price (${currentPrice.toLocaleString()})</div>
              <div>• <span className="font-medium text-green-500">Green Zones:</span> Buy/Support areas with real order book + volume data</div>
              <div>• <span className="font-medium text-red-500">Red Zones:</span> Sell/Resistance areas with real order book + volume data</div>
              <div>• <span className="font-medium">Zone Intensity:</span> Darker = Stronger, Lighter = Weaker</div>
              <div className="text-xs mt-2 italic text-bitcoin-orange font-medium">
                ✅ 100% Real Market Data: Live order book walls + Historical volume levels ({timeframe === '1H' ? '60' : timeframe === '4H' ? '72' : '90'} data points)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chart */}
      <div className="relative bg-bitcoin-black rounded-lg border-2 border-bitcoin-orange overflow-hidden" style={{ borderOpacity: 0.2 }}>
        {/* Mobile scroll container */}
        <div className={`${chartDimensions.isMobile ? 'overflow-x-auto' : ''}`}>
          <svg 
            width={chartWidth} 
            height={chartHeight} 
            className={`${chartDimensions.isMobile ? 'min-w-full' : 'w-full'}`}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 40" fill="none" stroke="rgba(247, 147, 26, 0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="#000000" />
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
                  stroke={isCurrentPrice ? "#F7931A" : "rgba(247, 147, 26, 0.2)"}
                  strokeWidth={isCurrentPrice ? 2 : 1}
                  strokeDasharray={isCurrentPrice ? "8,4" : "0"}
                />
                
                {/* Price label */}
                <text 
                  x={chartDimensions.isMobile ? 45 : 50} 
                  y={y + 5} 
                  textAnchor="end" 
                  fontSize={chartDimensions.isMobile ? "10" : "12"}
                  fontWeight={isCurrentPrice ? "700" : "500"}
                  fill={isCurrentPrice ? "#F7931A" : "rgba(255, 255, 255, 0.6)"}
                >
                  ${chartDimensions.isMobile ? Math.round(price/1000) + 'k' : Math.round(price).toLocaleString()}
                </text>
                
                {/* Current price indicator */}
                {isCurrentPrice && (
                  <g>
                    <rect
                      x={chartWidth - 150}
                      y={y - 12}
                      width={130}
                      height={24}
                      fill="#F7931A"
                      rx={4}
                    />
                    <text
                      x={chartWidth - (chartDimensions.isMobile ? 65 : 85)}
                      y={y + 5}
                      textAnchor="middle"
                      fontSize={chartDimensions.isMobile ? "10" : "12"}
                      fontWeight="700"
                      fill="#000000"
                    >
                      {chartDimensions.isMobile ? `$${Math.round(currentPrice/1000)}k` : `CURRENT $${Math.round(currentPrice).toLocaleString()}`}
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
                const zoneHeight = zone.strength === 'Strong' ? 30 : zone.strength === 'Moderate' ? 24 : 18;
                const opacity = zone.strength === 'Strong' ? 0.6 : zone.strength === 'Moderate' ? 0.45 : 0.3;
                
                return (
                  <g key={`buy-${index}`}>
                    {/* Zone rectangle */}
                    <rect
                      x={70}
                      y={y - zoneHeight / 2}
                      width={chartWidth - 280}
                      height={zoneHeight}
                      fill="#10B981"
                      fillOpacity={opacity}
                      stroke="#059669"
                      strokeWidth={zone.strength === 'Strong' ? 2.5 : 1.5}
                      onMouseEnter={() => setHoveredZone(zone)}
                      onMouseLeave={() => setHoveredZone(null)}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                    />
                    
                    {/* Zone label - positioned to the right */}
                    <rect
                      x={chartWidth - 200}
                      y={y - 14}
                      width={180}
                      height={28}
                      fill="#059669"
                      stroke="#047857"
                      strokeWidth={1.5}
                      rx={4}
                    />
                    <text
                      x={chartWidth - 110}
                      y={y + 1}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="white"
                    >
                      🟢 BUY ${Math.round(zone.level).toLocaleString()}
                    </text>
                    <text
                      x={chartWidth - 110}
                      y={y + 11}
                      textAnchor="middle"
                      fontSize="9"
                      fill="white"
                      opacity={0.9}
                    >
                      {zone.strength} • {zone.volume.toFixed(1)} BTC
                    </text>
                  </g>
                );
              })}

              {/* Sell Zones (Resistance) */}
              {tradingZones.sellZones.map((zone, index) => {
                const y = priceToY(zone.level);
                const zoneHeight = zone.strength === 'Strong' ? 30 : zone.strength === 'Moderate' ? 24 : 18;
                const opacity = zone.strength === 'Strong' ? 0.6 : zone.strength === 'Moderate' ? 0.45 : 0.3;
                
                return (
                  <g key={`sell-${index}`}>
                    {/* Zone rectangle */}
                    <rect
                      x={70}
                      y={y - zoneHeight / 2}
                      width={chartWidth - 280}
                      height={zoneHeight}
                      fill="#EF4444"
                      fillOpacity={opacity}
                      stroke="#DC2626"
                      strokeWidth={zone.strength === 'Strong' ? 2.5 : 1.5}
                      onMouseEnter={() => setHoveredZone(zone)}
                      onMouseLeave={() => setHoveredZone(null)}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                    />
                    
                    {/* Zone label - positioned to the right */}
                    <rect
                      x={chartWidth - 200}
                      y={y - 14}
                      width={180}
                      height={28}
                      fill="#DC2626"
                      stroke="#B91C1C"
                      strokeWidth={1.5}
                      rx={4}
                    />
                    <text
                      x={chartWidth - 110}
                      y={y + 1}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="white"
                    >
                      🔴 SELL ${Math.round(zone.level).toLocaleString()}
                    </text>
                    <text
                      x={chartWidth - 110}
                      y={y + 11}
                      textAnchor="middle"
                      fontSize="9"
                      fill="white"
                      opacity={0.9}
                    >
                      {zone.strength} • {zone.volume.toFixed(1)} BTC
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
                  stroke="rgba(247, 147, 26, 0.2)"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                />
                <text 
                  x={x} 
                  y={chartHeight - 10} 
                  textAnchor="middle" 
                  fontSize={chartDimensions.isMobile ? "9" : "11"}
                  fill="rgba(255, 255, 255, 0.6)"
                  fontWeight="500"
                >
                  {chartDimensions.isMobile ? 
                    (timeframe === '1H' ? date.toLocaleTimeString('en-US', { hour: '2-digit' }) :
                     timeframe === '4H' ? date.toLocaleDateString('en-US', { day: 'numeric' }) :
                     date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) :
                    getTimeLabel()
                  }
                </text>
              </g>
            );
          })}
          </svg>
        </div>

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
        <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-bitcoin-black p-3 md:p-4 rounded-lg border-2 border-green-500" style={{ borderOpacity: 0.5 }}>
            <h4 className={`font-semibold text-green-500 mb-2 ${chartDimensions.isMobile ? 'text-sm' : ''}`}>
              🟢 Buy Zones (Support)
            </h4>
            <div className="space-y-2">
              {tradingZones.buyZones.slice(0, chartDimensions.isMobile ? 2 : 3).map((zone, index) => (
                <div key={index} className={`${chartDimensions.isMobile ? 'text-xs' : 'text-sm'}`}>
                  <span className="font-medium text-bitcoin-white">
                    ${chartDimensions.isMobile ? Math.round(zone.level/1000) + 'k' : Math.round(zone.level).toLocaleString()}
                  </span>
                  <span className="text-green-500 ml-2">({zone.strength})</span>
                  {!chartDimensions.isMobile && (
                    <span className="text-bitcoin-white ml-2" style={{ opacity: 0.6 }}>{zone.volume.toFixed(1)} BTC</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-bitcoin-black p-3 md:p-4 rounded-lg border-2 border-red-500" style={{ borderOpacity: 0.5 }}>
            <h4 className={`font-semibold text-red-500 mb-2 ${chartDimensions.isMobile ? 'text-sm' : ''}`}>
              🔴 Sell Zones (Resistance)
            </h4>
            <div className="space-y-2">
              {tradingZones.sellZones.slice(0, chartDimensions.isMobile ? 2 : 3).map((zone, index) => (
                <div key={index} className={`${chartDimensions.isMobile ? 'text-xs' : 'text-sm'}`}>
                  <span className="font-medium text-bitcoin-white">
                    ${chartDimensions.isMobile ? Math.round(zone.level/1000) + 'k' : Math.round(zone.level).toLocaleString()}
                  </span>
                  <span className="text-red-500 ml-2">({zone.strength})</span>
                  {!chartDimensions.isMobile && (
                    <span className="text-bitcoin-white ml-2" style={{ opacity: 0.6 }}>{zone.volume.toFixed(1)} BTC</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}