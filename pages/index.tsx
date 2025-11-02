import Head from 'next/head'
import Navigation from '../components/Navigation'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  // Live market data state
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [btcChange, setBtcChange] = useState<number | null>(null);
  const [ethChange, setEthChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation ref for menu control
  const navigationRef = useRef<{ openMenu: () => void }>(null);

  // Fetch live market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();
        
        if (data.bitcoin) {
          setBtcPrice(data.bitcoin.usd);
          setBtcChange(data.bitcoin.usd_24h_change);
        }
        
        if (data.ethereum) {
          setEthPrice(data.ethereum.usd);
          setEthChange(data.ethereum.usd_24h_change);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        setLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Function to open menu
  const handleOpenMenu = () => {
    if (navigationRef.current?.openMenu) {
      navigationRef.current.openMenu();
    }
  };

  const features = [
    {
      title: 'Crypto News Wire',
      icon: '📰',
      path: '/crypto-news',
      description: 'Real-time cryptocurrency news aggregation with AI-powered sentiment analysis',
      stats: ['15+ Stories', 'Live Updates', 'Multi-Source'],
      benefits: [
        'Stay ahead of market-moving news',
        'AI sentiment analysis on every story',
        'Aggregated from NewsAPI & CryptoCompare'
      ]
    },
    {
      title: 'AI Trade Generation Engine',
      icon: '🤖',
      path: '/trade-generation',
      description: 'GPT-4o powered trading signals with step-by-step reasoning and risk management',
      stats: ['GPT-4o AI', 'Live Signals', 'Risk Managed'],
      benefits: [
        'AI-powered trade recommendations',
        'Confidence scoring and reasoning',
        'Automated stop-loss & take-profit levels'
      ]
    },
    {
      title: 'Bitcoin Market Report',
      icon: '₿',
      path: '/bitcoin-report',
      description: 'Comprehensive Bitcoin analysis with multi-timeframe technical indicators',
      stats: ['4 Timeframes', 'Live Data', '10+ Indicators'],
      benefits: [
        'Real-time price and volume analysis',
        'Supply/demand zone identification',
        'RSI, MACD, Bollinger Bands & more'
      ]
    },
    {
      title: 'Ethereum Market Report',
      icon: '⟠',
      path: '/ethereum-report',
      description: 'Smart contract platform analysis with DeFi insights and technical indicators',
      stats: ['4 Timeframes', 'Live Data', 'DeFi Focus'],
      benefits: [
        'Ethereum-specific market intelligence',
        'Smart contract platform metrics',
        'Multi-exchange price comparison'
      ]
    },
    {
      title: 'Bitcoin Whale Watch',
      icon: '🐋',
      path: '/whale-watch',
      description: 'Track large Bitcoin transactions with Caesar AI-powered context analysis',
      stats: ['50+ BTC', 'Caesar AI', 'Live Tracking'],
      benefits: [
        'Real-time whale transaction detection',
        'AI research on market impact',
        'Exchange flow analysis'
      ]
    },
    {
      title: 'Regulatory Watch',
      icon: '⚖️',
      path: '/regulatory-watch',
      description: 'Monitor cryptocurrency regulatory developments and compliance updates',
      stats: ['NEXO.COM', 'UK Focus', 'Live Updates'],
      benefits: [
        'Latest regulatory news',
        'Compliance monitoring',
        'Market impact assessment'
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>Bitcoin Sovereign Technology - Real-Time Market Intelligence</title>
        <meta name="description" content="Advanced cryptocurrency trading intelligence platform with AI-powered analysis, whale tracking, and real-time market data" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation ref={navigationRef} />

      <div className="min-h-screen bg-bitcoin-black">
        {/* Live Market Data Banner */}
        <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              {/* BTC Price */}
              <div className="flex items-center gap-3">
                <span className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider">BTC</span>
                {loading ? (
                  <div className="font-mono text-xl md:text-2xl text-bitcoin-orange animate-pulse">Loading...</div>
                ) : (
                  <>
                    <div className="font-mono text-xl md:text-2xl font-bold text-bitcoin-orange" style={{ textShadow: '0 0 20px rgba(247, 147, 26, 0.5)' }}>
                      ${btcPrice?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    {btcChange !== null && (
                      <div className={`text-sm font-mono ${btcChange >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                        {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-8 bg-bitcoin-orange opacity-20"></div>

              {/* ETH Price */}
              <div className="flex items-center gap-3">
                <span className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider">ETH</span>
                {loading ? (
                  <div className="font-mono text-xl md:text-2xl text-bitcoin-orange animate-pulse">Loading...</div>
                ) : (
                  <>
                    <div className="font-mono text-xl md:text-2xl font-bold text-bitcoin-orange" style={{ textShadow: '0 0 20px rgba(247, 147, 26, 0.5)' }}>
                      ${ethPrice?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    {ethChange !== null && (
                      <div className={`text-sm font-mono ${ethChange >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                        {ethChange >= 0 ? '+' : ''}{ethChange.toFixed(2)}%
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Live Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-bitcoin-orange rounded-full animate-pulse"></div>
                <span className="text-xs text-bitcoin-white-60 uppercase tracking-wider">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold text-bitcoin-white mb-6 leading-tight" style={{ letterSpacing: '-0.03em' }}>
              Bitcoin Sovereign Technology
            </h1>
            <p className="text-2xl md:text-3xl text-bitcoin-orange font-mono mb-6 font-bold" style={{ textShadow: '0 0 30px rgba(247, 147, 26, 0.3)' }}>
              Real-Time Market Intelligence
            </p>
            <p className="text-lg md:text-xl text-bitcoin-white-80 mb-12 leading-relaxed max-w-3xl mx-auto">
              Advanced cryptocurrency trading intelligence powered by AI. Real-time market analysis, 
              whale tracking, and automated trade generation for professional traders and crypto enthusiasts.
            </p>
            
            {/* Key Stats with Orange Glow */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12">
              <div className="bitcoin-block-subtle p-6 hover:border-bitcoin-orange transition-all">
                <div className="text-4xl md:text-5xl font-bold text-bitcoin-orange font-mono mb-2" style={{ textShadow: '0 0 30px rgba(247, 147, 26, 0.5)' }}>
                  24/7
                </div>
                <div className="text-sm text-bitcoin-white-60 uppercase tracking-wider font-semibold">Live Monitoring</div>
              </div>
              <div className="bitcoin-block-subtle p-6 hover:border-bitcoin-orange transition-all">
                <div className="text-4xl md:text-5xl font-bold text-bitcoin-orange font-mono mb-2" style={{ textShadow: '0 0 30px rgba(247, 147, 26, 0.5)' }}>
                  6
                </div>
                <div className="text-sm text-bitcoin-white-60 uppercase tracking-wider font-semibold">AI Features</div>
              </div>
              <div className="bitcoin-block-subtle p-6 hover:border-bitcoin-orange transition-all">
                <div className="text-3xl md:text-4xl font-bold text-bitcoin-orange font-mono mb-2" style={{ textShadow: '0 0 30px rgba(247, 147, 26, 0.5)' }}>
                  GPT-4o
                </div>
                <div className="text-sm text-bitcoin-white-60 uppercase tracking-wider font-semibold">AI Engine</div>
              </div>
              <div className="bitcoin-block-subtle p-6 hover:border-bitcoin-orange transition-all">
                <div className="text-3xl md:text-4xl font-bold text-bitcoin-orange font-mono mb-2" style={{ textShadow: '0 0 30px rgba(247, 147, 26, 0.5)' }}>
                  Caesar
                </div>
                <div className="text-sm text-bitcoin-white-60 uppercase tracking-wider font-semibold">Research AI</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid - Informational Only */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h2 className="text-3xl md:text-4xl font-bold text-bitcoin-white text-center mb-4">
            Intelligence Features
          </h2>
          <p className="text-center text-bitcoin-white-60 mb-12 max-w-2xl mx-auto">
            Access all features through the menu. Each feature provides real-time data and AI-powered analysis.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.path} className="bitcoin-block transition-all h-full">
                {/* Header */}
                <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl">{feature.icon}</span>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {feature.stats.map((stat, idx) => (
                        <span key={idx} className="bg-bitcoin-orange text-bitcoin-black text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-bitcoin-white">
                    {feature.title}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-bitcoin-white-80 mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Benefits */}
                  <div className="space-y-2 mb-6">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-bitcoin-orange mt-1 flex-shrink-0">✓</span>
                        <span className="text-sm text-bitcoin-white-60">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Access via Menu Indicator - Now Clickable */}
                  <div className="mt-auto pt-4 border-t border-bitcoin-orange-20">
                    <button
                      onClick={handleOpenMenu}
                      className="w-full flex items-center justify-center gap-2 text-bitcoin-orange hover:text-bitcoin-white transition-all duration-300 py-2 px-4 rounded-lg hover:bg-bitcoin-orange-10 active:scale-95 min-h-[48px]"
                      aria-label={`Open menu to access ${feature.title}`}
                    >
                      <span className="text-sm font-semibold uppercase tracking-wider">Access via Menu</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology & Intelligence Section */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-bitcoin-white mb-4" style={{ letterSpacing: '-0.02em' }}>
                Advanced Intelligence Architecture
              </h2>
              <p className="text-xl text-bitcoin-orange font-mono font-bold mb-4" style={{ textShadow: '0 0 20px rgba(247, 147, 26, 0.3)' }}>
                Multi-Layer AI • Real-Time Analysis • Predictive Modeling
              </p>
              <p className="text-lg text-bitcoin-white-60 max-w-3xl mx-auto">
                Our platform combines cutting-edge AI models with sophisticated mathematical analysis 
                to deliver institutional-grade cryptocurrency intelligence.
              </p>
            </div>

            {/* AI Stack */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* GPT-4o Analysis Engine */}
              <div className="bitcoin-block">
                <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">🧠</span>
                    <span className="bg-bitcoin-orange text-bitcoin-black text-xs px-3 py-1 rounded font-bold">
                      GPT-4o
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-bitcoin-white">
                    Neural Market Analysis
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-bitcoin-white-80 mb-4 leading-relaxed">
                    OpenAI's most advanced model processes multi-dimensional market data, 
                    generating trade signals with step-by-step reasoning and confidence scoring.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Natural language market interpretation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Pattern recognition across timeframes</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Risk-adjusted position sizing</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caesar Research AI */}
              <div className="bitcoin-block">
                <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">🔬</span>
                    <span className="bg-bitcoin-orange text-bitcoin-black text-xs px-3 py-1 rounded font-bold">
                      Caesar AI
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-bitcoin-white">
                    Deep Research Engine
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-bitcoin-white-80 mb-4 leading-relaxed">
                    Specialized research AI that analyzes whale transactions, providing context 
                    and market impact assessment with cited sources and confidence metrics.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Multi-source intelligence gathering</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Transaction context analysis</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Market impact prediction</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gemini Flash Analysis */}
              <div className="bitcoin-block">
                <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">⚡</span>
                    <span className="bg-bitcoin-orange text-bitcoin-black text-xs px-3 py-1 rounded font-bold">
                      Gemini 2.5
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-bitcoin-white">
                    Real-Time Processing
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-bitcoin-white-80 mb-4 leading-relaxed">
                    Google's Gemini 2.5 Flash provides sub-3-second whale transaction analysis 
                    with thinking mode transparency, showing AI reasoning in real-time.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Ultra-fast inference (< 3 seconds)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Transparent reasoning process</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Adaptive model selection</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Analysis Engine */}
              <div className="bitcoin-block">
                <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">📊</span>
                    <span className="bg-bitcoin-orange text-bitcoin-black text-xs px-3 py-1 rounded font-bold">
                      Multi-Indicator
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-bitcoin-white">
                    Mathematical Analysis
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-bitcoin-white-80 mb-4 leading-relaxed">
                    Proprietary algorithms combine 10+ technical indicators across 4 timeframes, 
                    identifying supply/demand zones and momentum shifts with precision.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">RSI, MACD, Bollinger Bands, ATR</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Multi-timeframe confluence detection</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-bitcoin-orange mt-1">▸</span>
                      <span className="text-sm text-bitcoin-white-60">Volume-weighted price analysis</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bitcoin-block mb-12">
              <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
                <h3 className="text-2xl font-bold text-bitcoin-white">
                  Multi-Source Data Aggregation
                </h3>
                <p className="text-sm text-bitcoin-white-60 italic mt-1">
                  Real-time feeds from leading exchanges and data providers
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border border-bitcoin-orange-20 rounded-lg hover:border-bitcoin-orange transition-all">
                    <div className="font-mono text-lg font-bold text-bitcoin-orange mb-1">Kraken</div>
                    <div className="text-xs text-bitcoin-white-60">Live Trading Data</div>
                  </div>
                  <div className="text-center p-4 border border-bitcoin-orange-20 rounded-lg hover:border-bitcoin-orange transition-all">
                    <div className="font-mono text-lg font-bold text-bitcoin-orange mb-1">CoinGecko</div>
                    <div className="text-xs text-bitcoin-white-60">Market Data</div>
                  </div>
                  <div className="text-center p-4 border border-bitcoin-orange-20 rounded-lg hover:border-bitcoin-orange transition-all">
                    <div className="font-mono text-lg font-bold text-bitcoin-orange mb-1">NewsAPI</div>
                    <div className="text-xs text-bitcoin-white-60">News Aggregation</div>
                  </div>
                  <div className="text-center p-4 border border-bitcoin-orange-20 rounded-lg hover:border-bitcoin-orange transition-all">
                    <div className="font-mono text-lg font-bold text-bitcoin-orange mb-1">Blockchain.com</div>
                    <div className="text-xs text-bitcoin-white-60">On-Chain Data</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Predictive Capabilities */}
            <div className="bitcoin-block-orange mb-12">
              <div className="p-8">
                <h3 className="text-3xl font-bold text-bitcoin-black mb-6 text-center">
                  Predictive Intelligence Framework
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-bitcoin-black font-mono mb-2">
                      4
                    </div>
                    <div className="text-sm text-bitcoin-black font-semibold uppercase tracking-wider mb-2">
                      Timeframes
                    </div>
                    <div className="text-xs text-bitcoin-black opacity-80">
                      15m • 1h • 4h • 1d
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-bitcoin-black font-mono mb-2">
                      10+
                    </div>
                    <div className="text-sm text-bitcoin-black font-semibold uppercase tracking-wider mb-2">
                      Indicators
                    </div>
                    <div className="text-xs text-bitcoin-black opacity-80">
                      Technical & Fundamental
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-bitcoin-black font-mono mb-2">
                      3
                    </div>
                    <div className="text-sm text-bitcoin-black font-semibold uppercase tracking-wider mb-2">
                      AI Models
                    </div>
                    <div className="text-xs text-bitcoin-black opacity-80">
                      GPT-4o • Caesar • Gemini
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mathematical Approach */}
            <div className="bitcoin-block">
              <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
                <h3 className="text-2xl font-bold text-bitcoin-white">
                  Quantitative Analysis Methodology
                </h3>
                <p className="text-sm text-bitcoin-white-60 italic mt-1">
                  Proprietary algorithms combining statistical analysis with machine learning
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-bold text-bitcoin-orange mb-3">Price Action Analysis</h4>
                    <p className="text-sm text-bitcoin-white-60 mb-3 leading-relaxed">
                      Multi-dimensional vector analysis of price movements, identifying support/resistance 
                      zones through volume-weighted calculations and order book depth analysis.
                    </p>
                    <div className="font-mono text-xs text-bitcoin-white-60 bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3">
                      <div>Δ = (P<sub>t</sub> - P<sub>t-1</sub>) / P<sub>t-1</sub></div>
                      <div className="mt-1">σ = √(Σ(x - μ)² / n)</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-bitcoin-orange mb-3">Momentum Indicators</h4>
                    <p className="text-sm text-bitcoin-white-60 mb-3 leading-relaxed">
                      Exponential moving averages and rate-of-change calculations detect trend strength 
                      and potential reversals across multiple timeframes with adaptive thresholds.
                    </p>
                    <div className="font-mono text-xs text-bitcoin-white-60 bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3">
                      <div>EMA = P<sub>t</sub> × k + EMA<sub>y</sub> × (1 - k)</div>
                      <div className="mt-1">RSI = 100 - (100 / (1 + RS))</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Capabilities */}
        <div className="container mx-auto px-4 py-16">
          <div className="bitcoin-block">
            <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
              <h3 className="text-2xl font-bold text-bitcoin-white">
                Platform Capabilities
              </h3>
              <p className="text-sm text-bitcoin-white-60 italic mt-1">
                Powered by cutting-edge AI and real-time blockchain data
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bitcoin-block-subtle">
                  <div className="text-bitcoin-orange text-2xl mb-2">⚡</div>
                  <div className="text-bitcoin-white font-bold text-sm">Real-Time Data</div>
                  <div className="text-bitcoin-white-60 text-xs mt-1">Live market feeds</div>
                </div>
                <div className="text-center p-4 bitcoin-block-subtle">
                  <div className="text-bitcoin-orange text-2xl mb-2">🧠</div>
                  <div className="text-bitcoin-white font-bold text-sm">AI Analysis</div>
                  <div className="text-bitcoin-white-60 text-xs mt-1">GPT-4o & Caesar</div>
                </div>
                <div className="text-center p-4 bitcoin-block-subtle">
                  <div className="text-bitcoin-orange text-2xl mb-2">🔒</div>
                  <div className="text-bitcoin-white font-bold text-sm">Privacy First</div>
                  <div className="text-bitcoin-white-60 text-xs mt-1">No tracking</div>
                </div>
                <div className="text-center p-4 bitcoin-block-subtle">
                  <div className="text-bitcoin-orange text-2xl mb-2">📱</div>
                  <div className="text-bitcoin-white font-bold text-sm">Mobile Ready</div>
                  <div className="text-bitcoin-white-60 text-xs mt-1">Fully responsive</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-bitcoin-orange mt-16 bg-bitcoin-black">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-sm text-bitcoin-white-60">
                © 2024 Bitcoin Sovereign Technology • Real-Time Market Intelligence Platform
              </p>
              <p className="text-xs mt-2 italic text-bitcoin-white-60">
                Powered by AI & Live Blockchain Data
              </p>
              
              {/* Privacy Notice */}
              <div className="mt-6 pt-4 border-t border-bitcoin-orange-20">
                <div className="inline-flex items-center space-x-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full px-4 py-2 hover:border-bitcoin-orange transition-all">
                  <span className="text-xs font-mono text-bitcoin-white-80">
                    🍪 Zero Cookies • No Tracking • Privacy First
                  </span>
                </div>
                <p className="text-xs text-bitcoin-white-60 mt-2 max-w-2xl mx-auto">
                  Your privacy matters. We don't use cookies, tracking, or store any personal data. All market data is fetched fresh on each visit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}