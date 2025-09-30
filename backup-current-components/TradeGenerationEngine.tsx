import { useState } from 'react'
import { TrendingUp, TrendingDown, Target, Shield, Brain, RefreshCw, AlertTriangle, DollarSign } from 'lucide-react'
import { useTradeGeneration } from '../hooks/useApiData'

export interface TradeSignal {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  stopLoss: number
  takeProfit: number
  riskRewardRatio: number
  confidence: number
  timeframe: string
  analysis: string
  reasoning: string
  technicalIndicators: {
    rsi: number
    macd: string
    sma20: number
    sma50: number
    support: number
    resistance: number
    bollinger: {
      upper: number
      lower: number
      middle: number
    }
  }
  marketConditions: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  expectedDuration: string
  timestamp: string
}

export default function TradeGenerationEngine() {
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH'>('BTC')
  const { data, loading, error, refetch } = useTradeGeneration(selectedCrypto)
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('4h')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const tradeSignal: TradeSignal | null = data as TradeSignal | null
  
  const getDirectionColor = (direction: string) => {
    return direction === 'LONG' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
  }
  
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const handlePasswordSubmit = () => {
    if (password === '123qwe') {
      setIsAuthenticated(true)
      setShowPasswordInput(false)
      setPassword('')
      setPasswordError('')
      refetch() // Proceed with trade generation
    } else {
      setPasswordError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  const handleGenerateClick = () => {
    if (isAuthenticated) {
      refetch()
    } else {
      setShowPasswordInput(true)
      setPasswordError('')
    }
  }

  const handleCryptoChange = (crypto: 'BTC' | 'ETH') => {
    setSelectedCrypto(crypto)
    // Auto-generate new signal if authenticated
    if (isAuthenticated && data) {
      // Slight delay to allow state update
      setTimeout(() => refetch(), 100)
    }
  }

  const handlePasswordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit()
    }
  }

  const handleUnlock = () => {
    setShowPasswordInput(true)
    setPasswordError('')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 border-2 md:border-4 border-black">
        <div className="flex items-center justify-center h-40 sm:h-64">
          <Brain className="h-8 w-8 sm:h-12 sm:w-12 animate-pulse text-black mr-3" />
          <div className="text-center">
            <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-black mx-auto mb-2" />
            <span className="text-gray-600 font-bold text-sm sm:text-base">
              Analyzing {selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'} markets...
            </span>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Processing with o1-preview step-by-step reasoning</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data && !loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 border-2 md:border-4 border-black">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 sm:p-3 bg-gray-100 rounded-lg border border-black sm:border-2">
              <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-black" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-black mb-2" style={{ fontFamily: 'Times, serif' }}>
            TRADE GENERATION ENGINE
          </h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Latest o1-preview reasoning model with step-by-step analysis across multiple timeframes
          </p>
          
          {/* Cryptocurrency Selection */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="flex bg-gray-100 p-1 rounded-lg border-2 border-black">
              <button
                onClick={() => handleCryptoChange('BTC')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-bold transition-colors border-2 ${
                  selectedCrypto === 'BTC'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                }`}
              >
                🟠 Bitcoin
              </button>
              <button
                onClick={() => handleCryptoChange('ETH')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-bold transition-colors border-2 ml-1 ${
                  selectedCrypto === 'ETH'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                }`}
              >
                🔵 Ethereum
              </button>
            </div>
          </div>
          
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto">
              {!showPasswordInput ? (
                <button 
                  onClick={handleUnlock}
                  className="bg-black text-white font-bold py-2 sm:py-3 px-4 sm:px-6 border-2 sm:border-4 border-black hover:bg-gray-800 transition-colors flex items-center mx-auto text-sm sm:text-base"
                  style={{ fontFamily: 'Times, serif' }}
                >
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  UNLOCK TRADE ENGINE
                </button>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-black transition-all duration-300">
                  <div className="mb-3">
                    <Shield className="h-6 w-6 mx-auto mb-2 text-black" />
                    <p className="text-sm font-bold text-black mb-2">Enter Access Password</p>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handlePasswordKeyPress}
                    placeholder="Password"
                    className="w-full p-2 border-2 border-black rounded mb-3 focus:outline-none focus:ring-2 focus:ring-gray-300 text-center"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-red-600 mb-3 text-sm">{passwordError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handlePasswordSubmit}
                      className="flex-1 py-2 bg-black text-white hover:bg-gray-800 rounded border-2 border-black font-bold text-sm"
                    >
                      Access
                    </button>
                    <button
                      onClick={() => setShowPasswordInput(false)}
                      className="flex-1 py-2 bg-white text-black hover:bg-gray-100 rounded border-2 border-black font-bold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={handleGenerateClick}
              className="bg-black text-white font-bold py-2 sm:py-3 px-4 sm:px-6 border-2 sm:border-4 border-black hover:bg-gray-800 transition-colors flex items-center mx-auto text-sm sm:text-base"
              style={{ fontFamily: 'Times, serif' }}
            >
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              GENERATE TRADE SIGNAL
            </button>
          )}
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 border-2 md:border-4 border-black">
        <div className="flex items-center justify-center h-32 sm:h-64 text-red-600">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mr-2" />
          <div className="text-center">
            <p className="font-bold text-black text-sm sm:text-base">Error generating trade signal</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{error}</p>
            <button 
              onClick={handleGenerateClick}
              className="mt-3 px-3 sm:px-4 py-2 bg-black text-white rounded border border-black sm:border-2 hover:bg-gray-800 transition-colors font-bold text-sm sm:text-base"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!tradeSignal) return null

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 border-2 md:border-4 border-black">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1 sm:p-2 bg-gray-100 rounded-lg border border-black sm:border-2">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-black" style={{ fontFamily: 'Times, serif' }}>
              Trade Generation Engine
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Latest o1-preview reasoning model for {selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'} signals
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs sm:text-sm text-gray-500">Generated</div>
          <div className="font-bold text-xs sm:text-sm">{formatDate(tradeSignal.timestamp)}</div>
          <button
            onClick={handleGenerateClick}
            className="mt-1 p-1 bg-black text-white hover:bg-gray-800 rounded border border-black sm:border-2"
            title="Generate new signal"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* Trade Signal Card */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-black sm:border-2 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Trade Details */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-black text-black" style={{ fontFamily: 'Times, serif' }}>
                {tradeSignal.symbol} Trade Signal
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold border border-black sm:border-2 ${getDirectionColor(tradeSignal.direction)}`}>
                  {tradeSignal.direction === 'LONG' ? '📈 LONG' : '📉 SHORT'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold border border-black sm:border-2 ${getRiskColor(tradeSignal.riskLevel)}`}>
                  {tradeSignal.riskLevel} RISK
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-2 sm:p-3 rounded border border-black">
                <div className="flex items-center space-x-1 mb-1">
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-600">ENTRY</span>
                </div>
                <div className="text-sm sm:text-lg font-black text-black">
                  {formatPrice(tradeSignal.entryPrice)}
                </div>
              </div>

              <div className="bg-white p-2 sm:p-3 rounded border border-black">
                <div className="flex items-center space-x-1 mb-1">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  <span className="text-xs font-bold text-gray-600">STOP LOSS</span>
                </div>
                <div className="text-sm sm:text-lg font-black text-red-600">
                  {formatPrice(tradeSignal.stopLoss)}
                </div>
              </div>

              <div className="bg-white p-2 sm:p-3 rounded border border-black">
                <div className="flex items-center space-x-1 mb-1">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-xs font-bold text-gray-600">TAKE PROFIT</span>
                </div>
                <div className="text-sm sm:text-lg font-black text-green-600">
                  {formatPrice(tradeSignal.takeProfit)}
                </div>
              </div>

              <div className="bg-white p-2 sm:p-3 rounded border border-black">
                <div className="flex items-center space-x-1 mb-1">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                  <span className="text-xs font-bold text-gray-600">R:R RATIO</span>
                </div>
                <div className="text-sm sm:text-lg font-black text-purple-600">
                  1:{tradeSignal.riskRewardRatio.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded border border-black">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600">CONFIDENCE LEVEL</span>
                <span className="text-sm font-black text-black">{tradeSignal.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${tradeSignal.confidence}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Right Column - Technical Analysis */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-black text-black" style={{ fontFamily: 'Times, serif' }}>
              Technical Indicators ({tradeSignal.timeframe})
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-black">
                <div className="font-bold text-gray-600">RSI</div>
                <div className="font-black text-black">{tradeSignal.technicalIndicators.rsi}</div>
              </div>
              <div className="bg-white p-2 rounded border border-black">
                <div className="font-bold text-gray-600">MACD</div>
                <div className="font-black text-black">{tradeSignal.technicalIndicators.macd}</div>
              </div>
              <div className="bg-white p-2 rounded border border-black">
                <div className="font-bold text-gray-600">SMA 20</div>
                <div className="font-black text-black">{formatPrice(tradeSignal.technicalIndicators.sma20)}</div>
              </div>
              <div className="bg-white p-2 rounded border border-black">
                <div className="font-bold text-gray-600">SMA 50</div>
                <div className="font-black text-black">{formatPrice(tradeSignal.technicalIndicators.sma50)}</div>
              </div>
              <div className="bg-white p-2 rounded border border-black">
                <div className="font-bold text-gray-600">Support</div>
                <div className="font-black text-green-600">{formatPrice(tradeSignal.technicalIndicators.support)}</div>
              </div>
              <div className="bg-white p-2 rounded border border-black">
                <div className="font-bold text-gray-600">Resistance</div>
                <div className="font-black text-red-600">{formatPrice(tradeSignal.technicalIndicators.resistance)}</div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded border border-black">
              <div className="text-xs font-bold text-gray-600 mb-1">MARKET CONDITIONS</div>
              <div className="text-xs sm:text-sm text-black">{tradeSignal.marketConditions}</div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded border border-black">
              <div className="text-xs font-bold text-gray-600 mb-1">EXPECTED DURATION</div>
              <div className="text-xs sm:text-sm font-black text-black">{tradeSignal.expectedDuration}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="space-y-3 sm:space-y-4">
        <h4 className="text-sm sm:text-base font-black text-black border-b border-black sm:border-b-2 pb-2" style={{ fontFamily: 'Times, serif' }}>
          AI Analysis & Reasoning
        </h4>
        
        <div className="bg-gray-50 p-3 sm:p-4 rounded border border-black sm:border-2">
          <h5 className="text-xs sm:text-sm font-bold text-black mb-2">Market Analysis:</h5>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{tradeSignal.analysis}</p>
        </div>

        <div className="bg-blue-50 p-3 sm:p-4 rounded border border-black sm:border-2">
          <h5 className="text-xs sm:text-sm font-bold text-black mb-2">Trade Reasoning:</h5>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{tradeSignal.reasoning}</p>
        </div>
      </div>

      {/* Live Data Status */}
      <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-gray-100 rounded border border-black sm:border-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-1 sm:gap-0">
            <span className="px-2 py-1 rounded border border-black sm:border-2 font-bold self-start text-green-600 bg-green-50">
              🔴 LIVE DATA + AI
            </span>
            <span className="text-gray-600 font-medium">
              Real-time {selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'} data with o1-preview AI analysis
            </span>
          </div>
          <span className="text-gray-600 font-bold">
            Generated: {tradeSignal?.timestamp ? formatDate(tradeSignal.timestamp) : 'N/A'}
          </span>
        </div>
        <div className="mt-2 text-xs text-black bg-green-100 p-2 rounded border border-black sm:border-2">
          <strong>Live Integration:</strong> This signal uses real-time market data from CoinGecko & Coinbase, 
          processed through OpenAI's latest o1-preview reasoning model for comprehensive technical analysis.
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-orange-100 rounded border border-black sm:border-2">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-black">
            <strong>Risk Disclaimer:</strong> This trade signal is generated by AI analysis and is for educational purposes only. 
            Cryptocurrency trading involves substantial risk of loss. Never risk more than you can afford to lose. 
            Past performance does not guarantee future results. Always conduct your own research and consider consulting with a financial advisor.
          </div>
        </div>
      </div>
    </div>
  )
}
