import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Target, BarChart3, Zap } from 'lucide-react';

interface PriceData {
  timestamp: number;
  price: number;
  volume?: number;
}

interface TradingZone {
  level: number;
  strength: 'Strong' | 'Moderate' | 'Weak';
  type: 'buy' | 'sell';
  volume: number;
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
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D'>('4H');
  const [hoveredZone, setHoveredZone] = useState<TradingZone | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'api' | 'fallback' | 'cached'>('api');
  const chartRef = useRef<SVGSVGElement>(null);

  // Fetch real historical data from our optimized API
  const fetchHistoricalData = async (symbolStr: string, timeframeStr: string) => {
    setLoading(true);
    try {
      console.log(`📡 Requesting ${timeframeStr} data for ${symbolStr} (optimized API)`);
      
      const response = await fetch(`/api/historical-prices?symbol=${symbolStr}&timeframe=${timeframeStr}`);
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        const dataSource = result.cached ? 'cached' : 'api';
        console.log(`✅ Received ${result.data.length} real ${timeframeStr} data points for ${symbolStr} (${dataSource})`);
        
        // Transform API data to our format
        const transformedData: PriceData[] = result.data.map((point: any) => ({
          timestamp: point.timestamp,
          price: point.price,
          volume: point.volume
        }));

        // Ensure the last price matches current price for consistency
        if (transformedData.length > 0) {
          transformedData[transformedData.length - 1].price = currentPrice;
        }

        setPriceData(transformedData);
        setDataSource(dataSource);
        
        // Enhanced logging for real data
        const priceRange = {
          min: Math.min(...transformedData.map(d => d.price)),
          max: Math.max(...transformedData.map(d => d.price)),
          spread: Math.max(...transformedData.map(d => d.price)) - Math.min(...transformedData.map(d => d.price))
        };
        
        console.log(`📊 Real ${symbolStr} ${timeframeStr} Data Analysis:`, {
          dataPoints: transformedData.length,
          priceRange: {
            min: `$${priceRange.min.toLocaleString()}`,
            max: `$${priceRange.max.toLocaleString()}`,
            spread: `$${priceRange.spread.toFixed(2)}`
          },
          timeSpan: {
            from: new Date(transformedData[0].timestamp).toLocaleString(),
            to: new Date(transformedData[transformedData.length - 1].timestamp).toLocaleString()
          },
          dataSource: result.cached ? '📦 Cached from CoinGecko' : '🌐 Fresh from CoinGecko API'
        });
        
        return transformedData;
      } else {
        throw new Error(result.error || 'Failed to fetch historical data');
      }
    } catch (error) {
      console.warn(`⚠️ Real data fetch failed for ${symbolStr} ${timeframeStr}:`, error);
      
      // No fallback data - only real API data allowed
      setPriceData([]);
      setDataSource('api');
      
      console.log(`❌ No data available for ${symbolStr} ${timeframeStr} - APIs failed`);
      
      return [];
    } finally {
      setLoading(false);
    }
  };

  // New useEffect that fetches real historical data
  useEffect(() => {
    fetchHistoricalData(symbol, timeframe);
  }, [currentPrice, timeframe, symbol]);

  // Calculate chart dimensions and scales - responsive sizing
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const chartWidth = isMobile ? 350 : 700;
  const chartHeight = isMobile ? 250 : 350;
  const padding = { 
    top: 20, 
    right: isMobile ? 80 : 100, 
    bottom: 40, 
    left: isMobile ? 60 : 80 
  };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate optimal zoom level based on timeframe and actual data spread
  const getOptimalPriceRange = () => {
    if (priceData.length === 0) {
      // Fallback range based on timeframe
      const fallbackRange = timeframe === '1H' ? 0.03 : timeframe === '4H' ? 0.06 : 0.1;
      return currentPrice * fallbackRange;
    }
    
    const dataMin = Math.min(...priceData.map(d => d.price));
    const dataMax = Math.max(...priceData.map(d => d.price));
    const dataRange = dataMax - dataMin;
    
    // Add 20% padding to data range for better visual spacing
    const paddedRange = dataRange * 1.2;
    
    // Ensure minimum range for readability
    const minRange = currentPrice * (timeframe === '1H' ? 0.02 : timeframe === '4H' ? 0.04 : 0.06);
    
    return Math.max(paddedRange, minRange);
  };

  const priceRange = getOptimalPriceRange();
  const priceExtent = priceData.length > 0 ? {
    min: Math.min(Math.min(...priceData.map(d => d.price)), currentPrice - priceRange / 2),
    max: Math.max(Math.max(...priceData.map(d => d.price)), currentPrice + priceRange / 2)
  } : { 
    min: currentPrice - priceRange / 2, 
    max: currentPrice + priceRange / 2 
  };

  const timeExtent = priceData.length > 0 ? {
    min: priceData[0].timestamp,
    max: priceData[priceData.length - 1].timestamp
  } : { min: Date.now() - 86400000, max: Date.now() };

  // Scale functions
  const xScale = (timestamp: number) => 
    ((timestamp - timeExtent.min) / (timeExtent.max - timeExtent.min)) * innerWidth;
  
  const yScale = (price: number) => 
    innerHeight - ((price - priceExtent.min) / (priceExtent.max - priceExtent.min)) * innerHeight;

  // Generate price line path
  const priceLine = priceData.length > 0 ? priceData.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(d.timestamp)} ${yScale(d.price)}`
  ).join(' ') : '';

  // Ensure the last point aligns with current price
  const currentPriceX = priceData.length > 0 ? xScale(timeExtent.max) : innerWidth;
  const currentPriceY = yScale(currentPrice);

  // Zone rendering function
  const renderZone = (zone: TradingZone, index: number) => {
    const y = yScale(zone.level);
    const zoneHeight = 20; // Visual height of zone
    
    return (
      <g key={`${zone.type}-${index}`}>
        {/* Zone rectangle */}
        <rect
          x={0}
          y={y - zoneHeight / 2}
          width={innerWidth}
          height={zoneHeight}
          fill={zone.type === 'buy' ? '#10B981' : '#EF4444'}
          fillOpacity={zone.strength === 'Strong' ? 0.3 : zone.strength === 'Moderate' ? 0.2 : 0.1}
          stroke={zone.type === 'buy' ? '#059669' : '#DC2626'}
          strokeWidth={zone.strength === 'Strong' ? 2 : 1}
          strokeDasharray={zone.strength === 'Weak' ? '5,5' : '0'}
          onMouseEnter={() => setHoveredZone(zone)}
          onMouseLeave={() => setHoveredZone(null)}
          className="cursor-pointer"
        />
        
        {/* Zone label */}
        <text
          x={innerWidth - 10}
          y={y + 4}
          textAnchor="end"
          fontSize={isMobile ? "11" : "12"}
          fontWeight="500"
          fill={zone.type === 'buy' ? '#059669' : '#DC2626'}
        >
          {zone.type === 'buy' ? '🟢' : '🔴'} ${zone.level.toLocaleString()} ({zone.strength})
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      {/* Dynamic Info Banner with Data Source */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-blue-900 mb-1">Chart Guide ({timeframe} Timeframe):</div>
              <div className="flex items-center space-x-2">
                {loading && (
                  <div className="flex items-center text-xs text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    Loading...
                  </div>
                )}
                <span className={`text-xs px-2 py-1 rounded ${
                  dataSource === 'api' ? 'bg-green-100 text-green-700' :
                  dataSource === 'cached' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {dataSource === 'api' ? '🌐 Live Data' :
                   dataSource === 'cached' ? '📦 Cached Data' :
                   '🔄 Fallback Data'}
                </span>
              </div>
            </div>
            <div className="text-blue-800 space-y-1">
              <div>• <span className="font-medium">Blue Zigzag Line:</span> {
                dataSource === 'fallback' 
                  ? `Simulated ${timeframe.toLowerCase()} price movements`
                  : `Real ${timeframe === '1H' ? 'hourly' : timeframe === '4H' ? '4-hour' : 'daily'} price data from CoinGecko API`
              }</div>
              <div>• <span className="font-medium text-black">Black Dotted Line:</span> Current real-time price level</div>
              <div>• <span className="font-medium">Colored Zones:</span> Optimal buy/sell areas based on technical analysis</div>
              <div className="text-xs mt-1 italic">
                {dataSource === 'fallback' ? '⚠️ Using simulated data due to API limitations' :
                 timeframe === '1H' ? '⚡ Real hourly data with authentic market movements' :
                 timeframe === '4H' ? '📊 Real 4-hour data showing actual market trends' :
                 '📈 Real daily data revealing genuine price patterns'}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            {symbol} Trading Zones Chart
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="text-gray-600">Current Price:</span>
              <span className="font-bold text-black ml-1">${currentPrice.toLocaleString()}</span>
              <div className="w-4 h-0.5 bg-black ml-2 border-dashed border-t-2 border-black"></div>
              <span className="text-xs text-gray-500 ml-1">(Black Dotted Line)</span>
            </div>
          </div>
        </div>
        
        {/* Enhanced Timeframe selector */}
        <div className="flex flex-col items-end space-y-2">
          <div className="text-xs text-gray-500 font-medium">Time Range</div>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 shadow-sm">
            {['1H', '4H', '1D'].map((tf) => {
              const isActive = timeframe === tf;
              const dataPoints = tf === '1H' ? '60pts' : tf === '4H' ? '72pts' : '90pts';
              return (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as any)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm transform scale-105' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                  title={`${tf} timeframe - ${dataPoints} data points`}
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

      {/* Chart Container */}
      <div className="relative overflow-x-auto bg-white">
        <div className="min-w-full">
          <svg 
            ref={chartRef}
            width={chartWidth} 
            height={chartHeight}
            className="border rounded-lg bg-gray-50 w-full max-w-full"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />
          
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Enhanced Y-axis price lines with more granular levels */}
            {[0.2, 0.4, 0.6, 0.8].map(ratio => {
              const price = priceExtent.min + (priceExtent.max - priceExtent.min) * ratio;
              const y = yScale(price);
              const isMiddleGrid = ratio === 0.4 || ratio === 0.6;
              return (
                <g key={ratio}>
                  <line 
                    x1={0} 
                    y1={y} 
                    x2={innerWidth} 
                    y2={y} 
                    stroke={isMiddleGrid ? "#9CA3AF" : "#D1D5DB"}
                    strokeWidth={isMiddleGrid ? 1.5 : 1}
                    strokeDasharray={isMiddleGrid ? "5,3" : "3,3"}
                  />
                  <text 
                    x={-10} 
                    y={y + 4} 
                    textAnchor="end" 
                    fontSize={isMobile ? "11" : "13"}
                    fontWeight={isMiddleGrid ? "600" : "500"}
                    fill={isMiddleGrid ? "#374151" : "#6B7280"}
                  >
                    ${Math.round(price).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Current price reference line - more prominent */}
            <g>
              <line 
                x1={0} 
                y1={yScale(currentPrice)} 
                x2={innerWidth} 
                y2={yScale(currentPrice)} 
                stroke="#EF4444"
                strokeWidth={1}
                strokeDasharray="2,2"
                opacity={0.6}
              />
              <text 
                x={-10} 
                y={yScale(currentPrice) + 4} 
                textAnchor="end" 
                fontSize={isMobile ? "12" : "14"}
                fontWeight="700"
                fill="#EF4444"
              >
                ${Math.round(currentPrice).toLocaleString()}
              </text>
            </g>

            {/* X-axis time labels */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const timestamp = timeExtent.min + (timeExtent.max - timeExtent.min) * ratio;
              const x = xScale(timestamp);
              const date = new Date(timestamp);
              
              // Format time based on timeframe
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
                <g key={ratio}>
                  <line 
                    x1={x} 
                    y1={0} 
                    x2={x} 
                    y2={innerHeight}
                    stroke="#E5E7EB"
                    strokeWidth={0.5}
                    strokeDasharray="2,2"
                  />
                  <text 
                    x={x} 
                    y={innerHeight + 15} 
                    textAnchor="middle" 
                    fontSize={isMobile ? "10" : "12"}
                    fill="#6B7280"
                    fontWeight="500"
                  >
                    {getTimeLabel()}
                  </text>
                </g>
              );
            })}

            {/* Support/Resistance levels */}
            {supportResistance && (
              <>
                {/* Strong Support */}
                <line 
                  x1={0} 
                  y1={yScale(supportResistance.strongSupport)} 
                  x2={innerWidth} 
                  y2={yScale(supportResistance.strongSupport)}
                  stroke="#059669" 
                  strokeWidth={3}
                  strokeDasharray="10,5"
                />
                
                {/* Support */}
                <line 
                  x1={0} 
                  y1={yScale(supportResistance.support)} 
                  x2={innerWidth} 
                  y2={yScale(supportResistance.support)}
                  stroke="#10B981" 
                  strokeWidth={2}
                />
                
                {/* Resistance */}
                <line 
                  x1={0} 
                  y1={yScale(supportResistance.resistance)} 
                  x2={innerWidth} 
                  y2={yScale(supportResistance.resistance)}
                  stroke="#F59E0B" 
                  strokeWidth={2}
                />
                
                {/* Strong Resistance */}
                <line 
                  x1={0} 
                  y1={yScale(supportResistance.strongResistance)} 
                  x2={innerWidth} 
                  y2={yScale(supportResistance.strongResistance)}
                  stroke="#DC2626" 
                  strokeWidth={3}
                  strokeDasharray="10,5"
                />
              </>
            )}

            {/* Trading Zones */}
            {tradingZones && (
              <>
                {tradingZones.buyZones.map(renderZone)}
                {tradingZones.sellZones.map(renderZone)}
              </>
            )}

            {/* Price line */}
            {priceData.length > 0 && (
              <>
                {/* Price area fill */}
                <path
                  d={`${priceLine} L ${xScale(timeExtent.max)} ${innerHeight} L ${xScale(timeExtent.min)} ${innerHeight} Z`}
                  fill="url(#priceGradient)"
                  fillOpacity={0.2}
                />
                
                {/* Price line */}
                <path
                  d={priceLine}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
                
                {/* Current price dot */}
                <circle
                  cx={currentPriceX}
                  cy={currentPriceY}
                  r={5}
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth={2}
                />
              </>
            )}

            {/* Current price line - horizontal across the chart */}
            <line 
              x1={0} 
              y1={currentPriceY} 
              x2={innerWidth} 
              y2={currentPriceY}
              stroke="#000000" 
              strokeWidth={3}
              strokeDasharray="8,4"
            />
            
            {/* Current price label with background */}
            <g>
              <rect
                x={innerWidth + 2}
                y={currentPriceY - (isMobile ? 15 : 12)}
                width={isMobile ? 90 : 80}
                height={isMobile ? 30 : 24}
                fill="#000000"
                rx="4"
              />
              <text 
                x={innerWidth + (isMobile ? 47 : 42)} 
                y={currentPriceY + (isMobile ? 6 : 4)} 
                fontSize={isMobile ? "14" : "12"}
                fontWeight="bold"
                fill="white"
                textAnchor="middle"
              >
                ${currentPrice.toLocaleString()}
              </text>
              <text 
                x={innerWidth + (isMobile ? 47 : 42)} 
                y={currentPriceY - (isMobile ? 18 : 16)} 
                fontSize={isMobile ? "11" : "10"}
                fontWeight="bold"
                fill="#000000"
                textAnchor="middle"
              >
                CURRENT
              </text>
            </g>
          </g>

          {/* Gradient definition */}
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </svg>
        </div>
      </div>

      {/* Zone Information */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Buy Zones */}
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <Target className="h-4 w-4 text-green-600 mr-2" />
            <span className="font-medium text-green-800">Optimal Buy Zones</span>
          </div>
          <div className="space-y-1 text-sm">
            {tradingZones?.buyZones.slice(0, 2).map((zone, index) => (
              <div key={index} className="flex justify-between">
                <span>${zone.level.toLocaleString()}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  zone.strength === 'Strong' ? 'bg-green-200 text-green-800' :
                  zone.strength === 'Moderate' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {zone.strength}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sell Zones */}
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-4 w-4 text-red-600 mr-2" />
            <span className="font-medium text-red-800">Optimal Sell Zones</span>
          </div>
          <div className="space-y-1 text-sm">
            {tradingZones?.sellZones.slice(0, 2).map((zone, index) => (
              <div key={index} className="flex justify-between">
                <span>${zone.level.toLocaleString()}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  zone.strength === 'Strong' ? 'bg-red-200 text-red-800' :
                  zone.strength === 'Moderate' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {zone.strength}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hovered zone tooltip */}
      {hoveredZone && (
        <div className={`absolute bg-black text-white p-3 rounded pointer-events-none z-10 ${isMobile ? 'text-sm' : 'text-xs'}`}>
          <div className="font-medium">
            {hoveredZone.type === 'buy' ? 'Buy Zone' : 'Sell Zone'}
          </div>
          <div>Price: ${hoveredZone.level.toLocaleString()}</div>
          <div>Strength: {hoveredZone.strength}</div>
          <div>Volume: {(hoveredZone.volume / 1000000).toFixed(1)}M</div>
        </div>
      )}

      {/* Enhanced Legend with Data Source */}
      <div className="mt-4 space-y-2">
        <div className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-base' : 'text-sm'}`}>
          Chart Legend ({timeframe} Analysis - {priceData.length} Data Points):
        </div>
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'sm:grid-cols-2 gap-2'} ${isMobile ? 'text-sm' : 'text-xs'}`}>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-blue-600 mr-2"></div>
            <span className="font-medium">{
              dataSource === 'fallback' 
                ? `Simulated ${timeframe} Price Data`
                : `Real ${timeframe === '1H' ? 'Hourly' : timeframe === '4H' ? '4-Hour' : 'Daily'} CoinGecko Data`
            }</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-black mr-2 border-dashed border-t-2 border-black"></div>
            <span className="font-medium text-black">Current Price Level</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 bg-opacity-30 border border-green-600 mr-2"></div>
            <span>Buy Zones</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 bg-opacity-30 border border-red-600 mr-2"></div>
            <span>Sell Zones</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-green-600 mr-2"></div>
            <span>Support Levels</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-orange-500 mr-2"></div>
            <span>Resistance Levels</span>
          </div>
        </div>
      </div>
    </div>
  );
}
