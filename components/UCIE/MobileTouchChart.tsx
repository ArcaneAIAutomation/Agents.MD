import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface MobileTouchChartProps {
  data: any[];
  dataKey: string;
  xAxisKey?: string;
  title?: string;
  color?: string;
  height?: number;
  showArea?: boolean;
}

export default function MobileTouchChart({
  data,
  dataKey,
  xAxisKey = 'timestamp',
  title,
  color = '#F7931A',
  height = 300,
  showArea = false,
}: MobileTouchChartProps) {
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle pinch-to-zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        setIsPinching(true);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      } else if (e.touches.length === 1) {
        setTouchStart({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const scaleChange = currentDistance / initialDistance;
        setScale((prevScale) => Math.max(0.5, Math.min(3, prevScale * scaleChange)));
        initialDistance = currentDistance;
      }
    };

    const handleTouchEnd = () => {
      setIsPinching(false);
      setTouchStart(null);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPinching]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-3 shadow-lg">
          <p className="text-bitcoin-white-80 text-sm mb-1">
            {payload[0].payload[xAxisKey]}
          </p>
          <p className="text-bitcoin-orange font-mono font-bold text-lg">
            {typeof payload[0].value === 'number' 
              ? payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const ChartComponent = showArea ? AreaChart : LineChart;
  const DataComponent = showArea ? Area : Line;

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-lg font-bold text-bitcoin-white mb-3">
          {title}
        </h4>
      )}
      
      <div 
        ref={containerRef}
        className="relative touch-none select-none"
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          transition: isPinching ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(247, 147, 26, 0.1)" 
            />
            <XAxis 
              dataKey={xAxisKey}
              stroke="rgba(255, 255, 255, 0.6)"
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}
              tickLine={{ stroke: 'rgba(247, 147, 26, 0.2)' }}
            />
            <YAxis 
              stroke="rgba(255, 255, 255, 0.6)"
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}
              tickLine={{ stroke: 'rgba(247, 147, 26, 0.2)' }}
              tickFormatter={(value) => 
                typeof value === 'number' 
                  ? value.toLocaleString(undefined, { notation: 'compact' })
                  : value
              }
            />
            <Tooltip content={<CustomTooltip />} />
            {showArea ? (
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill={`${color}33`}
                fillOpacity={0.3}
              />
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: color }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          className="px-3 py-1 bg-bitcoin-black border border-bitcoin-orange text-bitcoin-orange rounded hover:bg-bitcoin-orange hover:text-bitcoin-black transition-colors text-sm font-semibold min-h-[36px]"
        >
          Zoom Out
        </button>
        <span className="text-bitcoin-white-60 text-sm font-mono">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.25))}
          className="px-3 py-1 bg-bitcoin-black border border-bitcoin-orange text-bitcoin-orange rounded hover:bg-bitcoin-orange hover:text-bitcoin-black transition-colors text-sm font-semibold min-h-[36px]"
        >
          Zoom In
        </button>
        <button
          onClick={() => setScale(1)}
          className="px-3 py-1 bg-bitcoin-black border border-bitcoin-orange text-bitcoin-orange rounded hover:bg-bitcoin-orange hover:text-bitcoin-black transition-colors text-sm font-semibold min-h-[36px]"
        >
          Reset
        </button>
      </div>

      {/* Touch Instructions */}
      <p className="text-center text-bitcoin-white-60 text-xs mt-2">
        Pinch to zoom • Swipe to pan
      </p>
    </div>
  );
}
