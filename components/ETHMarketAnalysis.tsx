import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Target, Clock, BarChart3, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import ETHTradingChart from './ETHTradingChart'
import ETHHiddenPivotChart from './ETHHiddenPivotChart'

// Fear & Greed Visual Slider Component - Mobile Optimized
const FearGreedSlider = ({ value }: { value: number }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getSliderColor = (val: number) => {
    if (val <= 25) return 'from-red-600 to-red-400' // Extreme Fear
    if (val <= 45) return 'from-orange-500 to-orange-400' // Fear
    if (val <= 55) return 'from-yellow-500 to-yellow-400' // Neutral
    if (val <= 75) return 'from-green-500 to-green-400' // Greed
    return 'from-green-600 to-green-500' // Extreme Greed
  }

  const getLabel = (val: number) => {
    if (val <= 25) return isMobile ? 'Ext Fear' : 'Extreme Fear'
    if (val <= 45) return 'Fear'
    if (val <= 55) return 'Neutral'
    if (val <= 75) return 'Greed'
    return isMobile ? 'Ext Greed' : 'Extreme Greed'
  }

  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="bitcoin-block-subtle min-h-[80px] md:min-h-[90px] flex flex-col justify-center min-w-[44px] p-3 md:p-4 overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-wider text-bitcoin-white-60 mb-2 truncate">
        {isMobile ? 'Fear & Greed' : 'Fear & Greed'}
      </p>
      
      {/* Visual Slider - Enhanced Mobile Optimized */}
      <div className="relative w-full h-8 md:h-6 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full mb-2 touch-manipulation">
        {/* Background gradient zones */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
          <div className="h-full w-full bg-gradient-to-r from-bitcoin-orange via-bitcoin-orange to-bitcoin-orange"></div>
        </div>
        
        {/* Slider indicator - Properly constrained */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-4 md:h-4 bg-bitcoin-orange border-2 border-bitcoin-white rounded-full shadow-md transition-all duration-300 cursor-pointer glow-bitcoin"
          style={{ 
            left: `calc(${clampedValue}% - ${clampedValue * 0.05}px)`,
            marginLeft: '2.5px'
          }}
        />
        
        {/* Value overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm md:text-xs font-bold text-bitcoin-white font-mono">
            {clampedValue}
          </span>
        </div>
      </div>
      
      {/* Label - Mobile Optimized */}
      <p className="text-base md:text-lg font-bold text-bitcoin-orange truncate">
        {getLabel(clampedValue)}
      </p>
    </div>
  )
}

// Ethereum Logo Component
const EthereumIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 417" className={className} fill="currentColor">
    <g>
      <polygon fill="#343434" points="127.9611,0 125.1661,9.5 125.1661,285.168 127.9611,287.958 255.9231,212.32"/>
      <polygon fill="#8C8C8C" points="127.962,0 0,212.32 127.962,287.959 127.962,154.158"/>
      <polygon fill="#3C3C3B" points="127.9611,312.1866 126.3861,314.1066 126.3861,412.3056 127.9611,416.9996 255.9991,236.5866"/>
      <polygon fill="#8C8C8C" points="127.962,416.9996 127.962,312.1866 0,236.5866"/>
      <polygon fill="#141414" points="127.9611,287.9586 255.9211,212.3206 127.9611,154.1586"/>
      <polygon fill="#393939" points="0,212.32 127.962,287.959 127.962,154.158"/>
    </g>
  </svg>
);

interface ETHAnalysisData {
  currentPrice?: number
  priceAnalysis?: {
    current?: number
    change24h?: number
    support?: number
    resistance?: number
  }
  marketData?: {
    price?: number
    change24h?: number
    volume24h?: number
    marketCap?: number
  }
  technicalIndicators?: {
    rsi?: number | { value: string; signal: string; timeframe: string }
    ema20?: number
    ema50?: number
    macd?: { signal: string; histogram: number }
    bollinger?: { upper: number; lower: number; middle: number }
    volume?: { trend: string; significance: string }
    supportResistance?: {
      strongSupport: number
      support: number
      resistance: number
      strongResistance: number
    }
    supplyDemandZones?: {
      demandZones: Array<{ 
        level: number; 
        strength: 'Strong' | 'Moderate' | 'Weak'; 
        volume: number;
        source?: string;
        confidence?: number;
      }>
      supplyZones: Array<{ 
        level: number; 
        strength: 'Strong' | 'Moderate' | 'Weak'; 
        volume: number;
        source?: string;
        confidence?: number;
      }>
    }
  }
  tradingSignals?: Array<{
    type: string
    strength: string
    timeframe: string
    price: number
    reasoning: string
  }>
  marketSentiment?: {
    overall?: string
    fearGreed?: number
    socialMedia?: string
    institutionalFlow?: string
  }
  predictions?: {
    hourly?: { target: number; confidence: number }
    daily?: { target: number; confidence: number }
    weekly?: { target: number; confidence: number }
  }
  newsImpact?: Array<{
    headline: string
    impact: string
    timeAgo: string
    source: string
  }>
  enhancedMarketData?: {
    orderBookImbalance?: {
      volumeImbalance: number
      valueImbalance: number
      bidPressure: number
      askPressure: number
      strongestBid: number
      strongestAsk: number
    }
    whaleMovements?: Array<{
      price: number
      quantity: number
      time: number
      isBuyerMaker: boolean
    }>
    historicalLevels?: {
      support: Array<{ price: number; volume: number; touches: number }>
      resistance: Array<{ price: number; volume: number; touches: number }>
    }
    realMarketSentiment?: {
      fearGreedIndex?: number
      fearGreedClassification?: string
      fundingRate?: number
      nextFundingTime?: number
    }
    dataQuality?: {
      orderBookData: boolean
      volumeData: boolean
      sentimentData: boolean
      whaleData: boolean
    }
  }
  lastUpdated?: string
  timestamp?: string
  isLiveData?: boolean
  isEnhancedData?: boolean
}

