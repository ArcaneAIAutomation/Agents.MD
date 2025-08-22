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
  const chartRef = useRef<SVGSVGElement>(null);

  // Generate realistic price data based on current price
  const generatePriceData = (basePrice: number, periods: number = 50) => {
    const data: PriceData[] = [];
    let price = basePrice;
    const now = Date.now();
    const interval = timeframe === '1H' ? 3600000 : timeframe === '4H' ? 14400000 : 86400000;

    for (let i = periods; i >= 0; i--) {
      // Add some realistic volatility
      const volatility = symbol === 'BTC' ? 0.02 : 0.03; // BTC less volatile than ETH
      const change = (Math.random() - 0.5) * volatility;
      price = price * (1 + change);
      
      data.push({
        timestamp: now - (i * interval),
        price: Math.round(price * 100) / 100,
        volume: Math.random() * 1000000 + 500000
      });
    }
    
    // Ensure the last price matches current price
    data[data.length - 1].price = currentPrice;
    return data;
  };

  useEffect(() => {
    const data = generatePriceData(currentPrice);
    setPriceData(data);
  }, [currentPrice, timeframe, symbol]);

  // Calculate chart dimensions and scales
  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 20, right: 60, bottom: 40, left: 80 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const priceExtent = priceData.length > 0 ? {
    min: Math.min(...priceData.map(d => d.price)) * 0.95,
    max: Math.max(...priceData.map(d => d.price)) * 1.05
  } : { min: currentPrice * 0.95, max: currentPrice * 1.05 };

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
  const priceLine = priceData.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(d.timestamp)} ${yScale(d.price)}`
  ).join(' ');

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
          className="text-xs font-medium"
          fill={zone.type === 'buy' ? '#059669' : '#DC2626'}
        >
          {zone.type === 'buy' ? '🟢' : '🔴'} ${zone.level.toLocaleString()} ({zone.strength})
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            {symbol} Trading Zones Chart
          </h3>
          <p className="text-sm text-gray-600">
            Current Price: <span className="font-medium">${currentPrice.toLocaleString()}</span>
          </p>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {['1H', '4H', '1D'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === tf 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative overflow-x-auto">
        <svg 
          ref={chartRef}
          width={chartWidth} 
          height={chartHeight}
          className="border rounded-lg bg-gray-50"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />
          
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Y-axis price lines */}
            {[0.25, 0.5, 0.75].map(ratio => {
              const price = priceExtent.min + (priceExtent.max - priceExtent.min) * ratio;
              const y = yScale(price);
              return (
                <g key={ratio}>
                  <line 
                    x1={0} 
                    y1={y} 
                    x2={innerWidth} 
                    y2={y} 
                    stroke="#D1D5DB" 
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                  <text 
                    x={-10} 
                    y={y + 4} 
                    textAnchor="end" 
                    className="text-xs text-gray-500"
                  >
                    ${Math.round(price).toLocaleString()}
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
                  cx={xScale(timeExtent.max)}
                  cy={yScale(currentPrice)}
                  r={4}
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth={2}
                />
              </>
            )}

            {/* Current price line */}
            <line 
              x1={0} 
              y1={yScale(currentPrice)} 
              x2={innerWidth} 
              y2={yScale(currentPrice)}
              stroke="#3B82F6" 
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <text 
              x={innerWidth + 5} 
              y={yScale(currentPrice) + 4} 
              className="text-sm font-bold text-blue-600"
            >
              ${currentPrice.toLocaleString()}
            </text>
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
        <div className="absolute bg-black text-white p-2 rounded text-xs pointer-events-none z-10">
          <div className="font-medium">
            {hoveredZone.type === 'buy' ? 'Buy Zone' : 'Sell Zone'}
          </div>
          <div>Price: ${hoveredZone.level.toLocaleString()}</div>
          <div>Strength: {hoveredZone.strength}</div>
          <div>Volume: {(hoveredZone.volume / 1000000).toFixed(1)}M</div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 bg-opacity-30 border border-green-600 mr-1"></div>
          <span>Buy Zones</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 bg-opacity-30 border border-red-600 mr-1"></div>
          <span>Sell Zones</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-1 bg-green-600 mr-1"></div>
          <span>Support Levels</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-1 bg-red-600 mr-1"></div>
          <span>Resistance Levels</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-1 bg-blue-600 mr-1"></div>
          <span>Current Price</span>
        </div>
      </div>
    </div>
  );
}
