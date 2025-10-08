import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, Shield, Brain, RefreshCw, AlertTriangle, DollarSign, Activity, BarChart3 } from 'lucide-react'
import { useUltimateTradeGeneration } from '../hooks/useApiData'

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
  const { data, loading, error, refetch } = useUltimateTradeGeneration(selectedCrypto)
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
      <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 border-2 border-black mobile-bg-primary animate-fade-in">
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
          <div className="relative">
            <Brain className="h-12 w-12 text-black animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
          </div>
          
          <div className="text-center space-y-3 max-w-sm">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin text-black" />
              <span className="mobile-text-primary font-bold text-base">
                AI Analysis in Progress
              </span>
            </div>
            
            <p className="text-sm mobile-text-secondary">
              Analyzing {selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'} market data
            </p>
            
            <div className="space-y-2 text-xs mobile-text-muted">
              <div className="flex items-center justify-center space-x-2 animate-fade-in-delay-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Fetching live market data...</span>
              </div>
              <div className="flex items-center justify-center space-x-2 animate-fade-in-delay-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Calculating technical indicators...</span>
              </div>
              <div className="flex items-center justify-center space-x-2 animate-fade-in-delay-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Generating AI trade signal...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data && !loading) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 border-2 border-black mobile-bg-primary animate-fade-in">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative p-4 mobile-bg-secondary rounded-xl border-2 border-black animate-bounce-subtle">
              <Brain className="h-10 w-10 text-black" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-black mobile-text-primary animate-slide-up" style={{ fontFamily: 'Times, serif' }}>
              📈 AI TRADE GENERATION ENGINE
            </h2>
            <p className="mobile-text-secondary text-sm leading-relaxed max-w-md mx-auto animate-slide-up-delay">
              Advanced algorithmic trading signals powered by artificial intelligence
            </p>
          </div>
          
          {/* Cryptocurrency Selection */}
          <div className="flex justify-center animate-slide-up-delay-2">
            <div className="flex mobile-bg-secondary p-2 rounded-xl border-2 border-black shadow-lg">
              <button
                onClick={() => handleCryptoChange('BTC')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 min-h-[48px] min-w-[120px] touch-manipulation transform hover:scale-105 ${
                  selectedCrypto === 'BTC'
                    ? 'bg-black text-white shadow-lg animate-pulse-subtle'
                    : 'mobile-bg-primary mobile-text-primary hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <span className="text-lg">₿</span>
                <span>Bitcoin</span>
              </button>
              <button
                onClick={() => handleCryptoChange('ETH')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 ml-2 min-h-[48px] min-w-[120px] touch-manipulation transform hover:scale-105 ${
                  selectedCrypto === 'ETH'
                    ? 'bg-black text-white shadow-lg animate-pulse-subtle'
                    : 'mobile-bg-primary mobile-text-primary hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <span className="text-lg">Ξ</span>
                <span>Ethereum</span>
              </button>
            </div>
          </div>
          
          {!isAuthenticated ? (
            <div className="max-w-sm mx-auto animate-slide-up-delay-3">
              {!showPasswordInput ? (
                <button 
                  onClick={handleUnlock}
                  className="w-full bg-black text-white font-bold py-4 px-6 rounded-xl border-2 border-black hover:bg-gray-800 transition-all duration-300 flex items-center justify-center text-base min-h-[56px] touch-manipulation transform hover:scale-105 hover:shadow-xl animate-glow"
                  style={{ fontFamily: 'Times, serif' }}
                >
                  <Shield className="h-5 w-5 mr-3" />
                  <span>UNLOCK TRADE ENGINE</span>
                </button>
              ) : (
                <div className="mobile-bg-secondary p-6 rounded-xl border-2 border-black transition-all duration-500 animate-slide-down shadow-xl">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-full mb-3 animate-pulse">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-base font-bold mobile-text-primary">Secure Access Required</p>
                    <p className="text-sm mobile-text-secondary mt-1">Enter password to unlock AI trading signals</p>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handlePasswordKeyPress}
                      placeholder="Enter password..."
                      className="w-full p-4 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-center min-h-[56px] mobile-bg-primary mobile-text-primary text-lg transition-all duration-300"
                      autoFocus
                    />
                    
                    {passwordError && (
                      <div className="mobile-text-error text-sm text-center p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                        {passwordError}
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handlePasswordSubmit}
                        className="flex-1 py-4 bg-black text-white hover:bg-gray-800 rounded-xl border-2 border-black font-bold text-base min-h-[56px] touch-manipulation transition-all duration-300 transform hover:scale-105"
                      >
                        🔓 Access
                      </button>
                      <button
                        onClick={() => setShowPasswordInput(false)}
                        className="flex-1 py-4 mobile-bg-primary mobile-text-primary hover:bg-gray-100 rounded-xl border-2 border-black font-bold text-base min-h-[56px] touch-manipulation transition-all duration-300 transform hover:scale-105"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={handleGenerateClick}
              className="w-full max-w-sm mx-auto bg-black text-white font-bold py-4 px-6 rounded-xl border-2 border-black hover:bg-gray-800 transition-all duration-300 flex items-center justify-center text-base min-h-[56px] touch-manipulation transform hover:scale-105 hover:shadow-xl animate-glow"
              style={{ fontFamily: 'Times, serif' }}
            >
              <Brain className="h-5 w-5 mr-3 animate-pulse" />
              <span>GENERATE TRADE SIGNAL</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 border-2 md:border-4 border-black mobile-bg-primary">
        <div className="flex items-center justify-center h-32 sm:h-64">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mr-2 mobile-text-error" />
          <div className="text-center">
            <p className="font-bold mobile-text-primary text-sm sm:text-base">Error generating trade signal</p>
            <p className="text-xs sm:text-sm mobile-text-secondary mt-1">{error}</p>
            <button 
              onClick={handleGenerateClick}
              className="mt-3 px-3 sm:px-4 py-2 bg-black text-white rounded border border-black sm:border-2 hover:bg-gray-800 transition-colors font-bold text-sm sm:text-base min-h-[44px] min-w-[44px] touch-manipulation mobile-text-primary"
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
    <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 border-2 border-black mobile-bg-primary animate-fade-in">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="p-2 sm:p-3 mobile-bg-secondary rounded-xl border-2 border-black animate-bounce-subtle flex-shrink-0">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-black mobile-text-primary animate-slide-up break-words" style={{ fontFamily: 'Times, serif' }}>
                📈 AI Trade Generation Engine
              </h2>
              <p className="text-xs sm:text-sm mobile-text-secondary animate-slide-up-delay break-words">
                Advanced algorithmic trading signals powered by artificial intelligence
              </p>
            </div>
          </div>
          
          <button
            onClick={handleGenerateClick}
            className="p-2 sm:p-3 bg-black text-white hover:bg-gray-800 rounded-xl border-2 border-black min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] touch-manipulation transition-all duration-300 transform hover:scale-110 animate-glow flex-shrink-0"
            title="Generate new signal"
          >
            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 animate-pulse flex-shrink-0" />
            <span className="mobile-text-secondary break-words">
              Live {selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'} Analysis
            </span>
          </div>
          <div className="text-left sm:text-right">
            <div className="mobile-text-muted text-xs">Generated</div>
            <div className="font-bold mobile-text-primary text-xs sm:text-sm break-words">{formatDate(tradeSignal.timestamp)}</div>
          </div>
        </div>
      </div>

      {/* Trade Signal Card */}
      <div className="mobile-bg-secondary rounded-xl p-3 sm:p-4 md:p-6 border-2 border-black mb-4 sm:mb-6 animate-slide-up shadow-lg">
        <div className="space-y-4 sm:space-y-6">
          {/* Signal Header */}
          <div className="text-center space-y-2 sm:space-y-3">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black mobile-text-primary animate-slide-up break-words" style={{ fontFamily: 'Times, serif' }}>
              {tradeSignal.symbol} Trade Signal
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-black min-h-[40px] flex items-center justify-center animate-pulse-subtle w-full sm:w-auto ${getDirectionColor(tradeSignal.direction)}`}>
                {tradeSignal.direction === 'LONG' ? '📈 LONG POSITION' : '📉 SHORT POSITION'}
              </span>
              <span className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-black min-h-[40px] flex items-center justify-center w-full sm:w-auto ${getRiskColor(tradeSignal.riskLevel)}`}>
                {tradeSignal.riskLevel} RISK
              </span>
            </div>
          </div>

          {/* Price Levels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="mobile-bg-primary p-3 sm:p-4 rounded-xl border-2 border-black animate-fade-in-delay-1 mobile-touch-target">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold mobile-text-secondary">ENTRY PRICE</span>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black mobile-text-primary break-words">
                {formatPrice(tradeSignal.entryPrice)}
              </div>
            </div>

            <div className="mobile-bg-primary p-3 sm:p-4 rounded-xl border-2 border-black animate-fade-in-delay-2 mobile-touch-target">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold mobile-text-secondary">STOP LOSS</span>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black mobile-text-error break-words">
                {formatPrice(tradeSignal.stopLoss)}
              </div>
            </div>

            <div className="mobile-bg-primary p-3 sm:p-4 rounded-xl border-2 border-black animate-fade-in-delay-3 mobile-touch-target">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold mobile-text-secondary">TAKE PROFIT</span>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black mobile-text-success break-words">
                {formatPrice(tradeSignal.takeProfit)}
              </div>
            </div>

            <div className="mobile-bg-primary p-3 sm:p-4 rounded-xl border-2 border-black animate-fade-in-delay-1 mobile-touch-target">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold mobile-text-secondary">RISK:REWARD</span>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black mobile-text-info">
                1:{tradeSignal.riskRewardRatio.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Confidence Level */}
          <div className="mobile-bg-primary p-3 sm:p-4 rounded-xl border-2 border-black animate-slide-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold mobile-text-secondary">AI CONFIDENCE LEVEL</span>
              </div>
              <span className="text-lg sm:text-xl font-black mobile-text-primary">{tradeSignal.confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out animate-pulse-subtle" 
                style={{ width: `${tradeSignal.confidence}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs mobile-text-secondary text-center">
              {tradeSignal.confidence >= 80 ? 'High Confidence' : 
               tradeSignal.confidence >= 60 ? 'Medium Confidence' : 'Low Confidence'}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Analysis Section */}
      <div className="space-y-4 sm:space-y-6">
        <h4 className="text-base sm:text-lg font-black mobile-text-primary text-center animate-slide-up break-words" style={{ fontFamily: 'Times, serif' }}>
          📊 Technical Analysis ({tradeSignal.timeframe})
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <div className="mobile-bg-primary p-2 sm:p-3 rounded-xl border-2 border-black animate-fade-in-delay-1 mobile-touch-target">
            <div className="text-center">
              <div className="text-xs font-bold mobile-text-secondary mb-1 truncate">RSI</div>
              <div className={`text-base sm:text-lg font-black break-words ${tradeSignal.technicalIndicators.rsi > 70 ? 'mobile-text-error' : tradeSignal.technicalIndicators.rsi < 30 ? 'mobile-text-success' : 'mobile-text-primary'}`}>
                {tradeSignal.technicalIndicators.rsi?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs mobile-text-secondary mt-1 truncate">
                {tradeSignal.technicalIndicators.rsi > 70 ? 'Overbought' : 
                 tradeSignal.technicalIndicators.rsi < 30 ? 'Oversold' : 'Neutral'}
              </div>
            </div>
          </div>

          <div className="mobile-bg-primary p-2 sm:p-3 rounded-xl border-2 border-black animate-fade-in-delay-2 mobile-touch-target">
            <div className="text-center">
              <div className="text-xs font-bold mobile-text-secondary mb-1 truncate">MACD</div>
              <div className={`text-base sm:text-lg font-black break-words ${tradeSignal.technicalIndicators.macd === 'BULLISH' ? 'mobile-text-success' : tradeSignal.technicalIndicators.macd === 'BEARISH' ? 'mobile-text-error' : 'mobile-text-primary'}`}>
                {tradeSignal.technicalIndicators.macd || 'N/A'}
              </div>
              <div className="text-xs mobile-text-secondary mt-1 truncate">Momentum</div>
            </div>
          </div>

          <div className="mobile-bg-primary p-2 sm:p-3 rounded-xl border-2 border-black animate-fade-in-delay-3 mobile-touch-target">
            <div className="text-center">
              <div className="text-xs font-bold mobile-text-secondary mb-1 truncate">Support</div>
              <div className="text-xs sm:text-sm font-black mobile-text-success break-words">
                {tradeSignal.technicalIndicators.support ? formatPrice(tradeSignal.technicalIndicators.support) : 'N/A'}
              </div>
              <div className="text-xs mobile-text-secondary mt-1 truncate">Key Level</div>
            </div>
          </div>

          <div className="mobile-bg-primary p-2 sm:p-3 rounded-xl border-2 border-black animate-fade-in-delay-1 mobile-touch-target">
            <div className="text-center">
              <div className="text-xs font-bold mobile-text-secondary mb-1 truncate">Resistance</div>
              <div className="text-xs sm:text-sm font-black mobile-text-error break-words">
                {tradeSignal.technicalIndicators.resistance ? formatPrice(tradeSignal.technicalIndicators.resistance) : 'N/A'}
              </div>
              <div className="text-xs mobile-text-secondary mt-1 truncate">Key Level</div>
            </div>
          </div>

          <div className="mobile-bg-primary p-2 sm:p-3 rounded-xl border-2 border-black animate-fade-in-delay-2 mobile-touch-target">
            <div className="text-center">
              <div className="text-xs font-bold mobile-text-secondary mb-1 truncate">EMA 20</div>
              <div className="text-xs sm:text-sm font-black mobile-text-primary break-words">
                {tradeSignal.technicalIndicators.ema20 ? formatPrice(tradeSignal.technicalIndicators.ema20) : 'N/A'}
              </div>
              <div className="text-xs mobile-text-secondary mt-1 truncate">Short Term</div>
            </div>
          </div>

          <div className="mobile-bg-primary p-2 sm:p-3 rounded-xl border-2 border-black animate-fade-in-delay-3 mobile-touch-target">
            <div className="text-center">
              <div className="text-xs font-bold mobile-text-secondary mb-1 truncate">EMA 50</div>
              <div className="text-xs sm:text-sm font-black mobile-text-primary break-words">
                {tradeSignal.technicalIndicators.ema50 ? formatPrice(tradeSignal.technicalIndicators.ema50) : 'N/A'}
              </div>
              <div className="text-xs mobile-text-secondary mt-1 truncate">Long Term</div>
            </div>
          </div>
        </div>

        
        {/* Market Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="mobile-bg-secondary p-3 sm:p-4 rounded-xl border-2 border-black animate-slide-up">
            <div className="text-center">
              <div className="text-xs sm:text-sm font-bold mobile-text-secondary mb-2">MARKET CONDITIONS</div>
              <div className="text-xs sm:text-sm mobile-text-primary leading-relaxed break-words">{tradeSignal.marketConditions}</div>
            </div>
          </div>

          <div className="mobile-bg-secondary p-3 sm:p-4 rounded-xl border-2 border-black animate-slide-up-delay">
            <div className="text-center">
              <div className="text-xs sm:text-sm font-bold mobile-text-secondary mb-2">EXPECTED DURATION</div>
              <div className="text-base sm:text-lg font-black mobile-text-primary break-words">{tradeSignal.expectedDuration}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <h4 className="text-base sm:text-lg font-black mobile-text-primary text-center border-b-2 border-black pb-2 sm:pb-3 animate-slide-up break-words" style={{ fontFamily: 'Times, serif' }}>
          🤖 AI Analysis & Reasoning
        </h4>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="mobile-bg-secondary p-3 sm:p-4 rounded-xl border-2 border-black animate-fade-in-delay-1">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <h5 className="text-xs sm:text-sm font-bold mobile-text-primary">Market Analysis</h5>
            </div>
            <p className="text-xs sm:text-sm mobile-text-secondary leading-relaxed break-words">{tradeSignal.analysis}</p>
          </div>

          <div className="mobile-bg-info p-3 sm:p-4 rounded-xl border-2 border-black animate-fade-in-delay-2">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <h5 className="text-xs sm:text-sm font-bold mobile-text-info">Trade Reasoning</h5>
            </div>
            <p className="text-xs sm:text-sm mobile-text-info leading-relaxed break-words">{tradeSignal.reasoning}</p>
          </div>
        </div>

        {/* Sentiment Analysis */}
        {tradeSignal.sentimentAnalysis && (
          <div className="mobile-bg-accent p-3 sm:p-4 rounded-xl border-2 border-black animate-fade-in-delay-3">
            <h5 className="text-xs sm:text-sm font-bold mobile-text-accent mb-2 break-words">Market Sentiment Analysis:</h5>
            <p className="text-xs sm:text-sm mobile-text-accent leading-relaxed break-words">{tradeSignal.sentimentAnalysis}</p>
          </div>
        )}

        {/* News Impact Analysis */}
        {tradeSignal.newsImpact && (
          <div className="mobile-bg-warning p-3 sm:p-4 rounded-xl border-2 border-black animate-fade-in-delay-1">
            <h5 className="text-xs sm:text-sm font-bold mobile-text-warning mb-2 break-words">Live News Impact:</h5>
            <p className="text-xs sm:text-sm mobile-text-warning leading-relaxed break-words">{tradeSignal.newsImpact}</p>
          </div>
        )}
      </div>

      {/* Enhanced Data Quality Status */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 mobile-bg-secondary rounded-xl border-2 border-black">
        <div className="flex flex-col gap-2 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="px-3 py-2 rounded-lg border-2 border-black font-bold mobile-text-info mobile-bg-info min-h-[36px] flex items-center justify-center w-fit">
                🔴 RELIABLE LIVE DATA
              </span>
              <span className="mobile-text-secondary font-medium break-words">
                Real-time {selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'} data from CoinMarketCap/CoinGecko APIs
              </span>
            </div>
            <span className="mobile-text-secondary font-bold text-xs break-words">
              Generated: {tradeSignal?.timestamp ? formatDate(tradeSignal.timestamp) : 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Live Data Quality Metrics */}
        {tradeSignal?.liveDataValidation && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="mobile-bg-info p-2 sm:p-3 rounded-lg border-2 border-black">
              <div className="font-bold mobile-text-info mb-1 truncate">Data Source</div>
              <div className="mobile-text-info break-words text-xs">{tradeSignal.liveDataValidation.primarySource}</div>
            </div>
            <div className="mobile-bg-success p-2 sm:p-3 rounded-lg border-2 border-black">
              <div className="font-bold mobile-text-success mb-1 truncate">Confidence</div>
              <div className="mobile-text-success text-xs">{tradeSignal.confidence}%</div>
            </div>
            <div className="mobile-bg-accent p-2 sm:p-3 rounded-lg border-2 border-black">
              <div className="font-bold mobile-text-accent mb-1 truncate">News</div>
              <div className="mobile-text-accent text-xs">{tradeSignal.liveDataValidation.newsAvailable ? 'LIVE' : 'N/A'}</div>
            </div>
            <div className="mobile-bg-warning p-2 sm:p-3 rounded-lg border-2 border-black">
              <div className="font-bold mobile-text-warning mb-1 truncate">Freshness</div>
              <div className="mobile-text-warning text-xs">REAL-TIME</div>
            </div>
          </div>
        )}
        
        {/* Fallback for older data format */}
        {tradeSignal?.dataQuality && !tradeSignal?.liveDataValidation && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border-2 border-black">
              <div className="font-bold text-blue-800 mb-1 truncate">Exchanges</div>
              <div className="text-blue-600 break-words">{tradeSignal.dataQuality.exchangesCovered || 'N/A'}</div>
            </div>
            <div className="bg-purple-50 p-2 sm:p-3 rounded-lg border-2 border-black">
              <div className="font-bold text-purple-800 mb-1 truncate">Indicators</div>
              <div className="text-purple-600 break-words">{tradeSignal.dataQuality.technicalIndicators || 'N/A'}</div>
            </div>
            <div className="bg-orange-50 p-2 sm:p-3 rounded-lg border-2 border-black">
              <div className="font-bold text-orange-800 mb-1 truncate">Sentiment</div>
              <div className="text-orange-600 break-words">{tradeSignal.dataQuality.sentimentSources || 'N/A'}</div>
            </div>
            <div className="bg-green-50 p-2 sm:p-3 rounded-lg border-2 border-black">
              <div className="font-bold text-green-800 mb-1 truncate">Spread</div>
              <div className="text-green-600">{tradeSignal.dataQuality.priceSpread?.toFixed(3) || 'N/A'}%</div>
            </div>
          </div>
        )}
        
        <div className="mt-3 text-xs mobile-text-info mobile-bg-info p-3 rounded-lg border-2 border-black">
          <strong className="break-words">Reliable Live Integration:</strong> <span className="break-words">This signal uses real-time data from CoinMarketCap (primary) or CoinGecko (fallback). All data is validated for accuracy and freshness before analysis.</span>
        </div>
        
        {/* Arbitrage & Liquidity Analysis */}
        {tradeSignal?.arbitrageOpportunity && (
          <div className="mt-2 text-xs text-blue-900 bg-blue-100 p-3 rounded-lg border-2 border-black">
            <strong>Cross-Exchange Analysis:</strong> <span className="break-words">{tradeSignal.arbitrageOpportunity}</span>
          </div>
        )}
        
        {tradeSignal?.liquidityAnalysis && (
          <div className="mt-2 text-xs text-purple-900 bg-purple-100 p-3 rounded-lg border-2 border-black">
            <strong>Liquidity Assessment:</strong> <span className="break-words">{tradeSignal.liquidityAnalysis}</span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 mobile-bg-warning rounded-xl border-2 border-black">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mobile-text-warning mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm mobile-text-warning leading-relaxed break-words">
            <strong>Risk Disclaimer:</strong> This trade signal is generated by AI analysis and is for educational purposes only. 
            Cryptocurrency trading involves substantial risk of loss. Never risk more than you can afford to lose. 
            Past performance does not guarantee future results. Always conduct your own research and consider consulting with a financial advisor.
          </div>
        </div>
      </div>
    </div>
  )
}