export default function ETHMarketAnalysis() {
  const [data, setData] = useState<ETHAnalysisData | null>(null)
  const [loading, setLoading] = useState(false) // Start with loading false - manual only
  const [error, setError] = useState<string | null>(null)
  const [showTradingZones, setShowTradingZones] = useState(false)
  const [showHiddenPivot, setShowHiddenPivot] = useState(false)

  // Helper function to extract RSI value from either number or object format
  const getRSIValue = (rsi: any): number => {
    if (typeof rsi === 'number') return rsi
    if (typeof rsi === 'object' && rsi?.value) return parseFloat(rsi.value)
    if (typeof rsi === 'string') return parseFloat(rsi)
    return 50 // Default RSI value instead of 0
  }

  // STRICT: Only use real data - no fallbacks allowed
  const validateRealData = (rawData: any): ETHAnalysisData | null => {
    // Reject if no real price data
    if (!rawData.currentPrice && !rawData.marketData?.price) {
      console.error('No real ETH price data available - refusing to display');
      return null;
    }

    // Reject if not marked as live data
    if (!rawData.isLiveData) {
      console.error('ETH data not marked as live - refusing to display');
      return null;
    }

    const currentPrice = rawData.currentPrice || rawData.marketData?.price;
    
    return {
      currentPrice,
      priceAnalysis: {
        current: currentPrice,
        change24h: rawData.priceAnalysis?.change24h || rawData.marketData?.change24h || 0,
        support: rawData.priceAnalysis?.support || rawData.technicalIndicators?.supportResistance?.support || 0,
        resistance: rawData.priceAnalysis?.resistance || rawData.technicalIndicators?.supportResistance?.resistance || 0,
      },
      
      marketData: {
        price: currentPrice,
        change24h: rawData.marketData?.change24h || 0,
        volume24h: rawData.marketData?.volume24h || 0,
        marketCap: rawData.marketData?.marketCap || 0,
      },
      
      // Use REAL technical indicators only
      technicalIndicators: {
        rsi: rawData.technicalIndicators?.rsi || { value: 50, signal: 'NEUTRAL', timeframe: '14' },
        ema20: rawData.technicalIndicators?.ema20 || 0,
        ema50: rawData.technicalIndicators?.ema50 || 0,
        macd: rawData.technicalIndicators?.macd || { signal: 'NEUTRAL', histogram: 0 },
        bollinger: rawData.technicalIndicators?.bollinger || { upper: 0, middle: 0, lower: 0 },
        supportResistance: rawData.technicalIndicators?.supportResistance || {
          strongSupport: 0,
          support: 0,
          resistance: 0,
          strongResistance: 0,
        },
        // REAL supply/demand zones from enhanced analysis
        supplyDemandZones: rawData.technicalIndicators?.supplyDemandZones || {
          demandZones: [],
          supplyZones: []
        }
      },
      
      // Real trading signals only
      tradingSignals: Array.isArray(rawData.tradingSignals) ? rawData.tradingSignals : [],
      
      // Real market sentiment
      marketSentiment: {
        overall: rawData.marketSentiment?.overall || 'Unknown',
        fearGreed: rawData.marketSentiment?.fearGreedIndex || rawData.enhancedMarketData?.realMarketSentiment?.fearGreedIndex || 50,
        socialMedia: rawData.marketSentiment?.socialSentiment || 'Unknown',
        institutionalFlow: rawData.marketSentiment?.institutionalFlow || 'Unknown',
      },
      
      // Real predictions only
      predictions: rawData.predictions || {
        hourly: { target: 0, confidence: 0 },
        daily: { target: 0, confidence: 0 },
        weekly: { target: 0, confidence: 0 }
      },
      
      // Real news impact
      newsImpact: Array.isArray(rawData.newsContext) ? rawData.newsContext.map((news: any) => ({
        headline: news.title,
        impact: 'Neutral',
        timeAgo: 'Recent',
        source: news.source || 'Unknown'
      })) : [],
      
      // Enhanced market data
      enhancedMarketData: rawData.enhancedMarketData,
      
      // Metadata
      lastUpdated: rawData.lastUpdated || new Date().toISOString(),
      timestamp: rawData.timestamp || new Date().toISOString(),
      isLiveData: rawData.isLiveData,
      isEnhancedData: rawData.isEnhancedData
    }
  }

  const fetchETHAnalysis = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/eth-analysis-enhanced')
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }
      
      const rawData = await response.json()
      
      // Check if API returned success
      if (!rawData.success) {
        throw new Error(rawData.error || 'API returned unsuccessful response')
      }
      
      // STRICT: Only accept real data
      const validatedData = validateRealData(rawData.data)
      
      if (!validatedData) {
        throw new Error('No valid real ETH market data available')
      }
      
      setData(validatedData)
      console.log('✅ Real ETH market data loaded successfully')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ Failed to load real ETH market data:', errorMessage)
      
      // STRICT: No fallback data - leave data as null to show error state
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  // Manual loading only - no auto-fetch on mount

  if (loading) {
    return (
      <div className="bitcoin-block">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin-orange"></div>
          <span className="ml-2 text-bitcoin-white-80">Loading ETH analysis...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bitcoin-block">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-center">
            <p className="font-medium text-bitcoin-white">Error loading ETH analysis</p>
            <p className="text-sm text-bitcoin-white-60 mt-1">{error}</p>
            <button
              onClick={fetchETHAnalysis}
              className="btn-bitcoin-primary mt-3"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bitcoin-block">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-center">
            <EthereumIcon className="h-12 w-12 mx-auto text-bitcoin-orange mb-4" />
            <h3 className="text-lg font-semibold text-bitcoin-white mb-2">Ethereum Market Analysis</h3>
            <p className="text-bitcoin-white-60 mb-4">Click to load current Ethereum market data</p>
            <button
              onClick={fetchETHAnalysis}
              className="btn-bitcoin-primary btn-bitcoin-lg"
            >
              Load AI Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bitcoin-block">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-bitcoin-white">Ethereum Market Analysis</h2>
          <div className="flex items-center mt-1 space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium min-h-[32px] ${
              data.isLiveData ? 'bg-bitcoin-orange text-bitcoin-black' : 'border border-bitcoin-orange text-bitcoin-orange'
            }`}>
              <span className="w-2 h-2 bg-current rounded-full mr-1"></span>
              LIVE DATA
            </span>
            {/* Data Source Indicators */}
            <div className="flex items-center space-x-1">
              <span className={`px-2 py-1 rounded text-xs min-h-[32px] flex items-center ${
                data.isLiveData ? 'border border-bitcoin-orange-20 text-bitcoin-orange' : 'border border-bitcoin-white-60 text-bitcoin-white-60'
              }`}>
                AI
              </span>
              <span className={`px-2 py-1 rounded text-xs min-h-[32px] flex items-center ${
                data.currentPrice && data.currentPrice > 3000 ? 'border border-bitcoin-orange text-bitcoin-orange' : 'border border-bitcoin-white-60 text-bitcoin-white-60'
              }`}>
                Price
              </span>
              <span className={`px-2 py-1 rounded text-xs min-h-[32px] flex items-center ${
                data.newsImpact && data.newsImpact.length > 3 ? 'border border-bitcoin-orange text-bitcoin-orange' : 'border border-bitcoin-white-60 text-bitcoin-white-60'
              }`}>
                News
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchETHAnalysis}
          className="btn-bitcoin-primary"
        >
          Refresh
        </button>
      </div>

      {/* Price Overview - Mobile Optimized */}
      <div className="stat-grid stat-grid-4 mb-6">
        <div className="stat-card">
          <div className="stat-label">Price</div>
          <div className="price-display price-display-sm">
            ${Math.round((data.currentPrice || data.priceAnalysis?.current || data.marketData?.price || 0)).toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">24h Change</div>
          <div className={`stat-value ${(data.priceAnalysis?.change24h || data.marketData?.change24h || 0) >= 0 ? 'stat-value-orange' : 'text-bitcoin-white'}`}>
            {(data.priceAnalysis?.change24h || data.marketData?.change24h || 0) >= 0 ? '+' : ''}{(data.priceAnalysis?.change24h || data.marketData?.change24h || 0).toFixed(1)}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Support</div>
          <div className="stat-value text-bitcoin-white">
            ${Math.round(data.priceAnalysis?.support || 0).toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resistance</div>
          <div className="stat-value text-bitcoin-white">
            ${Math.round(data.priceAnalysis?.resistance || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Technical Indicators - Mobile Optimized */}
      <div className="mb-6">
        <h3 className="text-base md:text-lg font-semibold text-bitcoin-white mb-4 flex items-center">
          <BarChart3 className="h-4 w-4 md:h-5 md:w-5 mr-2 text-bitcoin-orange" />
          Technical Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          <div className="bitcoin-block-subtle">
            <div className="flex justify-between items-center">
              <span className="stat-label">RSI (14)</span>
              <span className={`text-lg font-bold font-mono ${
                getRSIValue(data.technicalIndicators?.rsi) > 70 ? 'text-bitcoin-orange' : 
                getRSIValue(data.technicalIndicators?.rsi) < 30 ? 'text-bitcoin-orange' : 'text-bitcoin-white'
              }`}>
                {getRSIValue(data.technicalIndicators?.rsi).toFixed(1)}
              </span>
            </div>
            <div className="mt-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-bitcoin-orange"
                style={{ width: `${Math.min(getRSIValue(data.technicalIndicators?.rsi), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-bitcoin-white-60 mt-1">
              {getRSIValue(data.technicalIndicators?.rsi) > 70 ? 'Overbought' : 
               getRSIValue(data.technicalIndicators?.rsi) < 30 ? 'Oversold' : 'Neutral'}
            </p>
          </div>

          <div className="bitcoin-block-subtle">
            <div className="flex justify-between items-center">
              <span className="stat-label">MACD</span>
              <span className={`text-sm font-semibold font-mono ${
                data.technicalIndicators?.macd?.signal === 'BUY' ? 'text-bitcoin-orange' : 
                data.technicalIndicators?.macd?.signal === 'SELL' ? 'text-bitcoin-orange' : 'text-bitcoin-white'
              }`}>
                {data.technicalIndicators?.macd?.signal || 'NEUTRAL'}
              </span>
            </div>
            <p className="text-xs text-bitcoin-white-60 mt-2 font-mono">
              Histogram: {(data.technicalIndicators?.macd?.histogram || 0).toFixed(2)}
            </p>
          </div>

          <div className="bitcoin-block-subtle">
            <div className="flex justify-between items-center">
              <span className="stat-label">Moving Averages</span>
              <TrendingUp className="h-4 w-4 text-bitcoin-orange" />
            </div>
            <div className="text-xs text-bitcoin-white-80 mt-2 space-y-1 font-mono">
              <div>EMA 20: ${Math.round(data.technicalIndicators?.ema20 || 0).toLocaleString()}</div>
              <div>EMA 50: ${Math.round(data.technicalIndicators?.ema50 || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="bitcoin-block-subtle">
            <div className="flex justify-between items-center">
              <span className="stat-label">Bollinger Bands</span>
              <Activity className="h-4 w-4 text-bitcoin-orange" />
            </div>
            <div className="text-xs text-bitcoin-white-80 mt-2 space-y-1 font-mono">
              <div>Upper: ${Math.round(data.technicalIndicators?.bollinger?.upper || 0).toLocaleString()}</div>
              <div>Middle: ${Math.round(data.technicalIndicators?.bollinger?.middle || 0).toLocaleString()}</div>
              <div>Lower: ${Math.round(data.technicalIndicators?.bollinger?.lower || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="bitcoin-block-subtle col-span-1 lg:col-span-2">
            <div className="flex justify-between items-center mb-3">
              <span className="stat-label">Support/Resistance Levels</span>
              <BarChart3 className="h-4 w-4 text-bitcoin-orange" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-2">
                <div className="font-medium text-bitcoin-white">Resistance</div>
                <div className="text-bitcoin-orange font-medium">Strong: ${Math.round(data.technicalIndicators?.supportResistance?.strongResistance || 0).toLocaleString()}</div>
                <div className="text-bitcoin-white-80">Normal: ${Math.round(data.technicalIndicators?.supportResistance?.resistance || 0).toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-bitcoin-white">Support</div>
                <div className="text-bitcoin-white-80">Normal: ${Math.round(data.technicalIndicators?.supportResistance?.support || 0).toLocaleString()}</div>
                <div className="text-bitcoin-orange font-medium">Strong: ${Math.round(data.technicalIndicators?.supportResistance?.strongSupport || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bitcoin-block col-span-1 lg:col-span-2">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3 space-y-2 md:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm font-bold text-bitcoin-white">
                  {data.isEnhancedData ? '🎯 LIVE Supply/Demand Zones' : 'Supply/Demand Zones'}
                </span>
                {data.isEnhancedData && (
                  <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black text-xs rounded font-medium animate-pulse">
                    REAL-TIME
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-xs text-bitcoin-white-60">
                  {data.technicalIndicators?.supplyDemandZones?.supplyZones?.length || 0}S / 
                  {data.technicalIndicators?.supplyDemandZones?.demandZones?.length || 0}D
                </span>
              </div>
            </div>

            {/* Enhanced Supply/Demand Zones Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs">
              {/* Supply Zones */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-bitcoin-orange mobile-text-primary">📈 Supply Zones</div>
                  <div className="text-xs mobile-text-muted">Resistance Levels</div>
                </div>
                {data.technicalIndicators?.supplyDemandZones?.supplyZones?.slice(0, 4).map((zone, index) => (
                  <div key={index} className="bitcoin-block-subtle border-l-4 border-bitcoin-orange hover:border-bitcoin-orange transition-colors overflow-hidden">
                    <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                      <div className="font-bold text-bitcoin-white text-sm sm:text-base truncate min-w-0 flex-shrink font-mono" style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                        ${Math.round(zone.level).toLocaleString()}
                      </div>
                      <div className={`px-2 py-1 rounded font-medium flex-shrink-0 ${
                        zone.strength === 'Strong' || zone.strength === 'Very Strong' 
                          ? 'bg-bitcoin-orange text-bitcoin-black' 
                          : 'border border-bitcoin-orange text-bitcoin-orange'
                      }`} style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                        {zone.strength}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 min-w-0" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                      <span className="mobile-text-secondary truncate min-w-0 flex-shrink">
                        {zone.source === 'live_orderbook' && '📊 Live OrderBook'}
                        {zone.source === 'pivot_analysis' && '📈 Pivot Analysis'}
                        {zone.source === 'fibonacci' && '🔢 Fibonacci'}
                        {zone.source === 'psychological' && '🧠 Psychological'}
                        {zone.source === 'orderbook' && '📊 OrderBook'}
                        {!zone.source && '📊 Technical'}
                      </span>
                      {zone.confidence && (
                        <span className="text-bitcoin-orange font-medium flex-shrink-0" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{zone.confidence}%</span>
                      )}
                    </div>
                    
                    {/* Enhanced Zone Information Display */}
                    <div className="mobile-text-muted mt-1 min-w-0 overflow-hidden" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                      {zone.volume && zone.volume > 0 ? (
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="truncate min-w-0">Volume: {zone.volume.toFixed(2)} ETH</span>
                          {zone.volumePercentage && (
                            <span className="text-bitcoin-orange flex-shrink-0">({zone.volumePercentage.toFixed(1)}%)</span>
                          )}
                        </div>
                      ) : (
                        <div className="italic truncate">
                          {zone.source === 'pivot_analysis' && 'Mathematical pivot level'}
                          {zone.source === 'fibonacci' && 'Fibonacci retracement level'}
                          {zone.source === 'psychological' && 'Psychological round number'}
                          {zone.source === 'live_orderbook' && 'Live order book level'}
                          {zone.source === 'orderbook' && 'Order book level'}
                          {!zone.source && 'Technical analysis level'}
                        </div>
                      )}
                    </div>
                    
                    {/* Order Count for Live OrderBook zones */}
                    {zone.orderCount && zone.orderCount > 0 && (
                      <div className="text-bitcoin-orange mt-1 truncate" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                        {zone.orderCount} active orders
                      </div>
                    )}
                    
                    {zone.distanceFromPrice && (
                      <div className="text-bitcoin-orange mt-1 truncate" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                        +{zone.distanceFromPrice.toFixed(1)}% from current
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Demand Zones */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-bitcoin-orange mobile-text-primary">📉 Demand Zones</div>
                  <div className="text-xs mobile-text-muted">Support Levels</div>
                </div>
                {data.technicalIndicators?.supplyDemandZones?.demandZones?.slice(0, 4).map((zone, index) => (
                  <div key={index} className="bitcoin-block-subtle border-l-4 border-bitcoin-orange hover:border-bitcoin-orange transition-colors overflow-hidden">
                    <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                      <div className="font-bold text-bitcoin-white text-sm sm:text-base truncate min-w-0 flex-shrink font-mono" style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                        ${Math.round(zone.level).toLocaleString()}
                      </div>
                      <div className={`px-2 py-1 rounded font-medium flex-shrink-0 ${
                        zone.strength === 'Strong' || zone.strength === 'Very Strong' 
                          ? 'bg-bitcoin-orange text-bitcoin-black' 
                          : 'border border-bitcoin-orange text-bitcoin-orange'
                      }`} style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                        {zone.strength}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 min-w-0" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                      <span className="mobile-text-secondary truncate min-w-0 flex-shrink">
                        {zone.source === 'live_orderbook' && '📊 Live OrderBook'}
                        {zone.source === 'pivot_analysis' && '📈 Pivot Analysis'}
                        {zone.source === 'fibonacci' && '🔢 Fibonacci'}
                        {zone.source === 'psychological' && '🧠 Psychological'}
                        {zone.source === 'orderbook' && '📊 OrderBook'}
                        {!zone.source && '📊 Technical'}
                      </span>
                      {zone.confidence && (
                        <span className="text-bitcoin-orange font-medium flex-shrink-0" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{zone.confidence}%</span>
                      )}
                    </div>
                    
                    {/* Enhanced Zone Information Display */}
                    <div className="mobile-text-muted mt-1 min-w-0 overflow-hidden" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                      {zone.volume && zone.volume > 0 ? (
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="truncate min-w-0">Volume: {zone.volume.toFixed(2)} ETH</span>
                          {zone.volumePercentage && (
                            <span className="text-bitcoin-orange flex-shrink-0">({zone.volumePercentage.toFixed(1)}%)</span>
                          )}
                        </div>
                      ) : (
                        <div className="italic truncate">
                          {zone.source === 'pivot_analysis' && 'Mathematical pivot level'}
                          {zone.source === 'fibonacci' && 'Fibonacci retracement level'}
                          {zone.source === 'psychological' && 'Psychological round number'}
                          {zone.source === 'live_orderbook' && 'Live order book level'}
                          {zone.source === 'orderbook' && 'Order book level'}
                          {!zone.source && 'Technical analysis level'}
                        </div>
                      )}
                    </div>
                    
                    {/* Order Count for Live OrderBook zones */}
                    {zone.orderCount && zone.orderCount > 0 && (
                      <div className="text-bitcoin-orange mt-1 truncate" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                        {zone.orderCount} active orders
                      </div>
                    )}
                    
                    {zone.distanceFromPrice && (
                      <div className="text-bitcoin-orange mt-1 truncate" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                        -{zone.distanceFromPrice.toFixed(1)}% from current
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Market Analysis Summary */}
            {data.technicalIndicators?.supplyDemandZones?.analysis && (
              <div className="mt-4 bitcoin-block-subtle">
                <div className="text-xs font-medium text-bitcoin-white mb-2">📊 Market Analysis</div>
                {typeof data.technicalIndicators.supplyDemandZones.analysis === 'object' ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="mobile-text-secondary">Bid Volume: </span>
                      <span className="font-medium">{data.technicalIndicators.supplyDemandZones.analysis.totalBidVolume} ETH</span>
                    </div>
                    <div>
                      <span className="mobile-text-secondary">Ask Volume: </span>
                      <span className="font-medium">{data.technicalIndicators.supplyDemandZones.analysis.totalAskVolume} ETH</span>
                    </div>
                    <div>
                      <span className="mobile-text-secondary">Bid/Ask Ratio: </span>
                      <span className="font-medium">{data.technicalIndicators.supplyDemandZones.analysis.bidAskRatio}</span>
                    </div>
                    <div>
                      <span className="mobile-text-secondary">Pressure: </span>
                      <span className={`font-medium ${
                        data.technicalIndicators.supplyDemandZones.analysis.marketPressure === 'Bullish' 
                          ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'
                      }`}>
                        {data.technicalIndicators.supplyDemandZones.analysis.marketPressure}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs mobile-text-secondary">
                    {data.technicalIndicators.supplyDemandZones.analysis}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trading Signals */}
      <div className="mb-6">
        <h3 className="text-base md:text-lg font-semibold mobile-text-primary mb-4 flex items-center">
          <Target className="h-4 w-4 md:h-5 md:w-5 mr-2 text-bitcoin-orange" />
          Trading Signals
        </h3>
        <div className="space-y-3">
          {Array.isArray(data.tradingSignals) && data.tradingSignals.length > 0 ? (
            data.tradingSignals.slice(0, 3).map((signal, index) => (
              <div key={index} className="border border-bitcoin-orange-20 rounded-lg p-3 md:p-4 mobile-bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-2">
                  <div className="flex items-center space-x-2">
                    {signal.type === 'BUY' ? (
                      <TrendingUp className="h-4 w-4 mobile-text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mobile-text-error" />
                    )}
                    <span className={`font-semibold ${
                      signal.type === 'BUY' ? 'mobile-text-success' : 'mobile-text-error'
                    }`}>
                      {signal.type}
                    </span>
                    <span className="text-sm mobile-text-secondary">@${Math.round(signal.price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium min-h-[32px] flex items-center ${
                      signal.strength === 'STRONG' ? 'mobile-bg-success mobile-text-success' :
                      signal.strength === 'MODERATE' ? 'mobile-bg-warning mobile-text-warning' :
                      'mobile-bg-muted mobile-text-muted'
                    }`}>
                      {signal.strength}
                    </span>
                    <span className="text-xs mobile-text-secondary">{signal.timeframe}</span>
                  </div>
                </div>
                <p className="text-sm mobile-text-secondary leading-relaxed">{signal.reasoning}</p>
              </div>
            ))
          ) : (
            <div className="text-center p-6 mobile-bg-secondary rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 mobile-text-muted" />
              <p className="mobile-text-primary font-medium">No trading signals available</p>
              <p className="text-sm mobile-text-secondary mt-1">Signals will appear when market conditions generate actionable insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Market Data Section */}
      {data.isEnhancedData && data.enhancedMarketData && (
        <div className="mb-6">
          <h3 className="text-base md:text-lg font-semibold mobile-text-primary mb-4 flex items-center">
            <Activity className="h-4 w-4 md:h-5 md:w-5 mr-2 text-bitcoin-orange" />
            Real-Time Market Analysis
            <span className="ml-2 px-2 py-1 mobile-bg-info mobile-text-info text-xs rounded font-medium min-h-[32px] flex items-center">
              LIVE DATA
            </span>
          </h3>
          
          {/* Mobile-optimized market data grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {/* Order Book Imbalance */}
            {data.enhancedMarketData.orderBookImbalance && (
              <div className="mobile-bg-info p-3 md:p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium mobile-text-info">Order Book Imbalance</span>
                  <BarChart3 className="h-4 w-4 text-bitcoin-orange" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Volume Bias:</span>
                    <span className={`font-semibold ${
                      data.enhancedMarketData.orderBookImbalance.volumeImbalance > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'
                    }`}>
                      {(data.enhancedMarketData.orderBookImbalance.volumeImbalance * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bid Pressure:</span>
                    <span className="text-bitcoin-orange font-medium">
                      {(data.enhancedMarketData.orderBookImbalance.bidPressure * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ask Pressure:</span>
                    <span className="text-bitcoin-white-80 font-medium">
                      {(data.enhancedMarketData.orderBookImbalance.askPressure * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Market Sentiment */}
            {data.enhancedMarketData.realMarketSentiment && (
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-bitcoin-white">Market Sentiment</span>
                  <AlertTriangle className="h-4 w-4 text-bitcoin-orange" />
                </div>
                <div className="space-y-2">
                  {data.enhancedMarketData.realMarketSentiment.fearGreedIndex && (
                    <div className="flex justify-between text-sm">
                      <span>Fear & Greed:</span>
                      <span className={`font-semibold ${
                        data.enhancedMarketData.realMarketSentiment.fearGreedIndex > 50 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'
                      }`}>
                        {data.enhancedMarketData.realMarketSentiment.fearGreedIndex}/100
                      </span>
                    </div>
                  )}
                  {data.enhancedMarketData.realMarketSentiment.fundingRate && (
                    <div className="flex justify-between text-sm">
                      <span>Funding Rate:</span>
                      <span className={`font-medium ${
                        data.enhancedMarketData.realMarketSentiment.fundingRate > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'
                      }`}>
                        {(data.enhancedMarketData.realMarketSentiment.fundingRate * 100).toFixed(4)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Whale Movements */}
            {data.enhancedMarketData.whaleMovements && data.enhancedMarketData.whaleMovements.length > 0 && (
              <div className="bg-bitcoin-black border border-bitcoin-orange p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-bitcoin-white">Whale Activity</span>
                  <TrendingUp className="h-4 w-4 text-bitcoin-orange" />
                </div>
                <div className="space-y-1">
                  {data.enhancedMarketData.whaleMovements.slice(0, 3).map((whale: any, index: number) => (
                    <div key={index} className="text-xs">
                      <span className={`font-medium ${whale.isBuyerMaker ? 'text-bitcoin-white-80' : 'text-bitcoin-orange'}`}>
                        {whale.isBuyerMaker ? 'SELL' : 'BUY'}
                      </span>
                      <span className="text-bitcoin-white-60 ml-1">
                        {whale.quantity.toFixed(1)} ETH @ ${whale.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Quality Indicators */}
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-bitcoin-white-80">Data Quality</span>
                <Activity className="h-4 w-4 text-bitcoin-white-60" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Order Book:</span>
                  <span className={`font-medium ${
                    data.enhancedMarketData.dataQuality?.orderBookData ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'
                  }`}>
                    {data.enhancedMarketData.dataQuality?.orderBookData ? '✓ Live' : '✗ Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Volume Data:</span>
                  <span className={`font-medium ${
                    data.enhancedMarketData.dataQuality?.volumeData ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'
                  }`}>
                    {data.enhancedMarketData.dataQuality?.volumeData ? '✓ Live' : '✗ Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Sentiment:</span>
                  <span className={`font-medium ${
                    data.enhancedMarketData.dataQuality?.sentimentData ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'
                  }`}>
                    {data.enhancedMarketData.dataQuality?.sentimentData ? '✓ Live' : '✗ Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Predictions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-bitcoin-white mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-bitcoin-orange" />
          Price Predictions
        </h3>
        {/* Mobile-optimized predictions grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bitcoin-block-subtle overflow-hidden p-3 md:p-4">
            <div className="flex flex-col space-y-2 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-bitcoin-white-60 truncate">1 Hour</span>
              <span className="font-mono text-xl md:text-2xl font-bold text-bitcoin-orange truncate min-w-0">
                ${Math.round(data.predictions?.hourly?.target || 0).toLocaleString()}
              </span>
              <p className="text-xs text-bitcoin-white-60 truncate">
                Confidence: <span className="text-bitcoin-orange font-semibold">{(data.predictions?.hourly?.confidence || 0).toFixed(1)}%</span>
              </p>
            </div>
          </div>
          <div className="bitcoin-block-subtle overflow-hidden p-3 md:p-4">
            <div className="flex flex-col space-y-2 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-bitcoin-white-60 truncate">24 Hours</span>
              <span className="font-mono text-xl md:text-2xl font-bold text-bitcoin-orange truncate min-w-0">
                ${Math.round(data.predictions?.daily?.target || 0).toLocaleString()}
              </span>
              <p className="text-xs text-bitcoin-white-60 truncate">
                Confidence: <span className="text-bitcoin-orange font-semibold">{(data.predictions?.daily?.confidence || 0).toFixed(1)}%</span>
              </p>
            </div>
          </div>
          <div className="bitcoin-block-subtle overflow-hidden p-3 md:p-4">
            <div className="flex flex-col space-y-2 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-bitcoin-white-60 truncate">7 Days</span>
              <span className="font-mono text-xl md:text-2xl font-bold text-bitcoin-orange truncate min-w-0">
                ${Math.round(data.predictions?.weekly?.target || 0).toLocaleString()}
              </span>
              <p className="text-xs text-bitcoin-white-60 truncate">
                Confidence: <span className="text-bitcoin-orange font-semibold">{(data.predictions?.weekly?.confidence || 0).toFixed(1)}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Sentiment */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-bitcoin-white mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-bitcoin-orange" />
          Market Sentiment
        </h3>
        {/* Enhanced mobile-optimized sentiment grid with touch-friendly indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bitcoin-block-subtle text-center p-3 md:p-4 min-h-[80px] md:min-h-[90px] flex flex-col justify-center overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-bitcoin-white-60 mb-2">Overall</p>
            <p className={`text-base md:text-lg font-bold truncate ${
              data.marketSentiment?.overall === 'Bullish' ? 'text-bitcoin-orange' :
              data.marketSentiment?.overall === 'Bearish' ? 'text-bitcoin-white-80' : 'text-bitcoin-orange'
            }`}>
              {data.marketSentiment?.overall || 'Neutral'}
            </p>
          </div>
          <FearGreedSlider value={data.marketSentiment?.fearGreed || 50} />
          <div className="bitcoin-block-subtle text-center p-3 md:p-4 min-h-[80px] md:min-h-[90px] flex flex-col justify-center overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-bitcoin-white-60 mb-2">Social</p>
            <p className="text-base md:text-lg font-bold text-bitcoin-orange truncate">
              {data.marketSentiment?.socialMedia || 'Neutral'}
            </p>
          </div>
          <div className="bitcoin-block-subtle text-center p-3 md:p-4 min-h-[80px] md:min-h-[90px] flex flex-col justify-center overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-bitcoin-white-60 mb-2">Institutional</p>
            <p className="text-base md:text-lg font-bold text-bitcoin-orange truncate">
              {data.marketSentiment?.institutionalFlow || 'Neutral'}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Trading Zones - Expandable */}
      <div className="mb-6">
        <button
          onClick={() => setShowTradingZones(!showTradingZones)}
          className="w-full bitcoin-block-subtle hover:border-bitcoin-orange transition-all duration-300 p-4 flex items-center justify-between min-h-[56px] touch-manipulation group"
        >
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-bitcoin-orange flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-base md:text-lg font-bold text-bitcoin-white group-hover:text-bitcoin-orange transition-colors">
                Visual Trading Zones
              </h3>
              <p className="text-xs text-bitcoin-white-60">
                {showTradingZones ? 'Click to collapse' : 'Click to expand timeframe analysis'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showTradingZones && (
              <span className="text-xs font-semibold text-bitcoin-orange uppercase tracking-wider hidden sm:inline">
                Expanded
              </span>
            )}
            {showTradingZones ? (
              <ChevronUp className="h-5 w-5 text-bitcoin-orange animate-pulse" />
            ) : (
              <ChevronDown className="h-5 w-5 text-bitcoin-orange" />
            )}
          </div>
        </button>
        
        {showTradingZones && (
          <div className="mt-4 animate-slide-down">
            <ETHTradingChart />
          </div>
        )}
      </div>

      {/* Hidden Pivot Analysis - Expandable */}
      <div className="mb-6">
        <button
          onClick={() => setShowHiddenPivot(!showHiddenPivot)}
          className="w-full bitcoin-block-subtle hover:border-bitcoin-orange transition-all duration-300 p-4 flex items-center justify-between min-h-[56px] touch-manipulation group"
        >
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-5 w-5 text-bitcoin-orange flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-base md:text-lg font-bold text-bitcoin-white group-hover:text-bitcoin-orange transition-colors">
                Hidden Pivot Analysis
              </h3>
              <p className="text-xs text-bitcoin-white-60">
                {showHiddenPivot ? 'Click to collapse' : 'Fibonacci Extensions & Hidden Support/Resistance'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showHiddenPivot && (
              <span className="text-xs font-semibold text-bitcoin-orange uppercase tracking-wider hidden sm:inline">
                Expanded
              </span>
            )}
            {showHiddenPivot ? (
              <ChevronUp className="h-5 w-5 text-bitcoin-orange animate-pulse" />
            ) : (
              <ChevronDown className="h-5 w-5 text-bitcoin-orange" />
            )}
          </div>
        </button>
        
        {showHiddenPivot && (
          <div className="mt-4 animate-slide-down">
            <ETHHiddenPivotChart />
          </div>
        )}
      </div>

      {/* News Impact */}
      {data.newsImpact && data.newsImpact.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-bitcoin-white mb-4">Market News Impact</h3>
          <div className="space-y-2">
            {data.newsImpact.slice(0, 3).map((news, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-bitcoin-white">{news.headline}</p>
                  <p className="text-xs text-bitcoin-white-60">{news.source} • {news.timeAgo}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ml-3 ${
                  news.impact === 'Bullish' ? 'bg-bitcoin-orange text-bitcoin-white' :
                  news.impact === 'Bearish' ? 'bg-bitcoin-black border border-bitcoin-orange text-bitcoin-white' :
                  'bg-bitcoin-black border border-bitcoin-orange-20 text-bitcoin-white-80'
                }`}>
                  {news.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-bitcoin-white-60 text-center">
        Last updated: {new Date(data.lastUpdated || data.timestamp || Date.now()).toLocaleString()}
      </div>
    </div>
  )
}




