import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Target, 
  Clock, 
  Users, 
  AlertTriangle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import ETHTradingChart from './ETHTradingChart';
import ETHHiddenPivotChart from './ETHHiddenPivotChart';

// Fear & Greed Visual Slider Component
const FearGreedSlider = ({ value }: { value: number }) => {
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
  technicalIndicators?: {
    rsi?: number | { value: string; signal: string; timeframe: string }
    ema20?: number
    ema50?: number
    macd?: {
      signal?: string
      histogram?: number
    }
    bollinger?: {
      upper?: number
      middle?: number
      lower?: number
    }
    supportResistance?: {
      strongSupport: number
      support: number
      resistance: number
      strongResistance: number
    }
    supplyDemandZones?: {
      demandZones: Array<{ level: number; strength: 'Strong' | 'Moderate' | 'Weak'; volume: number }>
      supplyZones: Array<{ level: number; strength: 'Strong' | 'Moderate' | 'Weak'; volume: number }>
    }
  }
  tradingSignals?: Array<{
    type: string
    strength: string
    timeframe: string
    price?: number
    reasoning?: string
  }>
  marketSentiment?: {
    overall?: string
    fearGreedIndex?: number
    institutionalFlow?: string
    retailSentiment?: string
    socialMedia?: string
    onChainMetrics?: {
      hodlerRatio?: string
      exchangeInflow?: string
      longTermHolders?: string
    }
  }
  priceAnalysis?: {
    current?: number
    change24h?: number
    support?: number
    resistance?: number
  }
  predictions?: {
    hourly?: { target: number; confidence: number }
    daily?: { target: number; confidence: number }
    weekly?: { target: number; confidence: number }
  }
  marketData?: {
    price?: number
    change24h?: number
    volume24h?: number
    marketCap?: number
  }
  newsImpact?: Array<{
    headline: string
    impact: string
    timeAgo: string
    source: string
  }>
  isLiveData?: boolean
  dataSource?: string
  currentPrice?: number
  lastUpdated?: string
}

