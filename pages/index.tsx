import Head from 'next/head'
import Navigation from '../components/Navigation'
import { ArrowRight, Zap, Brain, TrendingUp, Shield, Database, Cpu, Activity, Globe, Lock, BarChart3, Newspaper, Users, DollarSign, LineChart, Layers } from 'lucide-react'
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
    const interval = setInterval(fetchMarketData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleOpenMenu = () => {
    if (navigationRef.current?.openMenu) {
      navigationRef.current.openMenu();
    }
  };

  const platformStats = [
    { label: 'AI Models', value: '3+', icon: Brain, description: 'GPT-4o, Caesar AI, Sentiment Analysis' },
    { label: 'Data Sources', value: '15+', icon: Database, description: 'Market, News, Social, DeFi, Derivatives' },
    { label: 'Live APIs', value: '24/7', icon: Activity, description: 'Real-time data aggregation' },
    { label: 'Secure Auth', value: '100%', icon: Lock, description: 'JWT + bcrypt encryption' }
  ];

  const dataSources = [
    {
      category: 'Market Data',
      icon: BarChart3,
      sources: [
        { name: 'CoinGecko', description: 'Primary market data & price feeds', status: 'Live' },
        { name: 'CoinMarketCap Pro', description: 'Premium market intelligence', status: 'Live' },
        { name: 'Kraken Exchange', description: 'Order book & trading data', status: 'Live' },
        { name: 'Alpha Vantage', description: 'Financial data & sentiment', status: 'Live' }
      ]
    },
    {
      category: 'News & Intelligence',
      icon: Newspaper,
      sources: [
        { name: 'NewsAPI', description: 'Global news aggregation', status: 'Live' },
        { name: 'CryptoCompare', description: 'Crypto-specific news', status: 'Live' },
        { name: 'CryptoNews API', description: 'Specialized crypto coverage', status: 'Live' }
      ]
    },
    {
      category: 'Social Sentiment',
      icon: Users,
      sources: [
        { name: 'LunarCrush', description: 'Social metrics & galaxy scores', status: 'Live' },
        { name: 'Twitter/X API', description: 'Tweet analysis & influencers', status: 'Live' },
        { name: 'Reddit API', description: 'Community sentiment tracking', status: 'Live' }
      ]
    },
    {
      category: 'Derivatives & DeFi',
      icon: LineChart,
      sources: [
        { name: 'CoinGlass', description: 'Funding rates & liquidations', status: 'Live' },
        { name: 'DeFiLlama', description: 'TVL & protocol metrics', status: 'Live' },
        { name: 'Bybit', description: 'Derivatives data', status: 'Available' },
        { name: 'Deribit', description: 'Options data', status: 'Available' },
        { name: 'Messari', description: 'Fundamental analysis', status: 'Available' }
      ]
    },
    {
      category: 'AI & Research',
      icon: Brain,
      sources: [
        { name: 'OpenAI GPT-4o', description: 'Advanced market analysis', status: 'Live' },
        { name: 'Caesar AI', description: 'Deep research engine', status: 'Live' }
      ]
    }
  ];

  const technologies = [
    {
      name: 'GPT-4o AI Engine',
      description: 'Advanced language model for market analysis, trade generation, and sentiment scoring',
      icon: Brain,
      color: 'text-bitcoin-orange',
      stats: ['Real-time Analysis', 'Trade Signals', 'Risk Management']
    },
    {
      name: 'Caesar AI Research',
      description: 'Deep research engine for whale transaction analysis and market intelligence',
      icon: Cpu,
      color: 'text-bitcoin-orange',
      stats: ['5-7 Min Analysis', 'Source Citations', 'Market Impact']
    },
    {
      name: '15+ Data Sources',
      description: 'Multi-API aggregation from market data, news, social, DeFi, and derivatives',
      icon: Database,
      color: 'text-bitcoin-orange',
      stats: ['Price Feeds', 'News Streams', 'Social Metrics']
    },
    {
      name: 'Real-Time Processing',
      description: 'Live market data with 30-second refresh cycles and instant whale alerts',
      icon: Zap,
      color: 'text-bitcoin-orange',
      stats: ['30s Refresh', 'Live Alerts', 'Instant Updates']
    },
    {
      name: 'Advanced Algorithms',
      description: 'Price aggregation, sentiment analysis, technical indicators, and risk scoring',
      icon: TrendingUp,
      color: 'text-bitcoin-orange',
      stats: ['10+ Indicators', 'Multi-Timeframe', 'Confidence Scores']
    },
    {
      name: 'Enterprise Security',
      description: 'JWT authentication, bcrypt hashing (12 rounds), session management, audit logging',
      icon: Shield,
      color: 'text-bitcoin-orange',
      stats: ['JWT Tokens', 'bcrypt Hash', 'Audit Logs']
    }
  ];

  const features = [
    {
      title: 'Universal Crypto Intelligence',
      icon: '🧠',
      path: '/ucie',
      description: 'Comprehensive multi-asset analysis with 10 integrated intelligence modules',
      stats: ['10 Modules', 'Any Token', 'AI Powered'],
      benefits: [
        'Analyze any cryptocurrency or token',
        'Technical, on-chain, sentiment & DeFi data',
        'Caesar AI research integration',
        'Social sentiment from LunarCrush & Twitter',
        'Derivatives data from CoinGlass'
      ],
      highlight: 'NEW'
    },
    {
      title: 'Crypto News Wire',
      icon: '📰',
      path: '/crypto-news',
      description: 'Real-time news from NewsAPI, CryptoCompare, and CryptoNews with AI sentiment',
      stats: ['15+ Stories', 'Live Updates', '3 Sources'],
      benefits: [
        'Multi-source news aggregation',
        'AI sentiment analysis on every story',
        'Market-moving news alerts',
        'Global coverage with regional focus'
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
        'Automated stop-loss & take-profit',
        'Multi-timeframe analysis (15m-1d)'
      ],
      highlight: 'AI'
    },
    {
      title: 'Bitcoin Market Report',
      icon: '₿',
      path: '/bitcoin-report',
      description: 'Comprehensive Bitcoin analysis with data from CoinGecko, Kraken, and CoinMarketCap',
      stats: ['4 Timeframes', '3 Exchanges', '10+ Indicators'],
      benefits: [
        'Real-time price from multiple exchanges',
        'Supply/demand zone identification',
        'RSI, MACD, Bollinger Bands & more',
        'Order book analysis from Kraken'
      ]
    },
    {
      title: 'Ethereum Market Report',
      icon: '⟠',
      path: '/ethereum-report',
      description: 'Smart contract platform analysis with DeFi insights from DeFiLlama',
      stats: ['4 Timeframes', 'DeFi TVL', 'Gas Metrics'],
      benefits: [
        'Ethereum-specific market intelligence',
        'DeFi protocol TVL tracking',
        'Smart contract platform metrics',
        'Multi-exchange price comparison'
      ]
    },
    {
      title: 'Bitcoin Whale Watch',
      icon: '🐋',
      path: '/whale-watch',
      description: 'Track large Bitcoin transactions with Caesar AI-powered context analysis',
      stats: ['50+ BTC', 'Caesar AI', '5-7 Min'],
      benefits: [
        'Real-time whale transaction detection',
        'AI research on market impact',
        'Exchange flow analysis',
        'Source-cited intelligence reports'
      ],
      highlight: 'AI'
    }
  ];

  return (
    <>
      <Head>
        <title>Bitcoin Sovereign Technology - 15+ Data Sources | AI-Powered Crypto Intelligence</title>
        <meta name="description" content="Advanced cryptocurrency intelligence platform powered by GPT-4o and Caesar AI. 15+ data sources including CoinGecko, Kraken, LunarCrush, CoinGlass, and DeFiLlama." />
        <meta name="keywords" content="bitcoin, cryptocurrency, AI trading, market analysis, whale tracking, GPT-4o, Caesar AI, LunarCrush, CoinGlass, DeFiLlama" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation ref={navigationRef} />

      <div className="min-h-screen bg-bitcoin-black">
        {/* Live Market Data Banner */}
        <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
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

              <div className="hidden md:block w-px h-8 bg-bitcoin-orange opacity-20"></div>

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

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-bitcoin-orange rounded-full animate-pulse"></div>
                <span className="text-xs text-bitcoin-white-60 uppercase tracking-wider">Live</span>
              </div>
              
              <div className="md:hidden">
                <a 
                  href="https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
                  aria-label="Price data by CoinGecko"
                >
                  via CG
                </a>
              </div>
              
              <div className="hidden md:block">
                <a 
                  href="https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors whitespace-nowrap"
                  aria-label="Price data by CoinGecko"
                >
                  via CoinGecko
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-5xl mx-auto mb-16">
            <div className="inline-block bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
              15+ Data Sources • 3 AI Models • Real-Time Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-bitcoin-white mb-6" style={{ textShadow: '0 0 40px rgba(247, 147, 26, 0.3)' }}>
              Bitcoin Sovereign Technology
            </h1>
            <p className="text-xl md:text-2xl text-bitcoin-white-80 mb-4">
              The Most Comprehensive Cryptocurrency Intelligence Platform
            </p>
            <p className="text-base md:text-lg text-bitcoin-white-60 mb-8 max-w-3xl mx-auto">
              Powered by GPT-4o AI, Caesar Research Engine, and 15+ premium data sources including CoinGecko, Kraken, LunarCrush, CoinGlass, DeFiLlama, and more
            </p>
            
            <button
              onClick={handleOpenMenu}
              className="inline-flex items-center gap-3 bg-bitcoin-orange text-bitcoin-black px-8 py-4 rounded-lg font-bold text-lg uppercase tracking-wider hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95"
            >
              Explore Intelligence Modules
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {platformStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-6 text-center hover:border-bitcoin-orange transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
                  <Icon className="w-8 h-8 text-bitcoin-orange mx-auto mb-3" />
                  <div className="font-mono text-3xl font-bold text-bitcoin-orange mb-2" style={{ textShadow: '0 0 20px rgba(247, 147, 26, 0.4)' }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-bitcoin-white font-semibold uppercase tracking-wider mb-2">
                    {stat.label}
                  </div>
                  <div className="text-xs text-bitcoin-white-60">
                    {stat.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Sources Showcase */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-white text-center mb-4">
              15+ Premium Data Sources
            </h2>
            <p className="text-center text-bitcoin-white-60 mb-12 max-w-3xl mx-auto">
              We aggregate data from the industry's leading providers to deliver the most comprehensive cryptocurrency intelligence available
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dataSources.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div key={index} className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg overflow-hidden hover:border-bitcoin-orange transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]">
                    <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 text-bitcoin-orange" />
                        <h3 className="text-xl font-bold text-bitcoin-white">
                          {category.category}
                        </h3>
                        <span className="ml-auto bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-2 py-1 rounded">
                          {category.sources.length} Sources
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {category.sources.map((source, sourceIndex) => (
                          <div key={sourceIndex} className="flex items-start gap-3 pb-4 border-b border-bitcoin-orange-20 last:border-0 last:pb-0">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-2 h-2 rounded-full ${source.status === 'Live' ? 'bg-bitcoin-orange animate-pulse' : 'bg-bitcoin-white-60'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="text-sm font-bold text-bitcoin-white">
                                  {source.name}
                                </h4>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${source.status === 'Live' ? 'bg-bitcoin-orange-10 text-bitcoin-orange' : 'bg-bitcoin-white-10 text-bitcoin-white-60'}`}>
                                  {source.status}
                                </span>
                              </div>
                              <p className="text-xs text-bitcoin-white-60">
                                {source.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technology Stack */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-white text-center mb-4">
              Powered By Advanced Technology
            </h2>
            <p className="text-center text-bitcoin-white-60 mb-12 max-w-3xl mx-auto">
              Cutting-edge AI models, real-time processing, and enterprise-grade security infrastructure
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {technologies.map((tech, index) => {
                const Icon = tech.icon;
                return (
                  <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-6 hover:border-bitcoin-orange transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <Icon className={`w-8 h-8 ${tech.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-bitcoin-white mb-2">
                          {tech.name}
                        </h3>
                        <p className="text-sm text-bitcoin-white-60 mb-3">
                          {tech.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tech.stats.map((stat, statIndex) => (
                        <span key={statIndex} className="bg-bitcoin-orange-10 text-bitcoin-orange text-xs font-semibold px-3 py-1 rounded-full border border-bitcoin-orange-20">
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-white text-center mb-4">
              Intelligence Modules
            </h2>
            <p className="text-center text-bitcoin-white-60 mb-12 max-w-3xl mx-auto">
              Six powerful modules providing comprehensive cryptocurrency analysis and trading intelligence
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg overflow-hidden hover:border-bitcoin-orange transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] group">
                  <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">{feature.icon}</span>
                      {feature.highlight && (
                        <span className="bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-2 py-1 rounded uppercase">
                          {feature.highlight}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-bitcoin-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-bitcoin-white-60 italic">
                      {feature.description}
                    </p>
                  </div>

                  <div className="px-6 py-4 border-b border-bitcoin-orange-20">
                    <div className="flex flex-wrap gap-2">
                      {feature.stats.map((stat, statIndex) => (
                        <span key={statIndex} className="bg-bitcoin-orange-10 text-bitcoin-orange text-xs font-semibold px-3 py-1 rounded-full border border-bitcoin-orange-20">
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start gap-2 text-sm text-bitcoin-white-80">
                          <span className="text-bitcoin-orange mt-1">●</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-6 py-4 border-t border-bitcoin-orange-20">
                    <button
                      onClick={handleOpenMenu}
                      className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] flex items-center justify-center gap-2"
                    >
                      Access Module
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Differentiators */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-8 mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-white text-center mb-12">
              Why Bitcoin Sovereign Technology?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6" />
                  Triple AI Integration
                </h3>
                <ul className="space-y-3 text-bitcoin-white-80">
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>GPT-4o:</strong> Advanced language model for market analysis, trade generation, and sentiment scoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>Caesar AI:</strong> Deep research engine for whale transaction analysis with source citations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>Sentiment AI:</strong> Real-time news and social sentiment analysis across multiple platforms</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2">
                  <Database className="w-6 h-6" />
                  15+ Premium Data Sources
                </h3>
                <ul className="space-y-3 text-bitcoin-white-80">
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>Market Data:</strong> CoinGecko, CoinMarketCap Pro, Kraken, Alpha Vantage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>Social Intelligence:</strong> LunarCrush, Twitter/X API, Reddit API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>Derivatives & DeFi:</strong> CoinGlass, DeFiLlama, Bybit, Deribit, Messari</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  Real-Time Intelligence
                </h3>
                <ul className="space-y-3 text-bitcoin-white-80">
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>Live Market Data:</strong> 30-second refresh cycles for price, volume, and order book data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>Instant Whale Alerts:</strong> Real-time detection of large transactions (50+ BTC)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>News Aggregation:</strong> 15+ stories updated continuously from multiple sources</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Enterprise Security
                </h3>
                <ul className="space-y-3 text-bitcoin-white-80">
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>JWT Authentication:</strong> Secure token-based authentication with httpOnly cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>bcrypt Hashing:</strong> Industry-standard password encryption with 12 salt rounds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">●</span>
                    <span><strong>Audit Logging:</strong> Comprehensive session management and event tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-bitcoin-orange rounded-lg p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-black mb-4">
              Experience the Most Comprehensive Crypto Intelligence
            </h2>
            <p className="text-lg text-bitcoin-black mb-8 opacity-90">
              15+ data sources • 3 AI models • Real-time processing • Enterprise security
            </p>
            <button
              onClick={handleOpenMenu}
              className="inline-flex items-center gap-3 bg-bitcoin-black text-bitcoin-orange px-8 py-4 rounded-lg font-bold text-lg uppercase tracking-wider hover:bg-bitcoin-white hover:text-bitcoin-black border-2 border-bitcoin-black transition-all hover:scale-105 active:scale-95"
            >
              Open Intelligence Menu
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-bitcoin-orange-20">
          <div className="container mx-auto px-4">
            {/* Data Source Attribution */}
            <div className="text-center py-6 mb-6">
              <p className="text-sm text-bitcoin-white-60 mb-4">
                Powered by premium data from industry-leading providers
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-xs text-bitcoin-white-60">
                <span>CoinGecko</span>
                <span>•</span>
                <span>CoinMarketCap</span>
                <span>•</span>
                <span>Kraken</span>
                <span>•</span>
                <span>LunarCrush</span>
                <span>•</span>
                <span>CoinGlass</span>
                <span>•</span>
                <span>DeFiLlama</span>
                <span>•</span>
                <span>NewsAPI</span>
                <span>•</span>
                <span>OpenAI</span>
                <span>•</span>
                <span>Caesar AI</span>
              </div>
            </div>

            {/* CoinGecko Attribution */}
            <div className="text-center py-6 border-t border-bitcoin-orange-20">
              <p className="text-xs text-bitcoin-white-60 mb-3">
                Primary market data powered by
              </p>
              <a 
                href="https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="CoinGecko - Cryptocurrency Data"
              >
                <svg 
                  width="120" 
                  height="30" 
                  viewBox="0 0 276 60" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-auto"
                >
                  <path d="M30 0C13.4315 0 0 13.4315 0 30C0 46.5685 13.4315 60 30 60C46.5685 60 60 46.5685 60 30C60 13.4315 46.5685 0 30 0Z" fill="#8DC63F"/>
                  <path d="M30 15C21.7157 15 15 21.7157 15 30C15 38.2843 21.7157 45 30 45C38.2843 45 45 38.2843 45 30C45 21.7157 38.2843 15 30 15Z" fill="white"/>
                  <circle cx="25" cy="27" r="3" fill="#8DC63F"/>
                  <circle cx="35" cy="27" r="3" fill="#8DC63F"/>
                  <path d="M25 35C25 35 27.5 37 30 37C32.5 37 35 35 35 35" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"/>
                  <text x="70" y="40" fill="#8DC63F" fontSize="24" fontFamily="Inter, sans-serif" fontWeight="700">
                    CoinGecko
                  </text>
                </svg>
              </a>
            </div>
            
            {/* Copyright */}
            <div className="text-center py-6 border-t border-bitcoin-orange-20">
              <p className="text-xs text-bitcoin-white-60">
                © 2025 Bitcoin Sovereign Technology. All rights reserved.
              </p>
              <p className="text-xs text-bitcoin-white-60 mt-2">
                Powered by GPT-4o, Caesar AI, and 15+ premium data sources
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
