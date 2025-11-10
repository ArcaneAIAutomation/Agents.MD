/**
 * TradingView Advanced Charting Component
 * 
 * Integrates TradingView's advanced charting library with UCIE
 * for professional-grade technical analysis and visualization.
 * 
 * Features:
 * - Real-time price charts with multiple timeframes
 * - 100+ technical indicators
 * - Drawing tools and annotations
 * - Multiple chart types (candlestick, line, area, etc.)
 * - Custom indicators from UCIE analysis
 * - Mobile-optimized interface
 * - Dark theme matching Bitcoin Sovereign aesthetic
 */

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, Settings, Maximize2, Download } from 'lucide-react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string; // '1' | '5' | '15' | '60' | '240' | 'D' | 'W' | 'M'
  theme?: 'light' | 'dark';
  height?: number;
  width?: number | string;
  autosize?: boolean;
  hideTopToolbar?: boolean;
  hideSideToolbar?: boolean;
  allowSymbolChange?: boolean;
  studies?: string[]; // Array of study IDs to load
  customIndicators?: CustomIndicator[];
}

interface CustomIndicator {
  name: string;
  data: { time: number; value: number }[];
  color: string;
  lineWidth?: number;
}

/**
 * TradingView Advanced Chart Component
 */
export default function TradingViewChart({
  symbol,
  interval = 'D',
  theme = 'dark',
  height = 600,
  width = '100%',
  autosize = true,
  hideTopToolbar = false,
  hideSideToolbar = false,
  allowSymbolChange = false,
  studies = [],
  customIndicators = []
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Load TradingView library
  useEffect(() => {
    // Check if TradingView library is already loaded
    if (typeof window !== 'undefined' && (window as any).TradingView) {
      initializeChart();
      return;
    }
    
    // Load TradingView library
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      initializeChart();
    };
    script.onerror = () => {
      setError('Failed to load TradingView library');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [symbol, interval, theme]);
  
  /**
   * Initialize TradingView chart
   */
  const initializeChart = () => {
    if (!containerRef.current || !(window as any).TradingView) {
      return;
    }
    
    try {
      // Clear existing widget
      if (widgetRef.current) {
        widgetRef.current.remove();
      }
      
      // Create new widget
      widgetRef.current = new (window as any).TradingView.widget({
        container_id: containerRef.current.id,
        symbol: `BINANCE:${symbol}USDT`, // Default to Binance
        interval: interval,
        timezone: 'Etc/UTC',
        theme: theme,
        style: '1', // Candlestick
        locale: 'en',
        toolbar_bg: theme === 'dark' ? '#000000' : '#f1f3f6',
        enable_publishing: false,
        hide_top_toolbar: hideTopToolbar,
        hide_side_toolbar: hideSideToolbar,
        allow_symbol_change: allowSymbolChange,
        save_image: true,
        studies: [
          // Default studies
          'MASimple@tv-basicstudies',
          'RSI@tv-basicstudies',
          'MACD@tv-basicstudies',
          ...studies
        ],
        width: autosize ? '100%' : width,
        height: autosize ? '100%' : height,
        autosize: autosize,
        disabled_features: [
          'use_localstorage_for_settings',
          'header_symbol_search',
          'symbol_search_hot_key'
        ],
        enabled_features: [
          'study_templates',
          'side_toolbar_in_fullscreen_mode',
          'header_in_fullscreen_mode'
        ],
        overrides: {
          // Bitcoin Sovereign Theme
          'paneProperties.background': '#000000',
          'paneProperties.backgroundType': 'solid',
          'paneProperties.vertGridProperties.color': 'rgba(247, 147, 26, 0.1)',
          'paneProperties.horzGridProperties.color': 'rgba(247, 147, 26, 0.1)',
          'symbolWatermarkProperties.transparency': 90,
          'scalesProperties.textColor': '#FFFFFF',
          'scalesProperties.lineColor': 'rgba(247, 147, 26, 0.2)',
          
          // Candlestick colors
          'mainSeriesProperties.candleStyle.upColor': '#F7931A',
          'mainSeriesProperties.candleStyle.downColor': '#FFFFFF',
          'mainSeriesProperties.candleStyle.borderUpColor': '#F7931A',
          'mainSeriesProperties.candleStyle.borderDownColor': '#FFFFFF',
          'mainSeriesProperties.candleStyle.wickUpColor': '#F7931A',
          'mainSeriesProperties.candleStyle.wickDownColor': '#FFFFFF',
          
          // Volume colors
          'volumePaneSize': 'medium',
          'mainSeriesProperties.volumeStyle.volume.color.0': 'rgba(255, 255, 255, 0.5)',
          'mainSeriesProperties.volumeStyle.volume.color.1': 'rgba(247, 147, 26, 0.5)',
        },
        studies_overrides: {
          // MA colors
          'moving average.ma.color': '#F7931A',
          'moving average.ma.linewidth': 2,
          
          // RSI colors
          'relative strength index.plot.color': '#F7931A',
          'relative strength index.hlines background.color': 'rgba(247, 147, 26, 0.1)',
          
          // MACD colors
          'MACD.macd.color': '#F7931A',
          'MACD.signal.color': '#FFFFFF',
          'MACD.histogram.color': 'rgba(247, 147, 26, 0.5)',
        },
        loading_screen: {
          backgroundColor: '#000000',
          foregroundColor: '#F7931A'
        }
      });
      
      // Wait for chart to be ready
      widgetRef.current.onChartReady(() => {
        console.log('✅ TradingView chart ready');
        setIsLoading(false);
        
        // Add custom indicators if provided
        if (customIndicators.length > 0) {
          addCustomIndicators();
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize TradingView chart:', error);
      setError('Failed to initialize chart');
      setIsLoading(false);
    }
  };
  
  /**
   * Add custom indicators from UCIE analysis
   */
  const addCustomIndicators = () => {
    if (!widgetRef.current) return;
    
    try {
      const chart = widgetRef.current.chart();
      
      customIndicators.forEach(indicator => {
        // Create custom study
        chart.createStudy(
          indicator.name,
          false, // forceOverlay
          false, // lock
          indicator.data,
          {
            'plot.color': indicator.color,
            'plot.linewidth': indicator.lineWidth || 2
          }
        );
      });
      
      console.log(`✅ Added ${customIndicators.length} custom indicators`);
    } catch (error) {
      console.error('❌ Failed to add custom indicators:', error);
    }
  };
  
  /**
   * Change chart interval
   */
  const changeInterval = (newInterval: string) => {
    if (widgetRef.current) {
      widgetRef.current.chart().setResolution(newInterval);
    }
  };
  
  /**
   * Take screenshot
   */
  const takeScreenshot = () => {
    if (widgetRef.current) {
      widgetRef.current.takeScreenshot();
    }
  };
  
  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = () => {
    if (widgetRef.current) {
      widgetRef.current.startFullscreen();
    }
  };
  
  return (
    <div className="relative w-full h-full bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-bitcoin-black border-b-2 border-bitcoin-orange px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
          <h3 className="text-lg font-bold text-bitcoin-white">
            {symbol} Advanced Chart
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Interval Selector */}
          <select
            value={interval}
            onChange={(e) => changeInterval(e.target.value)}
            className="bg-bitcoin-black text-bitcoin-white border border-bitcoin-orange-20 rounded px-2 py-1 text-sm focus:border-bitcoin-orange focus:outline-none"
          >
            <option value="1">1m</option>
            <option value="5">5m</option>
            <option value="15">15m</option>
            <option value="60">1h</option>
            <option value="240">4h</option>
            <option value="D">1D</option>
            <option value="W">1W</option>
            <option value="M">1M</option>
          </select>
          
          {/* Screenshot Button */}
          <button
            onClick={takeScreenshot}
            className="p-2 text-bitcoin-orange hover:text-bitcoin-white transition-colors"
            title="Take Screenshot"
          >
            <Download className="w-5 h-5" />
          </button>
          
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-bitcoin-orange hover:text-bitcoin-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-bitcoin-orange hover:text-bitcoin-white transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Chart Container */}
      <div
        id={`tradingview-chart-${symbol}`}
        ref={containerRef}
        className="w-full h-full pt-12"
        style={{ minHeight: height }}
      />
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bitcoin-black bg-opacity-90 z-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-bitcoin-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-bitcoin-white text-lg font-semibold">
              Loading TradingView Chart...
            </p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-bitcoin-black bg-opacity-90 z-20">
          <div className="text-center max-w-md p-6">
            <p className="text-bitcoin-orange text-lg font-semibold mb-4">
              {error}
            </p>
            <button
              onClick={initializeChart}
              className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-14 right-4 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 z-20 shadow-[0_0_30px_rgba(247,147,26,0.5)] min-w-[250px]">
          <h4 className="text-bitcoin-white font-bold mb-3">Chart Settings</h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-bitcoin-white-60 text-sm block mb-1">
                Chart Type
              </label>
              <select className="w-full bg-bitcoin-black text-bitcoin-white border border-bitcoin-orange-20 rounded px-2 py-1 text-sm focus:border-bitcoin-orange focus:outline-none">
                <option value="1">Candlestick</option>
                <option value="0">Bars</option>
                <option value="3">Line</option>
                <option value="8">Area</option>
                <option value="9">Heikin Ashi</option>
              </select>
            </div>
            
            <div>
              <label className="text-bitcoin-white-60 text-sm block mb-1">
                Indicators
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-bitcoin-white text-sm">
                  <input type="checkbox" defaultChecked className="accent-bitcoin-orange" />
                  Moving Average
                </label>
                <label className="flex items-center gap-2 text-bitcoin-white text-sm">
                  <input type="checkbox" defaultChecked className="accent-bitcoin-orange" />
                  RSI
                </label>
                <label className="flex items-center gap-2 text-bitcoin-white text-sm">
                  <input type="checkbox" defaultChecked className="accent-bitcoin-orange" />
                  MACD
                </label>
                <label className="flex items-center gap-2 text-bitcoin-white text-sm">
                  <input type="checkbox" className="accent-bitcoin-orange" />
                  Bollinger Bands
                </label>
                <label className="flex items-center gap-2 text-bitcoin-white text-sm">
                  <input type="checkbox" className="accent-bitcoin-orange" />
                  Volume
                </label>
              </div>
            </div>
            
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-bitcoin-orange text-bitcoin-black font-bold uppercase px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:border-2 hover:border-bitcoin-orange"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Lightweight Chart Component (for mobile)
 */
export function LightweightChart({ symbol, height = 400 }: { symbol: string; height?: number }) {
  return (
    <div className="w-full bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
        <h3 className="text-lg font-bold text-bitcoin-white">
          {symbol} Price Chart
        </h3>
      </div>
      
      <div className="text-center py-12 text-bitcoin-white-60">
        <p className="mb-4">Lightweight chart loading...</p>
        <p className="text-sm">For advanced features, use desktop version</p>
      </div>
    </div>
  );
}
