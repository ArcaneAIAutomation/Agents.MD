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
    { label: 'AI Models', value: '4+', icon: Brain, description: 'GPT-4o, Gemini, Caesar AI, Sentiment' },
    { label: 'Data Sources', value: '17+', icon: Database, description: 'Market, News, Social, DeFi, Blockchain' },
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
        { name: 'Blockchain.com API', description: 'Blockchain data & statistics', status: 'Live' },
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
        { name: 'Google Gemini', description: 'Multi-modal AI intelligence', status: 'Live' },
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
      name: 'Google Gemini AI',
      description: 'Multi-modal AI for advanced pattern recognition and market intelligence',
      icon: Brain,
      color: 'text-bitcoin-orange',
      stats: ['Multi-Modal', 'Pattern Recognition', 'Deep Analysis']
    },
    {
      name: 'Caesar AI Research',
      description: 'Deep research engine for whale transaction analysis and market intelligence',
      icon: Cpu,
      color: 'text-bitcoin-orange',
      stats: ['5-7 Min Analysis', 'Source Citations', 'Market Impact']
    },
    {
      name: '17+ Data Sources',
      description: 'Multi-API aggregation from market data, news, social, DeFi, blockchain, and derivatives',
      icon: Database,
      color: 'text-bitcoin-orange',
      stats: ['Price Feeds', 'Blockchain Data', 'Social Metrics']
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
        <title>Bitcoin Sovereign Technology - 17+ Data Sources | 4 AI Models | Crypto Intelligence</title>
        <meta name="description" content="Advanced cryptocurrency intelligence platform powered by GPT-4o, Gemini, and Caesar AI. 17+ data sources including CoinGecko, Blockchain.com, Kraken, LunarCrush, CoinGlass, and DeFiLlama." />
        <meta name="keywords" content="bitcoin, cryptocurrency, AI trading, market analysis, whale tracking, GPT-4o, Gemini AI, Caesar AI, Blockchain.com, LunarCrush, CoinGlass, DeFiLlama" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation ref={navigationRef} />

      <div className="min-h-screen bg-bitcoin-black">
        {/* Live Market Data Banner - Mobile/Tablet Optimized */}
        <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black overflow-hidden">
          <div className="container mx-auto px-4 py-4 max-w-full">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 overflow-x-hidden">
              <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                <span className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider flex-shrink-0">BTC</span>
                {loading ? (
                  <div className="font-mono text-xl md:text-2xl text-bitcoin-orange animate-pulse truncate">Loading...</div>
                ) : (
                  <>
                    <div className="font-mono text-xl md:text-2xl font-bold text-bitcoin-orange truncate" style={{ textShadow: '0 0 20px rgba(247, 147, 26, 0.5)' }}>
                      ${btcPrice?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    {btcChange !== null && (
                      <div className={`text-sm font-mono flex-shrink-0 ${btcChange >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                        {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="hidden md:block w-px h-8 bg-bitcoin-orange opacity-20 flex-shrink-0"></div>

              <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                <span className="text-bitcoin-white-60 text-sm font-semibold uppercase tracking-wider flex-shrink-0">ETH</span>
                {loading ? (
                  <div className="font-mono text-xl md:text-2xl text-bitcoin-orange animate-pulse truncate">Loading...</div>
                ) : (
                  <>
                    <div className="font-mono text-xl md:text-2xl font-bold text-bitcoin-orange truncate" style={{ textShadow: '0 0 20px rgba(247, 147, 26, 0.5)' }}>
                      ${ethPrice?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    {ethChange !== null && (
                      <div className={`text-sm font-mono flex-shrink-0 ${ethChange >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                        {ethChange >= 0 ? '+' : ''}{ethChange.toFixed(2)}%
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2 h-2 bg-bitcoin-orange rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-xs text-bitcoin-white-60 uppercase tracking-wider">Live</span>
              </div>
              
              <div className="md:hidden flex-shrink-0">
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
              
              <div className="hidden md:block flex-shrink-0">
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

        {/* Hero Section - Mobile/Tablet Optimized */}
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-full overflow-hidden">
          <div className="text-center max-w-5xl mx-auto mb-16 overflow-hidden">
            <div className="inline-block bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-6 max-w-full">
              <span className="block sm:inline truncate">17+ Data Sources • 4 AI Models • Real-Time Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-bitcoin-white mb-6 break-words" style={{ textShadow: '0 0 40px rgba(247, 147, 26, 0.3)' }}>
              Bitcoin Sovereign Technology
            </h1>
            <p className="text-xl md:text-2xl text-bitcoin-white-80 mb-4 break-words px-2">
              The Most Comprehensive Cryptocurrency Intelligence Platform
            </p>
            <p className="text-base md:text-lg text-bitcoin-white-60 max-w-3xl mx-auto break-words px-2">
              Powered by GPT-4o, Gemini AI, Caesar Research Engine, and 17+ premium data sources including CoinGecko, Blockchain.com, Kraken, LunarCrush, CoinGlass, DeFiLlama, and more
            </p>
          </div>

          {/* Platform Stats - Mobile/Tablet Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16 overflow-hidden">
            {platformStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-6 text-center hover:border-bitcoin-orange transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.2)] overflow-hidden min-w-0">
                  <Icon className="w-8 h-8 text-bitcoin-orange mx-auto mb-3 flex-shrink-0" />
                  <div className="font-mono text-3xl font-bold text-bitcoin-orange mb-2 truncate" style={{ textShadow: '0 0 20px rgba(247, 147, 26, 0.4)' }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-bitcoin-white font-semibold uppercase tracking-wider mb-2 truncate">
                    {stat.label}
                  </div>
                  <div className="text-xs text-bitcoin-white-60 line-clamp-2">
                    {stat.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Sources Showcase - Mobile/Tablet Optimized */}
          <div className="mb-16 overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-white text-center mb-4 break-words px-2">
              17+ Premium Data Sources
            </h2>
            <p className="text-center text-bitcoin-white-60 mb-12 max-w-3xl mx-auto break-words px-4">
              We aggregate data from the industry's leading providers to deliver the most comprehensive cryptocurrency intelligence available
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
              {dataSources.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div key={index} className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg overflow-hidden hover:border-bitcoin-orange transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] min-w-0">
                    <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4 overflow-hidden">
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-6 h-6 text-bitcoin-orange flex-shrink-0" />
                        <h3 className="text-xl font-bold text-bitcoin-white truncate flex-1 min-w-0">
                          {category.category}
                        </h3>
                        <span className="ml-auto bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-2 py-1 rounded flex-shrink-0">
                          {category.sources.length} Sources
                        </span>
                      </div>
                    </div>
                    <div className="p-6 overflow-hidden">
                      <div className="space-y-4">
                        {category.sources.map((source, sourceIndex) => (
                          <div key={sourceIndex} className="flex items-start gap-3 pb-4 border-b border-bitcoin-orange-20 last:border-0 last:pb-0 min-w-0 overflow-hidden">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-2 h-2 rounded-full ${source.status === 'Live' ? 'bg-bitcoin-orange animate-pulse' : 'bg-bitcoin-white-60'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                                <h4 className="text-sm font-bold text-bitcoin-white truncate flex-1 min-w-0">
                                  {source.name}
                                </h4>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${source.status === 'Live' ? 'bg-bitcoin-orange-10 text-bitcoin-orange' : 'bg-bitcoin-white-10 text-bitcoin-white-60'}`}>
                                  {source.status}
                                </span>
                              </div>
                              <p className="text-xs text-bitcoin-white-60 line-clamp-2 break-words">
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

          {/* Technology Stack - Mobile/Tablet Optimized */}
          <div className="mb-16 overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-white text-center mb-4 break-words px-2">
              Powered By Advanced Technology
            </h2>
            <p className="text-center text-bitcoin-white-60 mb-12 max-w-3xl mx-auto break-words px-4">
              Cutting-edge AI models, real-time processing, and enterprise-grade security infrastructure
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
              {technologies.map((tech, index) => {
                const Icon = tech.icon;
                return (
                  <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-6 hover:border-bitcoin-orange transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.2)] overflow-hidden min-w-0">
                    <div className="flex items-start gap-4 mb-4 min-w-0">
                      <div className="flex-shrink-0">
                        <Icon className={`w-8 h-8 ${tech.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="text-lg font-bold text-bitcoin-white mb-2 break-words">
                          {tech.name}
                        </h3>
                        <p className="text-sm text-bitcoin-white-60 mb-3 break-words">
                          {tech.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 overflow-hidden">
                      {tech.stats.map((stat, statIndex) => (
                        <span key={statIndex} className="bg-bitcoin-orange-10 text-bitcoin-orange text-xs font-semibold px-3 py-1 rounded-full border border-bitcoin-orange-20 truncate max-w-full">
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features Grid - Mobile/Tablet Optimized */}
          <div className="mb-16 overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-white text-center mb-4 break-words px-2">
              Intelligence Modules
            </h2>
            <p className="text-center text-bitcoin-white-60 mb-12 max-w-3xl mx-auto break-words px-4">
              Six powerful modules providing comprehensive cryptocurrency analysis and trading intelligence
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
              {features.map((feature, index) => (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg overflow-hidden hover:border-bitcoin-orange transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] group min-w-0">
                  <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-4xl flex-shrink-0">{feature.icon}</span>
                      {feature.highlight && (
                        <span className="bg-bitcoin-orange text-bitcoin-black text-xs font-bold px-2 py-1 rounded uppercase flex-shrink-0">
                          {feature.highlight}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-bitcoin-white mb-2 break-words">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-bitcoin-white-60 italic line-clamp-3 break-words">
                      {feature.description}
                    </p>
                  </div>

                  <div className="px-6 py-4 border-b border-bitcoin-orange-20 overflow-hidden">
                    <div className="flex flex-wrap gap-2">
                      {feature.stats.map((stat, statIndex) => (
                        <span key={statIndex} className="bg-bitcoin-orange-10 text-bitcoin-orange text-xs font-semibold px-3 py-1 rounded-full border border-bitcoin-orange-20 truncate max-w-full">
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-4 overflow-hidden">
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start gap-2 text-sm text-bitcoin-white-80 min-w-0">
                          <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                          <span className="break-words flex-1 min-w-0">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Differentiators - Mobile/Tablet Optimized */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-8 mb-16 overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-white text-center mb-12 break-words px-2">
              Why Bitcoin Sovereign Technology?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">
              <div className="overflow-hidden min-w-0">
                <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2 break-words">
                  <Brain className="w-6 h-6 flex-shrink-0" />
                  <span className="break-words">Quad AI Integration</span>
                </h3>
                <ul className="space-y-3 text-bitcoin-white-80">
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>GPT-4o:</strong> Advanced language model for market analysis, trade generation, and sentiment scoring</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>Google Gemini:</strong> Multi-modal AI for advanced pattern recognition and deep market intelligence</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>Caesar AI:</strong> Deep research engine for whale transaction analysis with source citations</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>Sentiment AI:</strong> Real-time news and social sentiment analysis across multiple platforms</span>
                  </li>
                </ul>
              </div>

              <div className="overflow-hidden min-w-0">
                <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2 break-words">
                  <Database className="w-6 h-6 flex-shrink-0" />
                  <span className="break-words">17+ Premium Data Sources</span>
                </h3>
                <ul className="space-y-3 text-bitcoin-white-80">
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>Market Data:</strong> CoinGecko, CoinMarketCap Pro, Kraken, Blockchain.com, Alpha Vantage</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>Social Intelligence:</strong> LunarCrush, Twitter/X API, Reddit API</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>Derivatives & DeFi:</strong> CoinGlass, DeFiLlama, Bybit, Deribit, Messari</span>
                  </li>
                </ul>
              </div>

              <div className="overflow-hidden min-w-0">
                <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2 break-words">
                  <Zap className="w-6 h-6 flex-shrink-0" />
                  <span className="break-words">Real-Time Intelligence</span>
                </h3>
                <ul className="space-y-3 text-bitcoin-white-80">
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>Live Market Data:</strong> 30-second refresh cycles for price, volume, and order book data</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>Instant Whale Alerts:</strong> Real-time detection of large transactions (50+ BTC)</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>News Aggregation:</strong> 15+ stories updated continuously from multiple sources</span>
                  </li>
                </ul>
              </div>

              <div className="overflow-hidden min-w-0">
                <h3 className="text-xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2 break-words">
                  <Shield className="w-6 h-6 flex-shrink-0" />
                  <span className="break-words">Enterprise Security</span>
                </h3>
                <ul className="space-y-3 text-bitcoin-white-80">
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>JWT Authentication:</strong> Secure token-based authentication with httpOnly cookies</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>bcrypt Hashing:</strong> Industry-standard password encryption with 12 salt rounds</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="text-bitcoin-orange mt-1 flex-shrink-0">●</span>
                    <span className="break-words flex-1 min-w-0"><strong>Audit Logging:</strong> Comprehensive session management and event tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action - Mobile/Tablet Optimized */}
          <div className="text-center bg-bitcoin-orange rounded-lg p-8 md:p-12 overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-black text-bitcoin-black mb-4 break-words px-2">
              Experience the Most Comprehensive Crypto Intelligence
            </h2>
            <p className="text-lg text-bitcoin-black opacity-90 break-words px-2">
              17+ data sources • 4 AI models • Real-time processing • Enterprise security
            </p>
          </div>
        </div>
        
        {/* Footer - Mobile/Tablet Optimized */}
        <footer className="mt-12 pt-8 border-t border-bitcoin-orange-20 overflow-hidden">
          <div className="container mx-auto px-4 max-w-full">
            {/* Data Source Attribution */}
            <div className="text-center py-6 mb-6 overflow-hidden">
              <p className="text-sm text-bitcoin-white-60 mb-4 break-words px-2">
                Powered by premium data from industry-leading providers
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-xs text-bitcoin-white-60 overflow-hidden px-2">
                <span className="whitespace-nowrap">CoinGecko</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">Blockchain.com</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">CoinMarketCap</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">Kraken</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">LunarCrush</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">CoinGlass</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">DeFiLlama</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">NewsAPI</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">OpenAI</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">Gemini AI</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">Caesar AI</span>
              </div>
            </div>

            {/* CoinGecko Attribution */}
            <div className="text-center py-6 border-t border-bitcoin-orange-20 overflow-hidden">
              <p className="text-xs text-bitcoin-white-60 mb-3 break-words px-2">
                Primary market data powered by
              </p>
              <a 
                href="https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity max-w-full"
                aria-label="CoinGecko - Cryptocurrency Data"
              >
                <svg 
                  width="120" 
                  height="30" 
                  viewBox="0 0 276 60" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-auto max-w-full flex-shrink-0"
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
            <div className="text-center py-6 border-t border-bitcoin-orange-20 overflow-hidden">
              <p className="text-xs text-bitcoin-white-60 break-words px-2">
                © 2025 Bitcoin Sovereign Technology. All rights reserved.
              </p>
              <p className="text-xs text-bitcoin-white-60 mt-2 break-words px-2">
                Powered by GPT-4o, Gemini AI, Caesar AI, and 17+ premium data sources
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
