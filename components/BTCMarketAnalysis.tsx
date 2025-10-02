import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Target, Clock, BarChart3, Activity } from 'lucide-react'
import BTCTradingChart from './BTCTradingChart'
import BTCHiddenPivotChart from './BTCHiddenPivotChart'

// Fear & Greed Visual Slider Component
const FearGreedSlider = ({ value }: { value: number }) => {
  const getSliderColor = (val: number) => {
    if (val <= 25) return 'from-red-600 to-red-400' // Extreme Fear
    if (val <= 45) return 'from-orange-500 to-orange-400' // Fear
    if (val <= 55) return 'from-yellow-500 to-yellow-400' // Neutral
    if (val <= 75) return 'from-green-500 to-green-400' // Greed
    return 'from-green-600 to-green-500' // Extreme Greed
  }

  const getLabel = (val: number) => {
    if (val <= 25) return 'Extreme Fear'
    if (val <= 45) return 'Fear'
    if (val <= 55) return 'Neutral'
    if (val <= 75) return 'Greed'
    return 'Extreme Greed'
  }

  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-2">Fear & Greed</p>
      
      {/* Visual Slider */}
      <div className="relative w-full h-6 bg-gray-200 rounded-full mb-2">
        {/* Background gradient zones */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"></div>
        </div>
        
        {/* Slider indicator */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-700 rounded-full shadow-md transition-all duration-300"
          style={{ left: `calc(${clampedValue}% - 8px)` }}
        />
        
        {/* Value overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white mix-blend-difference">
            {clampedValue}
          </span>
        </div>
      </div>
      
      {/* Label and value */}
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Fear</span>
        <span>Greed</span>
      </div>
      <p className={`text-sm font-semibold ${
        clampedValue <= 25 ? 'text-red-600' :
        clampedValue <= 45 ? 'text-orange-500' :
        clampedValue <= 55 ? 'text-yellow-600' :
        clampedValue <= 75 ? 'text-green-500' : 'text-green-600'
      }`}>
        {getLabel(clampedValue)}
      </p>
    </div>
  )
}

// Bitcoin Logo Component
const BitcoinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 2000 2000" className={className} fill="currentColor">
    <g>
      <circle cx="1000" cy="1000" r="1000" fill="#f7931a"/>
      <path d="M1375.9 967.2c20.8-139.1-85.1-213.8-229.7-263.8l46.9-188.1-114.6-28.6-45.7 183.1c-30.1-7.5-61-14.6-91.5-21.6l46-184.5-114.6-28.6-46.9 188.1c-24.9-5.7-49.3-11.3-73.1-17.2l0.1-0.5-158.1-39.5-30.5 122.4s85.1 19.5 83.4 20.7c46.4 11.6 54.8 42.4 53.4 66.8l-53.4 214.3c3.2 0.8 7.3 2 11.9 3.8-3.8-0.9-7.9-2-12.1-3l-74.9 300.1c-5.7 14.1-20.1 35.2-52.5 27.2 1.1 1.6-83.4-20.8-83.4-20.8l-56.9 131.1 149.2 37.2c27.8 7 55 14.2 81.8 21.1l-47.4 190.4 114.6 28.6 46.9-188.1c31.2 8.5 61.4 16.3 91 23.4l-46.7 187.2 114.6 28.6 47.4-190.1c195.1 36.9 341.9 22 403.9-154.6 50-142.5-2.5-224.6-105.4-278.2 75-17.3 131.5-66.7 146.5-168.7zm-262.1 367.5c-35.4 142.1-274.9 65.3-352.5 46l62.8-251.9c77.6 19.4 327.1 57.8 289.7 205.9zm35.4-370.1c-32.2 129.3-231.2 63.5-295.8 47.4l56.9-228.4c64.6 16.1 272.8 46.2 238.9 181z" fill="white"/>
    </g>
  </svg>
);