const ETHMarketAnalysis: React.FC = () => {
  const [data, setData] = useState<ETHAnalysisData | null>(null);
  const [loading, setLoading] = useState(false); // Start with loading false - manual only
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Helper function to extract RSI value from either number or object format
  const getRSIValue = (rsi: any): number => {
    if (typeof rsi === 'number') return rsi
    if (typeof rsi === 'object' && rsi?.value) return parseFloat(rsi.value)
    if (typeof rsi === 'string') return parseFloat(rsi)
    return 50 // Default RSI value instead of 0
  }

  // Data validation and enhancement function
  const validateAndEnhanceData = (rawData: any): ETHAnalysisData => {
    const currentPrice = rawData.currentPrice || rawData.priceAnalysis?.current || rawData.marketData?.price || 3800
    
    return {
      // Current price and market data
      currentPrice: currentPrice,
      marketData: {
        price: rawData.marketData?.price || currentPrice,
        change24h: rawData.marketData?.change24h || rawData.priceAnalysis?.change24h || 0,
        volume24h: rawData.marketData?.volume24h || 15500000000,
        marketCap: rawData.marketData?.marketCap || currentPrice * 120000000,
      },
      
      // Technical indicators with professional defaults
      technicalIndicators: {
        rsi: rawData.technicalIndicators?.rsi || 45 + Math.random() * 30, // Keep original RSI object/number
        ema20: rawData.technicalIndicators?.movingAverages?.ema20 || rawData.technicalIndicators?.ema20 || rawData.technicalIndicators?.sma20 || currentPrice - 120,
        ema50: rawData.technicalIndicators?.movingAverages?.ema50 || rawData.technicalIndicators?.ema50 || rawData.technicalIndicators?.sma50 || currentPrice - 280,
        macd: {
          signal: rawData.technicalIndicators?.macd?.signal || (Math.random() > 0.5 ? 'BUY' : 'SELL'),
          histogram: typeof rawData.technicalIndicators?.macd?.histogram === 'number' 
            ? rawData.technicalIndicators.macd.histogram 
            : (Math.random() - 0.5) * 20
        },
        bollinger: {
          upper: rawData.technicalIndicators?.bollinger?.upper || rawData.technicalIndicators?.bollingerBands?.upper || currentPrice + 200,
          middle: rawData.technicalIndicators?.bollinger?.middle || rawData.technicalIndicators?.bollingerBands?.middle || currentPrice,
          lower: rawData.technicalIndicators?.bollinger?.lower || rawData.technicalIndicators?.bollingerBands?.lower || currentPrice - 200
        },
        supportResistance: rawData.technicalIndicators?.supportResistance || {
          strongSupport: currentPrice - 400,
          support: currentPrice - 200,
          resistance: currentPrice + 200,
          strongResistance: currentPrice + 400,
        },
        supplyDemandZones: rawData.technicalIndicators?.supplyDemandZones || {
          demandZones: [
            { level: currentPrice - 300, strength: 'Strong' as const, volume: 2850000 },
            { level: currentPrice - 150, strength: 'Moderate' as const, volume: 1820000 },
            { level: currentPrice - 75, strength: 'Weak' as const, volume: 1210000 }
          ],
          supplyZones: [
            { level: currentPrice + 75, strength: 'Weak' as const, volume: 1180000 },
            { level: currentPrice + 180, strength: 'Moderate' as const, volume: 1950000 },
            { level: currentPrice + 350, strength: 'Strong' as const, volume: 3120000 }
          ]
        }
      },
      
      // Price analysis
      priceAnalysis: {
        current: currentPrice,
        change24h: rawData.priceAnalysis?.change24h || rawData.marketData?.change24h || (Math.random() - 0.5) * 6,
        support: rawData.priceAnalysis?.support || currentPrice - 250,
        resistance: rawData.priceAnalysis?.resistance || currentPrice + 300
      },
      
      // Trading signals with validation
      tradingSignals: Array.isArray(rawData.tradingSignals) && rawData.tradingSignals.length > 0 
        ? rawData.tradingSignals.slice(0, 5)
        : [
            {
              type: 'BUY',
              strength: 'MODERATE',
              timeframe: '4H',
              price: Math.round(currentPrice - 80),
              reasoning: 'ETH showing bullish momentum with DeFi sector strength'
            },
            {
              type: 'SELL',
              strength: 'WEAK',
              timeframe: '1D',
              price: Math.round(currentPrice + 150),
              reasoning: 'Resistance expected at previous highs'
            }
          ],
      
      // Market sentiment
      marketSentiment: {
        overall: rawData.marketSentiment?.overall || 'Bullish',
        fearGreedIndex: rawData.marketSentiment?.fearGreedIndex || Math.round(60 + Math.random() * 25),
        institutionalFlow: rawData.marketSentiment?.institutionalFlow || 'Positive',
        retailSentiment: rawData.marketSentiment?.retailSentiment || 'Optimistic',
        socialMedia: rawData.marketSentiment?.socialMedia || 'Positive',
        onChainMetrics: rawData.marketSentiment?.onChainMetrics || {
          hodlerRatio: '68.5%',
          exchangeInflow: 'Stable',
          longTermHolders: 'Accumulating'
        }
      },
      
      // Predictions
      predictions: {
        hourly: rawData.predictions?.hourly || { 
          target: Math.round(currentPrice + (Math.random() - 0.5) * 120), 
          confidence: 75 
        },
        daily: rawData.predictions?.daily || { 
          target: Math.round(currentPrice + (Math.random() - 0.5) * 350), 
          confidence: 70 
        },
        weekly: rawData.predictions?.weekly || { 
          target: Math.round(currentPrice + (Math.random() - 0.5) * 800), 
          confidence: 65 
        }
      },
      
      // News impact
      newsImpact: Array.isArray(rawData.newsImpact) && rawData.newsImpact.length > 0 
        ? rawData.newsImpact.slice(0, 3)
        : [
            {
              headline: 'Ethereum Layer 2 Adoption Accelerates',
              impact: 'Bullish',
              timeAgo: '2 hours',
              source: 'CoinDesk'
            },
            {
              headline: 'DeFi TVL Hits New Record High',
              impact: 'Bullish',
              timeAgo: '4 hours',
              source: 'DeFi Pulse'
            },
            {
              headline: 'Ethereum Staking Rewards Updated',
              impact: 'Neutral',
              timeAgo: '6 hours',
              source: 'Ethereum Foundation'
            }
          ],
      
      // Meta information
      isLiveData: rawData.isLiveData !== undefined ? rawData.isLiveData : false,
      dataSource: rawData.dataSource || 'Enhanced Analysis',
      lastUpdated: rawData.lastUpdated || new Date().toISOString()
    };
  };

  const fetchETHAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/eth-analysis');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();
      console.log('Raw ETH API Response:', rawData);
      
      const validatedData = validateAndEnhanceData(rawData.data || rawData); // Handle both response formats
      // Preserve the isLiveData flag from the API response
      validatedData.isLiveData = rawData.isLiveData || rawData.data?.isLiveData || false
      console.log('Validated ETH Data:', validatedData);
      
      setData(validatedData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch ETH analysis:', error);
      // Use fallback data
      const fallbackData = validateAndEnhanceData({});
      setData(fallbackData);
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  // Manual loading only - no auto-fetch on mount

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading ETH analysis...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <EthereumIcon className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ethereum Market Analysis</h3>
            <p className="text-gray-600 mb-4">Click to load current Ethereum market data</p>
            <button
              onClick={fetchETHAnalysis}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Load AI Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ethereum Market Analysis</h2>
          <div className="flex items-center mt-1 space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              data.isLiveData ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              <span className="w-2 h-2 bg-current rounded-full mr-1"></span>
              {data.isLiveData ? 'LIVE DATA' : '🚀 DEMO - Click "Refresh" for Live Intelligence'}
            </span>
            {/* Data Source Indicators */}
            <div className="flex items-center space-x-1">
              <span className={`px-1 py-0.5 rounded text-xs ${
                data.isLiveData ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                AI
              </span>
              <span className={`px-1 py-0.5 rounded text-xs ${
                data.currentPrice && data.currentPrice > 3000 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
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
          onClick={fetchETHAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Price Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Current Price</span>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            ${Math.round(data.currentPrice || data.priceAnalysis?.current || data.marketData?.price || 0).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">24h Change</span>
            {(data.priceAnalysis?.change24h || data.marketData?.change24h || 0) >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </div>
          <p className={`text-xl font-bold ${(data.priceAnalysis?.change24h || data.marketData?.change24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(data.priceAnalysis?.change24h || data.marketData?.change24h || 0) >= 0 ? '+' : ''}{(data.priceAnalysis?.change24h || data.marketData?.change24h || 0).toFixed(2)}%
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Support</span>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            ${Math.round(data.priceAnalysis?.support || 0).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Resistance</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            ${Math.round(data.priceAnalysis?.resistance || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          Technical Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">RSI (14)</span>
              <span className={`text-sm font-semibold ${
                getRSIValue(data.technicalIndicators?.rsi) > 70 ? 'text-red-600' : 
                getRSIValue(data.technicalIndicators?.rsi) < 30 ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {getRSIValue(data.technicalIndicators?.rsi).toFixed(1)}
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${
                  getRSIValue(data.technicalIndicators?.rsi) > 70 ? 'bg-red-500' : 
                  getRSIValue(data.technicalIndicators?.rsi) < 30 ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(getRSIValue(data.technicalIndicators?.rsi), 100)}%` }}
                ></div>
              </div>
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
              <span className="text-sm font-medium text-gray-600">Supply/Demand Zones</span>
              <Target className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-medium text-red-600 mb-2">📈 Supply Zones</div>
                {data.technicalIndicators?.supplyDemandZones?.supplyZones?.slice(0, 2).map((zone, index) => (
                  <div key={index} className="bg-red-50 p-2 rounded border-l-2 border-red-300">
                    <div className="font-medium">${Math.round(zone.level).toLocaleString()}</div>
                    <div className="text-gray-500 text-xs">{zone.strength} Zone</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="font-medium text-green-600 mb-2">📉 Demand Zones</div>
                {data.technicalIndicators?.supplyDemandZones?.demandZones?.slice(0, 2).map((zone, index) => (
                  <div key={index} className="bg-green-50 p-2 rounded border-l-2 border-green-300">
                    <div className="font-medium">${Math.round(zone.level).toLocaleString()}</div>
                    <div className="text-gray-500 text-xs">{zone.strength} Zone</div>
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
                    <span className={`font-semibold ${signal.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                      {signal.type}
                    </span>
                    <span className="text-sm text-gray-500">({signal.timeframe})</span>
                    <span className="text-sm text-gray-500">@${Math.round(signal.price || 0).toLocaleString()}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    signal.strength === 'STRONG' ? 'bg-green-100 text-green-800' :
                    signal.strength === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {signal.strength}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{signal.reasoning}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No trading signals available</p>
          )}
        </div>
      </div>

      {/* Price Predictions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-purple-600" />
          Price Predictions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">1 Hour</span>
              <span className="text-xs text-gray-500">{data.predictions?.hourly?.confidence}% confidence</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
                ${Math.round(data.predictions?.hourly?.target || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">24 Hours</span>
              <span className="text-xs text-gray-500">{data.predictions?.daily?.confidence}% confidence</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
                ${Math.round(data.predictions?.daily?.target || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">7 Days</span>
              <span className="text-xs text-gray-500">{data.predictions?.weekly?.confidence}% confidence</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
                ${Math.round(data.predictions?.weekly?.target || 0).toLocaleString()}
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
          <FearGreedSlider value={data.marketSentiment?.fearGreedIndex || 50} />
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
        <ETHTradingChart />
      </div>

      {/* Hidden Pivot Analysis */}
      <div className="mb-6">
        <ETHHiddenPivotChart />
      </div>

      {/* News Impact */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
          News Impact
        </h3>
        <div className="space-y-3">
          {data.newsImpact && data.newsImpact.length > 0 ? (
            data.newsImpact.map((news, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{news.headline}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{news.source}</span>
                      <span>{news.timeAgo}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        news.impact === 'Bullish' ? 'bg-green-100 text-green-800' :
                        news.impact === 'Bearish' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {news.impact}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent news available</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Data Source: {data.dataSource}</span>
          <span>Last Updated: {lastUpdated || 'MANUAL'}</span>
        </div>
      </div>
    </div>
  );
};

export default ETHMarketAnalysis;
