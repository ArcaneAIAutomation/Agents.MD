import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, Shield, Brain, RefreshCw, AlertTriangle, DollarSign, Activity, BarChart3 } from 'lucide-react'
import { useUltimateTradeGeneration } from '../hooks/useApiData'
import EinsteinGenerateButton from './Einstein/EinsteinGenerateButton'

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
    bollinger?: string
    ema20: number
    ema50: number
    support: number
    resistance: number
    atr?: number
    stochastic?: string
  }
  marketConditions: string
  sentimentAnalysis?: string
  newsImpact?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  expectedDuration: string
  dataQuality?: {
    exchangesCovered: number
    technicalIndicators: number
    sentimentSources: number
    priceSpread: number
    confidence: string
  }
  arbitrageOpportunity?: string
  liquidityAnalysis?: string
  liveDataValidation?: {
    primarySource: string
    newsAvailable: boolean
  }
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
    return direction === 'LONG' ? 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange' : 'bg-bitcoin-black text-bitcoin-orange border-bitcoin-orange'
  }
  
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-bitcoin-black text-bitcoin-white border-bitcoin-orange-20'
      case 'medium': return 'bg-bitcoin-black text-bitcoin-orange border-bitcoin-orange'
      case 'high': return 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange'
      default: return 'bg-bitcoin-black text-bitcoin-white-80 border-bitcoin-orange-20'
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
      <div className="bitcoin-block bg-bitcoin-black animate-fade-in">
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
          <div className="relative">
            <Brain className="h-12 w-12 text-bitcoin-orange animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-bitcoin-orange rounded-full animate-ping"></div>
          </div>
          
          <div className="text-center space-y-3 max-w-sm">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin text-bitcoin-orange" />
              <span className="text-bitcoin-white font-bold text-base">
                AI Analysis in Progress
              </span>
            </div>
            
            <p className="text-sm text-bitcoin-white-80">
              Analyzing {selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'} market data
            </p>
            
            <div className="space-y-2 text-xs text-bitcoin-white-60">
              <div className="flex items-center justify-center space-x-2 animate-fade-in-delay-1">
                <div className="w-2 h-2 bg-bitcoin-orange rounded-full animate-pulse"></div>
                <span>Fetching live market data...</span>
              </div>
              <div className="flex items-center justify-center space-x-2 animate-fade-in-delay-2">
                <div className="w-2 h-2 bg-bitcoin-orange rounded-full animate-pulse"></div>
                <span>Calculating technical indicators...</span>
              </div>
              <div className="flex items-center justify-center space-x-2 animate-fade-in-delay-3">
                <div className="w-2 h-2 bg-bitcoin-orange rounded-full animate-pulse"></div>
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
      <div className="bitcoin-block bg-bitcoin-black animate-fade-in">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative p-4 bg-bitcoin-black rounded-xl border-2 border-bitcoin-orange animate-bounce-subtle">
              <Brain className="h-10 w-10 text-bitcoin-orange" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-bitcoin-orange rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-bitcoin-white animate-slide-up" style={{ fontFamily: 'Inter, sans-serif' }}>
              📈 AI TRADE GENERATION ENGINE
            </h2>
            <p className="text-bitcoin-white-80 text-sm leading-relaxed max-w-md mx-auto animate-slide-up-delay">
              Advanced algorithmic trading signals powered by artificial intelligence
            </p>
          </div>
          
          {/* Cryptocurrency Selection */}
          <div className="flex justify-center animate-slide-up-delay-2">
            <div className="flex bg-bitcoin-black p-2 rounded-xl border-2 border-bitcoin-orange shadow-bitcoin-glow">
              <button
                onClick={() => handleCryptoChange('BTC')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 min-h-[48px] min-w-[120px] touch-manipulation transform hover:scale-105 ${
                  selectedCrypto === 'BTC'
                    ? 'bg-bitcoin-orange text-bitcoin-black shadow-lg animate-pulse-subtle'
                    : 'bg-bitcoin-black text-bitcoin-white hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-md'
                }`}
              >
                <span className="text-lg">₿</span>
                <span>Bitcoin</span>
              </button>
              <button
                onClick={() => handleCryptoChange('ETH')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 ml-2 min-h-[48px] min-w-[120px] touch-manipulation transform hover:scale-105 ${
                  selectedCrypto === 'ETH'
                    ? 'bg-bitcoin-orange text-bitcoin-black shadow-lg animate-pulse-subtle'
                    : 'bg-bitcoin-black text-bitcoin-white hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-md'
                }`}
              >
                <span className="text-lg">Ξ</span>
                <span>Ethereum</span>
              </button>
            </div>
          </div>
          
          {!isAuthenticated ? (
            <div className="max-w-sm mx-auto animate-slide-up-delay-3 space-y-4">
              {/* Einstein Button - Prominent placement */}
              <div className="relative group">
                <EinsteinGenerateButton
                  onClick={handleUnlock}
                  loading={false}
                  disabled={false}
                  className="w-full py-4 text-base animate-glow"
                />
                {/* Tooltip explaining Einstein features */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-full max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-3 shadow-[0_0_20px_rgba(247,147,26,0.3)]">
                    <p className="text-xs text-bitcoin-white-80 text-center leading-relaxed">
                      <strong className="text-bitcoin-orange">Einstein 100000x Engine:</strong> Advanced AI-powered trade generation with GPT-5.1 high reasoning, comprehensive multi-source data validation, and user approval workflow.
                    </p>
                  </div>
                </div>
              </div>
              
              {!showPasswordInput ? (
                <button 
                  onClick={handleUnlock}
                  className="btn-bitcoin-secondary w-full py-4 px-6 rounded-xl flex items-center justify-center text-base min-h-[56px] touch-manipulation transform hover:scale-105 hover:shadow-bitcoin-glow"
                >
                  <Shield className="h-5 w-5 mr-3" />
                  <span>UNLOCK TRADE ENGINE</span>
                </button>
              ) : (
                <div className="bg-bitcoin-black p-6 rounded-xl border-2 border-bitcoin-orange transition-all duration-500 animate-slide-down shadow-bitcoin-glow">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-bitcoin-orange rounded-full mb-3 animate-pulse">
                      <Shield className="h-6 w-6 text-bitcoin-black" />
                    </div>
                    <p className="text-base font-bold text-bitcoin-white">Secure Access Required</p>
                    <p className="text-sm text-bitcoin-white-80 mt-1">Enter password to unlock AI trading signals</p>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handlePasswordKeyPress}
                      placeholder="Enter password..."
                      className="w-full p-4 border-2 border-bitcoin-orange rounded-xl focus:outline-none focus:ring-4 focus:ring-bitcoin-orange-30 focus:border-bitcoin-orange text-center min-h-[56px] bg-bitcoin-black text-bitcoin-white text-lg transition-all duration-300"
                      autoFocus
                    />
                    
                    {passwordError && (
                      <div className="text-bitcoin-orange text-sm text-center p-3 bg-bitcoin-black border border-bitcoin-orange rounded-lg animate-shake">
                        {passwordError}
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handlePasswordSubmit}
                        className="btn-bitcoin-primary flex-1 py-4 rounded-xl font-bold text-base min-h-[56px] touch-manipulation transition-all duration-300 transform hover:scale-105"
                      >
                        🔓 Access
                      </button>
                      <button
                        onClick={() => setShowPasswordInput(false)}
                        className="btn-bitcoin-secondary flex-1 py-4 rounded-xl font-bold text-base min-h-[56px] touch-manipulation transition-all duration-300 transform hover:scale-105"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-sm mx-auto space-y-4">
              {/* Einstein Button - Primary action when authenticated */}
              <div className="relative group">
                <EinsteinGenerateButton
                  onClick={handleGenerateClick}
                  loading={loading}
                  disabled={loading}
                  className="w-full py-4 text-base animate-glow"
                />
                {/* Tooltip explaining Einstein features */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-full max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-3 shadow-[0_0_20px_rgba(247,147,26,0.3)]">
                    <p className="text-xs text-bitcoin-white-80 text-center leading-relaxed">
                      <strong className="text-bitcoin-orange">Einstein Features:</strong> GPT-5.1 AI analysis, 13+ API data sources, 90%+ data quality validation, multi-timeframe analysis, and comprehensive risk management.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Legacy button for backward compatibility */}
              <button 
                onClick={handleGenerateClick}
                className="btn-bitcoin-secondary w-full py-4 px-6 rounded-xl flex items-center justify-center text-base min-h-[56px] touch-manipulation transform hover:scale-105"
              >
                <Brain className="h-5 w-5 mr-3" />
                <span>LEGACY GENERATION</span>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bitcoin-block bg-bitcoin-black">
        <div className="flex items-center justify-center h-32 sm:h-64">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mr-2 text-bitcoin-orange" />
          <div className="text-center">
            <p className="font-bold text-bitcoin-white text-sm sm:text-base">Error generating trade signal</p>
            <p className="text-xs sm:text-sm text-bitcoin-white-80 mt-1">{error}</p>
            <button 
              onClick={handleGenerateClick}
              className="btn-bitcoin-primary mt-3 px-3 sm:px-4 py-2 rounded font-bold text-sm sm:text-base min-h-[44px] min-w-[44px] touch-manipulation"
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
    <div className="bitcoin-block bg-bitcoin-black animate-fade-in">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="p-2 sm:p-3 bg-bitcoin-black rounded-xl border-2 border-bitcoin-orange animate-bounce-subtle flex-shrink-0">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-bitcoin-orange" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-black text-bitcoin-white animate-slide-up break-words" style={{ fontFamily: 'Inter, sans-serif' }}>
                📈 Einstein Trade Engine
              </h2>
              <p className="text-xs sm:text-sm text-bitcoin-white-80 animate-slide-up-delay break-words">
                Einstein 100000x AI-powered trade generation with GPT-5.1 reasoning
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            {/* Einstein Button - Compact version in header */}
            <div className="relative group hidden sm:block">
              <button
                onClick={handleGenerateClick}
                disabled={loading}
                className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-4 py-2 rounded-lg min-h-[48px] flex items-center gap-2 transition-all duration-300 hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate Einstein signal"
              >
                <Brain className="h-5 w-5" />
                <span className="text-sm">EINSTEIN</span>
              </button>
              {/* Tooltip */}
              <div className="absolute right-0 top-full mt-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-3 shadow-[0_0_20px_rgba(247,147,26,0.3)]">
                  <p className="text-xs text-bitcoin-white-80 leading-relaxed">
                    <strong className="text-bitcoin-orange">Einstein Engine:</strong> Generate new signal with advanced AI analysis and comprehensive data validation.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Legacy refresh button */}
            <button
              onClick={handleGenerateClick}
              className="btn-bitcoin-primary p-2 sm:p-3 rounded-xl min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] touch-manipulation transition-all duration-300 transform hover:scale-110 animate-glow flex-shrink-0"
              title="Refresh signal"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-bitcoin-orange animate-pulse flex-shrink-0" />
            <span className="text-bitcoin-white-80 break-words">
              Live {selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'} Analysis
            </span>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-bitcoin-white-60 text-xs">Generated</div>
            <div className="font-bold text-bitcoin-white text-xs sm:text-sm break-words">{formatDate(tradeSignal.timestamp)}</div>
          </div>
        </div>
      </div>

      {/* Trade Signal Card */}
      <div className="bg-bitcoin-black rounded-xl p-3 sm:p-4 md:p-6 border-2 border-bitcoin-orange mb-4 sm:mb-6 animate-slide-up shadow-bitcoin-glow overflow-hidden">
        <div className="space-y-4 sm:space-y-6">
          {/* Signal Header */}
          <div className="text-center space-y-2 sm:space-y-3">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-bitcoin-white animate-slide-up break-words truncate px-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {tradeSignal.symbol} Trade Signal
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-2">
              <span className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-bitcoin-orange min-h-[48px] flex items-center justify-center animate-pulse-subtle w-full sm:w-auto max-w-full truncate ${tradeSignal.direction === 'LONG' ? 'bg-bitcoin-orange text-bitcoin-black' : 'bg-bitcoin-black text-bitcoin-orange'}`}>
                {tradeSignal.direction === 'LONG' ? '📈 LONG POSITION' : '📉 SHORT POSITION'}
              </span>
              <span className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-bitcoin-orange min-h-[48px] flex items-center justify-center w-full sm:w-auto max-w-full truncate ${tradeSignal.riskLevel === 'HIGH' ? 'bg-bitcoin-orange text-bitcoin-black' : 'bg-bitcoin-black text-bitcoin-orange'}`}>
                {tradeSignal.riskLevel} RISK
              </span>
            </div>
          </div>

          {/* Price Levels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 overflow-hidden">
            <div className="stat-card p-3 sm:p-4 rounded-xl animate-fade-in-delay-1 min-h-[48px] overflow-hidden">
              <div className="flex items-center justify-between mb-2 min-w-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-bitcoin-orange flex-shrink-0" />
                  <span className="stat-label text-xs sm:text-sm truncate">ENTRY PRICE</span>
                </div>
              </div>
              <div className="price-display text-lg sm:text-xl break-words overflow-hidden">
                {formatPrice(tradeSignal.entryPrice)}
              </div>
            </div>

            <div className="stat-card p-3 sm:p-4 rounded-xl animate-fade-in-delay-2 min-h-[48px] overflow-hidden">
              <div className="flex items-center justify-between mb-2 min-w-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-bitcoin-orange flex-shrink-0" />
                  <span className="stat-label text-xs sm:text-sm truncate">STOP LOSS</span>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-bitcoin-white break-words font-mono overflow-hidden">
                {formatPrice(tradeSignal.stopLoss)}
              </div>
            </div>

            <div className="stat-card p-3 sm:p-4 rounded-xl animate-fade-in-delay-3 min-h-[48px] overflow-hidden">
              <div className="flex items-center justify-between mb-2 min-w-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-bitcoin-orange flex-shrink-0" />
                  <span className="stat-label text-xs sm:text-sm truncate">TAKE PROFIT</span>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-bitcoin-white break-words font-mono overflow-hidden">
                {formatPrice(tradeSignal.takeProfit)}
              </div>
            </div>

            <div className="stat-card p-3 sm:p-4 rounded-xl animate-fade-in-delay-1 min-h-[48px] overflow-hidden">
              <div className="flex items-center justify-between mb-2 min-w-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-bitcoin-orange flex-shrink-0" />
                  <span className="stat-label text-xs sm:text-sm truncate">RISK:REWARD</span>
                </div>
              </div>
              <div className="stat-value-orange text-lg sm:text-xl break-words overflow-hidden">
                1:{tradeSignal.riskRewardRatio.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Confidence Level */}
          <div className="stat-card p-3 sm:p-4 rounded-xl animate-slide-up overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-bitcoin-orange flex-shrink-0" />
                <span className="stat-label text-xs sm:text-sm truncate">AI CONFIDENCE LEVEL</span>
              </div>
              <span className="stat-value-orange text-lg sm:text-xl flex-shrink-0">{tradeSignal.confidence}%</span>
            </div>
            <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2 sm:h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange-80 h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out animate-pulse-subtle" 
                style={{ width: `${tradeSignal.confidence}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-bitcoin-white-60 text-center truncate">
              {tradeSignal.confidence >= 80 ? 'High Confidence' : 
               tradeSignal.confidence >= 60 ? 'Medium Confidence' : 'Low Confidence'}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Analysis Section */}
      <div className="space-y-4 sm:space-y-6 overflow-hidden">
        <h4 className="text-base sm:text-lg font-black text-bitcoin-white text-center animate-slide-up break-words px-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          📊 Technical Analysis ({tradeSignal.timeframe})
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 overflow-hidden">
          <div className="stat-card p-2 sm:p-3 rounded-xl animate-fade-in-delay-1 min-h-[48px] overflow-hidden">
            <div className="text-center">
              <div className="stat-label text-xs mb-1 truncate">RSI</div>
              <div className={`text-base sm:text-lg font-black font-mono break-words ${tradeSignal.technicalIndicators?.rsi > 70 ? 'text-bitcoin-orange' : tradeSignal.technicalIndicators?.rsi < 30 ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
                {tradeSignal.technicalIndicators?.rsi ? tradeSignal.technicalIndicators.rsi.toFixed(1) : 'N/A'}
              </div>
              <div className="text-xs text-bitcoin-white-60 mt-1 truncate">
                {tradeSignal.technicalIndicators?.rsi > 70 ? 'Overbought' : 
                 tradeSignal.technicalIndicators?.rsi < 30 ? 'Oversold' : 'Neutral'}
              </div>
            </div>
          </div>

          <div className="stat-card p-2 sm:p-3 rounded-xl animate-fade-in-delay-2 min-h-[48px] overflow-hidden">
            <div className="text-center">
              <div className="stat-label text-xs mb-1 truncate">MACD</div>
              <div className={`text-base sm:text-lg font-black font-mono break-words ${tradeSignal.technicalIndicators?.macd === 'BULLISH' ? 'text-bitcoin-orange' : tradeSignal.technicalIndicators?.macd === 'BEARISH' ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
                {tradeSignal.technicalIndicators?.macd || 'N/A'}
              </div>
              <div className="text-xs text-bitcoin-white-60 mt-1 truncate">Momentum</div>
            </div>
          </div>

          <div className="stat-card p-2 sm:p-3 rounded-xl animate-fade-in-delay-3 min-h-[48px] overflow-hidden">
            <div className="text-center">
              <div className="stat-label text-xs mb-1 truncate">Support</div>
              <div className="text-xs sm:text-sm font-black font-mono text-bitcoin-white break-words">
                {tradeSignal.technicalIndicators?.support ? formatPrice(tradeSignal.technicalIndicators.support) : 'N/A'}
              </div>
              <div className="text-xs text-bitcoin-white-60 mt-1 truncate">Key Level</div>
            </div>
          </div>

          <div className="stat-card p-2 sm:p-3 rounded-xl animate-fade-in-delay-1 min-h-[48px] overflow-hidden">
            <div className="text-center">
              <div className="stat-label text-xs mb-1 truncate">Resistance</div>
              <div className="text-xs sm:text-sm font-black font-mono text-bitcoin-white break-words">
                {tradeSignal.technicalIndicators?.resistance ? formatPrice(tradeSignal.technicalIndicators.resistance) : 'N/A'}
              </div>
              <div className="text-xs text-bitcoin-white-60 mt-1 truncate">Key Level</div>
            </div>
          </div>

          <div className="stat-card p-2 sm:p-3 rounded-xl animate-fade-in-delay-2 min-h-[48px] overflow-hidden">
            <div className="text-center">
              <div className="stat-label text-xs mb-1 truncate">EMA 20</div>
              <div className="text-xs sm:text-sm font-black font-mono text-bitcoin-white break-words">
                {tradeSignal.technicalIndicators?.ema20 ? formatPrice(tradeSignal.technicalIndicators.ema20) : 'N/A'}
              </div>
              <div className="text-xs text-bitcoin-white-60 mt-1 truncate">Short Term</div>
            </div>
          </div>

          <div className="stat-card p-2 sm:p-3 rounded-xl animate-fade-in-delay-3 min-h-[48px] overflow-hidden">
            <div className="text-center">
              <div className="stat-label text-xs mb-1 truncate">EMA 50</div>
              <div className="text-xs sm:text-sm font-black font-mono text-bitcoin-white break-words">
                {tradeSignal.technicalIndicators?.ema50 ? formatPrice(tradeSignal.technicalIndicators.ema50) : 'N/A'}
              </div>
              <div className="text-xs text-bitcoin-white-60 mt-1 truncate">Long Term</div>
            </div>
          </div>
        </div>

        {/* Additional Technical Indicators Row */}
        {(tradeSignal.technicalIndicators?.atr || tradeSignal.technicalIndicators?.stochastic || tradeSignal.technicalIndicators?.bollinger) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 overflow-hidden">
            {tradeSignal.technicalIndicators?.atr && (
              <div className="stat-card p-2 sm:p-3 rounded-xl animate-fade-in-delay-1 min-h-[48px] overflow-hidden">
                <div className="text-center">
                  <div className="stat-label text-xs mb-1 truncate">ATR</div>
                  <div className="text-xs sm:text-sm font-black font-mono text-bitcoin-white break-words">
                    {formatPrice(tradeSignal.technicalIndicators.atr)}
                  </div>
                  <div className="text-xs text-bitcoin-white-60 mt-1 truncate">Volatility</div>
                </div>
              </div>
            )}
            
            {tradeSignal.technicalIndicators?.stochastic && (
              <div className="stat-card p-2 sm:p-3 rounded-xl animate-fade-in-delay-2 min-h-[48px] overflow-hidden">
                <div className="text-center">
                  <div className="stat-label text-xs mb-1 truncate">Stochastic</div>
                  <div className={`text-base sm:text-lg font-black font-mono break-words ${tradeSignal.technicalIndicators.stochastic === 'OVERBOUGHT' ? 'text-bitcoin-orange' : tradeSignal.technicalIndicators.stochastic === 'OVERSOLD' ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
                    {tradeSignal.technicalIndicators.stochastic}
                  </div>
                  <div className="text-xs text-bitcoin-white-60 mt-1 truncate">Oscillator</div>
                </div>
              </div>
            )}
            
            {tradeSignal.technicalIndicators?.bollinger && (
              <div className="stat-card p-2 sm:p-3 rounded-xl animate-fade-in-delay-3 min-h-[48px] overflow-hidden">
                <div className="text-center">
                  <div className="stat-label text-xs mb-1 truncate">Bollinger</div>
                  <div className="text-base sm:text-lg font-black font-mono text-bitcoin-white break-words">
                    {tradeSignal.technicalIndicators.bollinger}
                  </div>
                  <div className="text-xs text-bitcoin-white-60 mt-1 truncate">Bands</div>
                </div>
              </div>
            )}
          </div>
        )}

        
        {/* Market Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 overflow-hidden">
          <div className="stat-card p-3 sm:p-4 rounded-xl animate-slide-up overflow-hidden">
            <div className="text-center">
              <div className="stat-label text-xs sm:text-sm mb-2 truncate">MARKET CONDITIONS</div>
              <div className="text-xs sm:text-sm text-bitcoin-white leading-relaxed break-words line-clamp-3">{tradeSignal.marketConditions}</div>
            </div>
          </div>

          <div className="stat-card p-3 sm:p-4 rounded-xl animate-slide-up-delay overflow-hidden">
            <div className="text-center">
              <div className="stat-label text-xs sm:text-sm mb-2 truncate">EXPECTED DURATION</div>
              <div className="stat-value text-base sm:text-lg break-words truncate">{tradeSignal.expectedDuration}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6 overflow-hidden">
        <h4 className="text-base sm:text-lg font-black text-bitcoin-white text-center border-b-2 border-bitcoin-orange pb-2 sm:pb-3 animate-slide-up break-words px-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          🤖 AI Analysis & Reasoning
        </h4>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="stat-card p-3 sm:p-4 rounded-xl animate-fade-in-delay-1 overflow-hidden">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3 min-w-0">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-bitcoin-orange flex-shrink-0" />
              <h5 className="text-xs sm:text-sm font-bold text-bitcoin-white truncate">Market Analysis</h5>
            </div>
            <p className="text-xs sm:text-sm text-bitcoin-white-80 leading-relaxed break-words line-clamp-6">{tradeSignal.analysis}</p>
          </div>

          <div className="stat-card p-3 sm:p-4 rounded-xl animate-fade-in-delay-2 overflow-hidden">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3 min-w-0">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-bitcoin-orange flex-shrink-0" />
              <h5 className="text-xs sm:text-sm font-bold text-bitcoin-white truncate">Trade Reasoning</h5>
            </div>
            <p className="text-xs sm:text-sm text-bitcoin-white-80 leading-relaxed break-words line-clamp-6">{tradeSignal.reasoning}</p>
          </div>
        </div>

        {/* Sentiment Analysis */}
        {tradeSignal.sentimentAnalysis && (
          <div className="stat-card p-3 sm:p-4 rounded-xl animate-fade-in-delay-3 overflow-hidden">
            <h5 className="text-xs sm:text-sm font-bold text-bitcoin-orange mb-2 break-words truncate">Market Sentiment Analysis:</h5>
            <p className="text-xs sm:text-sm text-bitcoin-white-80 leading-relaxed break-words line-clamp-4">{tradeSignal.sentimentAnalysis}</p>
          </div>
        )}

        {/* News Impact Analysis */}
        {tradeSignal.newsImpact && (
          <div className="stat-card p-3 sm:p-4 rounded-xl animate-fade-in-delay-1 overflow-hidden">
            <h5 className="text-xs sm:text-sm font-bold text-bitcoin-orange mb-2 break-words truncate">Live News Impact:</h5>
            <p className="text-xs sm:text-sm text-bitcoin-white-80 leading-relaxed break-words line-clamp-4">{tradeSignal.newsImpact}</p>
          </div>
        )}
      </div>

      {/* Enhanced Data Quality Status */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 stat-card rounded-xl overflow-hidden">
        <div className="flex flex-col gap-2 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
              <span className="px-3 py-2 rounded-lg border-2 border-bitcoin-orange font-bold text-bitcoin-orange bg-bitcoin-black min-h-[48px] flex items-center justify-center w-fit flex-shrink-0">
                🔴 RELIABLE LIVE DATA
              </span>
              <span className="text-bitcoin-white-80 font-medium break-words line-clamp-2">
                Real-time {selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'} data from CoinMarketCap/CoinGecko APIs
              </span>
            </div>
            <span className="text-bitcoin-white-80 font-bold text-xs break-words flex-shrink-0">
              Generated: {tradeSignal?.timestamp ? formatDate(tradeSignal.timestamp) : 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Data Quality Metrics */}
        {tradeSignal?.dataQuality && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs overflow-hidden">
            <div className="bg-bitcoin-black p-2 sm:p-3 rounded-lg border-2 border-bitcoin-orange-20 overflow-hidden">
              <div className="font-bold text-bitcoin-orange mb-1 truncate">Exchanges</div>
              <div className="text-bitcoin-white break-words truncate">{tradeSignal.dataQuality.exchangesCovered || 'N/A'}</div>
            </div>
            <div className="bg-bitcoin-black p-2 sm:p-3 rounded-lg border-2 border-bitcoin-orange-20 overflow-hidden">
              <div className="font-bold text-bitcoin-orange mb-1 truncate">Indicators</div>
              <div className="text-bitcoin-white break-words truncate">{tradeSignal.dataQuality.technicalIndicators || 'N/A'}</div>
            </div>
            <div className="bg-bitcoin-black p-2 sm:p-3 rounded-lg border-2 border-bitcoin-orange-20 overflow-hidden">
              <div className="font-bold text-bitcoin-orange mb-1 truncate">Sentiment</div>
              <div className="text-bitcoin-white break-words truncate">{tradeSignal.dataQuality.sentimentSources || 'N/A'}</div>
            </div>
            <div className="bg-bitcoin-black p-2 sm:p-3 rounded-lg border-2 border-bitcoin-orange-20 overflow-hidden">
              <div className="font-bold text-bitcoin-orange mb-1 truncate">Spread</div>
              <div className="text-bitcoin-white truncate">{tradeSignal.dataQuality.priceSpread ? tradeSignal.dataQuality.priceSpread.toFixed(3) + '%' : 'N/A'}</div>
            </div>
          </div>
        )}
        
        <div className="mt-3 text-xs text-bitcoin-white-80 bg-bitcoin-black p-3 rounded-lg border-2 border-bitcoin-orange-20 overflow-hidden">
          <strong className="break-words text-bitcoin-orange">Reliable Live Integration:</strong> <span className="break-words line-clamp-3">This signal uses real-time data from CoinMarketCap (primary) or CoinGecko (fallback). All data is validated for accuracy and freshness before analysis.</span>
        </div>
        
        {/* Arbitrage & Liquidity Analysis */}
        {tradeSignal?.arbitrageOpportunity && (
          <div className="mt-2 text-xs text-bitcoin-white-80 bg-bitcoin-black p-3 rounded-lg border-2 border-bitcoin-orange-20 overflow-hidden">
            <strong className="text-bitcoin-orange">Cross-Exchange Analysis:</strong> <span className="break-words line-clamp-3">{tradeSignal.arbitrageOpportunity}</span>
          </div>
        )}
        
        {tradeSignal?.liquidityAnalysis && (
          <div className="mt-2 text-xs text-bitcoin-white-80 bg-bitcoin-black p-3 rounded-lg border-2 border-bitcoin-orange-20 overflow-hidden">
            <strong className="text-bitcoin-orange">Liquidity Assessment:</strong> <span className="break-words line-clamp-3">{tradeSignal.liquidityAnalysis}</span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 stat-card rounded-xl border-bitcoin-orange overflow-hidden">
        <div className="flex items-start space-x-2 min-w-0">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-bitcoin-orange mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-bitcoin-white-80 leading-relaxed break-words min-w-0">
            <strong className="text-bitcoin-orange">Risk Disclaimer:</strong> This trade signal is generated by AI analysis and is for educational purposes only. 
            Cryptocurrency trading involves substantial risk of loss. Never risk more than you can afford to lose. 
            Past performance does not guarantee future results. Always conduct your own research and consider consulting with a financial advisor.
          </div>
        </div>
      </div>
    </div>
  )
}