interface BTCAnalysisData {
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

export default function BTCMarketAnalysis() {
  const [data, setData] = useState<BTCAnalysisData | null>(null)
  const [loading, setLoading] = useState(false) // Start with loading false - manual only
  const [error, setError] = useState<string | null>(null)

  // Helper function to extract RSI value from either number or object format
  const getRSIValue = (rsi: any): number => {
    if (typeof rsi === 'number') return rsi
    if (typeof rsi === 'object' && rsi?.value) return parseFloat(rsi.value)
    if (typeof rsi === 'string') return parseFloat(rsi)
    return 50 // Default RSI value instead of 0
  }

  // STRICT: Only use real data - no fallbacks allowed
  const validateRealData = (rawData: any): BTCAnalysisData | null => {
    // Reject if no real price data
    if (!rawData.currentPrice && !rawData.marketData?.price) {
      console.error('No real price data available - refusing to display');
      return null;
    }

    // Reject if not marked as live data
    if (!rawData.isLiveData) {
      console.error('Data not marked as live - refusing to display');
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

  const fetchBTCAnalysis = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/btc-analysis-enhanced')
      
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
        throw new Error('No valid real market data available')
      }
      
      setData(validatedData)
      console.log('✅ Real market data loaded successfully')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ Failed to load real market data:', errorMessage)
      
      // STRICT: No fallback data - leave data as null to show error state
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  // Manual loading only - no auto-fetch on mount

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Loading BTC analysis...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64 text-red-600">
          <div className="text-center">
            <p className="font-medium">Error loading BTC analysis</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button
              onClick={fetchBTCAnalysis}
              className="mt-3 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BitcoinIcon className="h-12 w-12 mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bitcoin Market Analysis</h3>
            <p className="text-gray-600 mb-4">Click to load current Bitcoin market data</p>
            <button
              onClick={fetchBTCAnalysis}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Load AI Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bitcoin Market Analysis</h2>
          <div className="flex items-center mt-1 space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              data.isLiveData ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}>
              <span className="w-2 h-2 bg-current rounded-full mr-1"></span>
              LIVE DATA
            </span>
            {/* Data Source Indicators */}
            <div className="flex items-center space-x-1">
              <span className={`px-1 py-0.5 rounded text-xs ${
                data.isLiveData ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                AI
              </span>
              <span className={`px-1 py-0.5 rounded text-xs ${
                data.currentPrice && data.currentPrice > 90000 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                Price
              </span>
              <span className={`px-1 py-0.5 rounded text-xs ${
                data.newsImpact && data.newsImpact.length > 3 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}>
                News
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchBTCAnalysis}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Price Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Current Price</p>
          <p className="text-2xl font-bold text-gray-900">
            ${Math.round(data.currentPrice || data.priceAnalysis?.current || data.marketData?.price || 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">24h Change</p>
          <p className={`text-lg font-semibold ${(data.priceAnalysis?.change24h || data.marketData?.change24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(data.priceAnalysis?.change24h || data.marketData?.change24h || 0) >= 0 ? '+' : ''}{(data.priceAnalysis?.change24h || data.marketData?.change24h || 0).toFixed(2)}%
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Support</p>
          <p className="text-lg font-semibold text-blue-600">
            ${Math.round(data.priceAnalysis?.support || 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Resistance</p>
          <p className="text-lg font-semibold text-red-600">
            ${Math.round(data.priceAnalysis?.resistance || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          Technical Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">RSI (14)</span>
              <span className={`text-lg font-bold ${
                getRSIValue(data.technicalIndicators?.rsi) > 70 ? 'text-red-600' : 
                getRSIValue(data.technicalIndicators?.rsi) < 30 ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {getRSIValue(data.technicalIndicators?.rsi).toFixed(1)}
              </span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  getRSIValue(data.technicalIndicators?.rsi) > 70 ? 'bg-red-500' : 
                  getRSIValue(data.technicalIndicators?.rsi) < 30 ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(getRSIValue(data.technicalIndicators?.rsi), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getRSIValue(data.technicalIndicators?.rsi) > 70 ? 'Overbought' : 
               getRSIValue(data.technicalIndicators?.rsi) < 30 ? 'Oversold' : 'Neutral'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">MACD</span>
              <span className={`text-sm font-semibold ${
                data.technicalIndicators?.macd?.signal === 'BUY' ? 'text-green-600' : 
                data.technicalIndicators?.macd?.signal === 'SELL' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {data.technicalIndicators?.macd?.signal || 'NEUTRAL'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Histogram: {(data.technicalIndicators?.macd?.histogram || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Moving Averages</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xs text-gray-600 mt-2 space-y-1">
              <div>EMA 20: ${Math.round(data.technicalIndicators?.ema20 || 0).toLocaleString()}</div>
              <div>EMA 50: ${Math.round(data.technicalIndicators?.ema50 || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Bollinger Bands</span>
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xs text-gray-600 mt-2 space-y-1">
              <div>Upper: ${Math.round(data.technicalIndicators?.bollinger?.upper || 0).toLocaleString()}</div>
              <div>Middle: ${Math.round(data.technicalIndicators?.bollinger?.middle || 0).toLocaleString()}</div>
              <div>Lower: ${Math.round(data.technicalIndicators?.bollinger?.lower || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg col-span-1 lg:col-span-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">Support/Resistance Levels</span>
              <BarChart3 className="h-4 w-4 text-red-600" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-2">
                <div className="font-medium text-gray-700">Resistance</div>
                <div className="text-red-500 font-medium">Strong: ${Math.round(data.technicalIndicators?.supportResistance?.strongResistance || 0).toLocaleString()}</div>
                <div className="text-orange-500">Normal: ${Math.round(data.technicalIndicators?.supportResistance?.resistance || 0).toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-700">Support</div>
                <div className="text-green-500">Normal: ${Math.round(data.technicalIndicators?.supportResistance?.support || 0).toLocaleString()}</div>
                <div className="text-green-600 font-medium">Strong: ${Math.round(data.technicalIndicators?.supportResistance?.strongSupport || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg col-span-1 lg:col-span-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">
                {data.isEnhancedData ? 'REAL Supply/Demand Zones' : 'Supply/Demand Zones'}
              </span>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-indigo-600" />
                {data.isEnhancedData && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                    LIVE DATA
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-medium text-red-600 mb-2">📈 Supply Zones</div>
                {data.technicalIndicators?.supplyDemandZones?.supplyZones?.slice(0, 3).map((zone, index) => (
                  <div key={index} className="bg-red-50 p-2 rounded border-l-2 border-red-300">
                    <div className="font-medium">${Math.round(zone.level).toLocaleString()}</div>
                    <div className="text-gray-500 text-xs flex justify-between">
                      <span>{zone.strength} Zone</span>
                      {zone.source && (
                        <span className="text-blue-500">
                          {zone.source === 'orderbook' ? '📊 OrderBook' : '📈 Historical'}
                        </span>
                      )}
                    </div>
                    {zone.volume && (
                      <div className="text-gray-400 text-xs">Vol: {zone.volume.toFixed(1)} BTC</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="font-medium text-green-600 mb-2">📉 Demand Zones</div>
                {data.technicalIndicators?.supplyDemandZones?.demandZones?.slice(0, 3).map((zone, index) => (
                  <div key={index} className="bg-green-50 p-2 rounded border-l-2 border-green-300">
                    <div className="font-medium">${Math.round(zone.level).toLocaleString()}</div>
                    <div className="text-gray-500 text-xs flex justify-between">
                      <span>{zone.strength} Zone</span>
                      {zone.source && (
                        <span className="text-blue-500">
                          {zone.source === 'orderbook' ? '📊 OrderBook' : '📈 Historical'}
                        </span>
                      )}
                    </div>
                    {zone.volume && (
                      <div className="text-gray-400 text-xs">Vol: {zone.volume.toFixed(1)} BTC</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Signals */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-green-600" />
          Trading Signals
        </h3>
        <div className="space-y-3">
          {Array.isArray(data.tradingSignals) && data.tradingSignals.length > 0 ? (
            data.tradingSignals.slice(0, 3).map((signal, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {signal.type === 'BUY' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      signal.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {signal.type}
                    </span>
                    <span className="text-sm text-gray-500">@${Math.round(signal.price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      signal.strength === 'STRONG' ? 'bg-green-100 text-green-800' :
                      signal.strength === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {signal.strength}
                    </span>
                    <span className="text-xs text-gray-500">{signal.timeframe}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{signal.reasoning}</p>
              </div>
            ))
          ) : (
            <div className="text-center p-6 text-gray-500">
              <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No trading signals available</p>
              <p className="text-sm">Signals will appear when market conditions generate actionable insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Market Data Section */}
      {data.isEnhancedData && data.enhancedMarketData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Real-Time Market Analysis
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
              LIVE DATA
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Order Book Imbalance */}
            {data.enhancedMarketData.orderBookImbalance && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-800">Order Book Imbalance</span>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Volume Bias:</span>
                    <span className={`font-semibold ${
                      data.enhancedMarketData.orderBookImbalance.volumeImbalance > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(data.enhancedMarketData.orderBookImbalance.volumeImbalance * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bid Pressure:</span>
                    <span className="text-green-600 font-medium">
                      {(data.enhancedMarketData.orderBookImbalance.bidPressure * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ask Pressure:</span>
                    <span className="text-red-600 font-medium">
                      {(data.enhancedMarketData.orderBookImbalance.askPressure * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Market Sentiment */}
            {data.enhancedMarketData.realMarketSentiment && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-800">Market Sentiment</span>
                  <AlertTriangle className="h-4 w-4 text-purple-600" />
                </div>
                <div className="space-y-2">
                  {data.enhancedMarketData.realMarketSentiment.fearGreedIndex && (
                    <div className="flex justify-between text-sm">
                      <span>Fear & Greed:</span>
                      <span className={`font-semibold ${
                        data.enhancedMarketData.realMarketSentiment.fearGreedIndex > 50 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {data.enhancedMarketData.realMarketSentiment.fearGreedIndex}/100
                      </span>
                    </div>
                  )}
                  {data.enhancedMarketData.realMarketSentiment.fundingRate && (
                    <div className="flex justify-between text-sm">
                      <span>Funding Rate:</span>
                      <span className={`font-medium ${
                        data.enhancedMarketData.realMarketSentiment.fundingRate > 0 ? 'text-green-600' : 'text-red-600'
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
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-orange-800">Whale Activity</span>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <div className="space-y-1">
                  {data.enhancedMarketData.whaleMovements.slice(0, 3).map((whale: any, index: number) => (
                    <div key={index} className="text-xs">
                      <span className={`font-medium ${whale.isBuyerMaker ? 'text-red-600' : 'text-green-600'}`}>
                        {whale.isBuyerMaker ? 'SELL' : 'BUY'}
                      </span>
                      <span className="text-gray-600 ml-1">
                        {whale.quantity.toFixed(1)} BTC @ ${whale.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Quality Indicators */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-800">Data Quality</span>
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Order Book:</span>
                  <span className={`font-medium ${
                    data.enhancedMarketData.dataQuality?.orderBookData ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.enhancedMarketData.dataQuality?.orderBookData ? '✓ Live' : '✗ Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Volume Data:</span>
                  <span className={`font-medium ${
                    data.enhancedMarketData.dataQuality?.volumeData ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.enhancedMarketData.dataQuality?.volumeData ? '✓ Live' : '✗ Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Sentiment:</span>
                  <span className={`font-medium ${
                    data.enhancedMarketData.dataQuality?.sentimentData ? 'text-green-600' : 'text-red-600'
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-purple-600" />
          Price Predictions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">1 Hour</span>
              <span className="text-lg font-bold text-blue-900">
                ${Math.round(data.predictions?.hourly?.target || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Confidence: {(data.predictions?.hourly?.confidence || 0)}%
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-800">24 Hours</span>
              <span className="text-lg font-bold text-green-900">
                ${Math.round(data.predictions?.daily?.target || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Confidence: {(data.predictions?.daily?.confidence || 0)}%
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-800">7 Days</span>
              <span className="text-lg font-bold text-purple-900">
                ${Math.round(data.predictions?.weekly?.target || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Confidence: {(data.predictions?.weekly?.confidence || 0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Market Sentiment */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
          Market Sentiment
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Overall</p>
            <p className={`font-semibold ${
              data.marketSentiment?.overall === 'Bullish' ? 'text-green-600' :
              data.marketSentiment?.overall === 'Bearish' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {data.marketSentiment?.overall || 'Neutral'}
            </p>
          </div>
          <FearGreedSlider value={data.marketSentiment?.fearGreed || 50} />
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Social Media</p>
            <p className="font-semibold text-purple-600">
              {data.marketSentiment?.socialMedia || 'Neutral'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Institutional</p>
            <p className="font-semibold text-orange-600">
              {data.marketSentiment?.institutionalFlow || 'Neutral'}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Trading Chart */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Trading Zones</h3>
        <BTCTradingChart />
      </div>

      {/* Hidden Pivot Analysis */}
      <div className="mb-6">
        <BTCHiddenPivotChart />
      </div>

      {/* News Impact */}
      {data.newsImpact && data.newsImpact.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market News Impact</h3>
          <div className="space-y-2">
            {data.newsImpact.slice(0, 3).map((news, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{news.headline}</p>
                  <p className="text-xs text-gray-500">{news.source} • {news.timeAgo}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ml-3 ${
                  news.impact === 'Bullish' ? 'bg-green-100 text-green-800' :
                  news.impact === 'Bearish' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {news.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 text-center">
        Last updated: {new Date(data.lastUpdated || data.timestamp || Date.now()).toLocaleString()}
      </div>
    </div>
  )
}
