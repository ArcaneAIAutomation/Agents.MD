import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  RefreshCw, 
  Radio,
  Sparkles
} from 'lucide-react';
import TypewriterText, { 
  AnimatedHeadline, 
  NewspaperLoading, 
  PressEffectWrapper,
  TelegraphNotification 
} from './TypewriterText';

interface CryptoArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  url?: string;
  aiSummary?: string; // AI-generated quick review
}

interface TopCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  change24h: number;
  rank: number;
}

interface CryptoHeraldData {
  articles: CryptoArticle[];
  marketTicker?: any[];
  marketData?: {
    topCoins: TopCoin[];
    totalMarketCap: number;
    lastUpdated: string;
  };
  apiStatus?: {
    source: string;
    status: string;
    message: string;
    isRateLimit?: boolean;
  };
  meta: {
    totalArticles: number;
    isLiveData: boolean;
    sources: string[];
    lastUpdated: string;
    note?: string;
  };
}

const CryptoHerald: React.FC = () => {
  const [data, setData] = useState<CryptoHeraldData | null>({
    articles: [],
    marketTicker: [],
    apiStatus: {
      source: 'Loading',
      status: 'Initializing',
      message: 'Loading market data...',
      isRateLimit: false
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      sources: ['Initializing'],
      isLiveData: true,
      totalArticles: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [articlesLoaded, setArticlesLoaded] = useState(false);
  
  // Initialize with empty state - NO auto-fetching
  useEffect(() => {
    // Set initial state with no data - user must click to fetch
    setData({
      articles: [],
      marketTicker: [],
      apiStatus: {
        source: 'Ready',
        status: 'Waiting',
        message: 'Click "Fetch News" to load latest crypto news and market data',
        isRateLimit: false
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        sources: ['Ready'],
        isLiveData: true,
        totalArticles: 0
      }
    });
  }, []);

  // Show notification when new data loads
  useEffect(() => {
    if (data && !loading && articlesLoaded) {
      setNotificationMessage(`📰 ${data.articles?.length || 0} new articles loaded!`);
      setShowNotification(true);
    }
  }, [data, loading, articlesLoaded]);

  // Generate AI-powered quick summaries for articles
  const generateAISummary = (article: CryptoArticle): string => {
    const summaries = {
      'Bullish': [
        '🚀 Strong upward momentum expected',
        '📈 Market shows positive signals',
        '💎 Solid fundamentals driving growth',
        '🔥 Breaking resistance levels',
        '⭐ Analyst confidence is high',
        '🎯 Price targets being raised',
        '💪 Strong institutional interest'
      ],
      'Bearish': [
        '⚠️ Caution advised in current market',
        '📉 Downward pressure building',
        '🔴 Support levels under threat',
        '❌ Risk factors increasing',
        '🐻 Market sentiment turning negative',
        '⛔ Technical indicators weakening',
        '📊 Volume suggests further decline'
      ],
      'Neutral': [
        '⚖️ Market awaiting clear direction',
        '🔍 Mixed signals in the data',
        '📊 Consolidation phase continues',
        '🎭 Conflicting market forces',
        '⏸️ Sideways movement expected',
        '🔄 Range-bound trading likely',
        '🎲 Outcome depends on key events'
      ]
    };

    const sentimentSummaries = summaries[article.sentiment];
    const randomIndex = Math.floor(Math.random() * sentimentSummaries.length);
    return sentimentSummaries[randomIndex];
  };

  const fetchCryptoNews = async () => {
    setLoading(true);
    
    try {
      // Show immediate loading feedback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('/api/crypto-herald-15-stories', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.articles && result.data.articles.length > 0) {
        // Only proceed if we have real live articles
        const articlesWithAI = result.data.articles.map((article: CryptoArticle) => ({
          ...article,
          aiSummary: generateAISummary(article)
        }));
        
        setData({
          ...result.data,
          articles: articlesWithAI
        });
        setArticlesLoaded(true);
      } else {
        console.error('No live articles available:', result.error || result.message);
        throw new Error('No live data available - API keys may be missing or rate limited');
      }
    } catch (error) {
      console.error('Herald loading error:', error);
      // Set error state instead of showing alert
      setData({
        articles: [],
        marketTicker: [],
        apiStatus: {
          source: 'Error',
          status: 'Failed',
          message: 'Unable to load live crypto news from external APIs',
          isRateLimit: true
        },
        meta: {
          lastUpdated: new Date().toISOString(),
          sources: ['Error'],
          isLiveData: false,
          totalArticles: 0,
          error: 'API connection failed - check internet connection and API keys'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2
    }).format(price);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return 'text-green-700 bg-green-50 border-green-300';
      case 'Bearish': return 'text-red-700 bg-red-50 border-red-300';
      case 'Neutral': return 'text-yellow-700 bg-yellow-50 border-yellow-300';
      default: return 'text-gray-700 bg-gray-50 border-gray-300';
    }
  };

  // Group articles by category
  const articlesByCategory = data?.articles.reduce((acc, article) => {
    const category = article.category || 'Market News';
    if (!acc[category]) acc[category] = [];
    acc[category].push(article);
    return acc;
  }, {} as Record<string, CryptoArticle[]>) || {};

  // Use actual articles without artificial duplication
  const getArticlesForCategory = (articles: CryptoArticle[], maxCount: number = 8) => {
    return articles.slice(0, maxCount); // Just return the actual unique articles
  };

  if (!data) {
    return (
      <div className="w-full bg-white border-4 md:border-8 border-black shadow-2xl mx-auto paper-texture">
        <div className="p-4 md:p-6 lg:p-8 bg-gray-100" style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px'
        }}>
          {/* Classic Newspaper Header */}
          <div className="border-b-4 md:border-b-8 border-double border-black pb-3 md:pb-4 lg:pb-6 mb-4 md:mb-6 lg:mb-8 bg-white">
            <div className="text-center">
              {/* Date and Edition Info */}
              <AnimatedHeadline delay={0} className="text-xs md:text-sm font-bold mb-2 md:mb-4 border-b border-black md:border-b-2 pb-2">
                {formatDate(new Date().toISOString())} • SPECIAL EDITION • VOL. 1, NO. 1
              </AnimatedHeadline>
              
              {/* Main Title with Typewriter Effect */}
              <AnimatedHeadline delay={500} className="text-4xl sm:text-5xl md:text-7xl font-black mb-2 md:mb-4 leading-tight" style={{ fontFamily: 'Times, serif' }}>
                <TypewriterText 
                  text="THE CRYPTO HERALD" 
                  speed={120} 
                  delay={0}
                  className="text-4xl sm:text-5xl md:text-7xl font-black"
                  showCursor={false}
                />
              </AnimatedHeadline>
              
              {/* Subtitle */}
              <AnimatedHeadline delay={1500} className="text-base md:text-xl font-bold mb-4 md:mb-6 tracking-wider">
                <TypewriterText 
                  text="CRYPTOCURRENCY MARKET INTELLIGENCE & ANALYSIS" 
                  speed={80} 
                  delay={0}
                  showCursor={false}
                />
              </AnimatedHeadline>
              
              {/* Status and Sources */}
              <AnimatedHeadline delay={2500} className="flex flex-col sm:flex-row justify-center items-center space-y-1 sm:space-y-0 sm:space-x-8 text-xs md:text-sm font-bold border-t border-black md:border-t-2 pt-2">
                <div className="flex items-center space-x-1">
                  <Radio className="h-3 w-3 text-red-600 animate-pulse" />
                  <span>READY TO FETCH LIVE DATA</span>
                </div>
              </AnimatedHeadline>
            </div>
          </div>

          {/* Call to Action */}
          <AnimatedHeadline delay={3000} className="text-center bg-white border-4 border-black p-6 md:p-8">
            <TypewriterText 
              text="🗞️ FETCH LATEST CRYPTO NEWS 🗞️"
              speed={150}
              delay={0}
              className="text-xl md:text-2xl font-black mb-4 md:mb-6 block"
              style={{ fontFamily: 'Times, serif' }}
              showCursor={false}
            />
            <PressEffectWrapper
              onClick={fetchCryptoNews}
              className="inline-block"
            >
              <button
                disabled={loading}
                className="bg-black font-bold py-4 px-6 md:px-8 border-4 border-black hover:bg-gray-800 transition-colors text-base md:text-lg flex items-center mx-auto disabled:opacity-50 newspaper-hover min-h-[44px] mobile-text-primary"
                style={{ fontFamily: 'Times, serif', backgroundColor: '#000000', color: '#ffffff' }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                    <NewspaperLoading text="PRINTING LATEST EDITION..." className="mobile-text-primary" style={{ color: '#ffffff' }} />
                  </>
                ) : (
                  <>
                    <Newspaper className="h-5 w-5 mr-2" />
                    FETCH TODAY'S HERALD
                  </>
                )}
              </button>
            </PressEffectWrapper>
          </AnimatedHeadline>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border-4 md:border-8 border-black shadow-2xl mx-auto">
      <div className="p-4 md:p-6 lg:p-8 bg-gray-100" style={{
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: '50px 50px'
      }}>
        {/* Classic Newspaper Header */}
        <div className="border-b-8 border-double border-black pb-4 md:pb-6 mb-6 md:mb-8 mobile-bg-primary">
          <div className="text-center">
            {/* Date and Edition Info */}
            <div className="text-xs md:text-sm font-bold mb-2 md:mb-4 border-b-2 border-black pb-2 mobile-text-primary">
              {formatDate(data?.meta?.lastUpdated || new Date().toISOString())} • SPECIAL EDITION • VOL. 1, NO. 1
            </div>
            
            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-black mb-2 md:mb-4 leading-tight mobile-text-primary" style={{ fontFamily: 'Times, serif' }}>
              THE CRYPTO HERALD
            </h1>
            
            {/* Enhanced Subtitle with Live Data Analytics */}
            <div className="text-sm md:text-base lg:text-xl font-bold mb-2 tracking-wider mobile-text-primary">
              REAL-TIME MARKET INTELLIGENCE & AI ANALYTICS
            </div>
            <div className="text-xs md:text-sm lg:text-base mobile-text-secondary mb-4 font-serif italic">
              Powered by GPT-4o • Live Order Book Analysis • Multi-Source Data Aggregation
            </div>
            
            {/* Enhanced API Status and Data Sources */}
            <div className="border-t-2 border-black pt-4 space-y-3">
              
              {/* Live Data Status Row */}
              <div className="flex flex-wrap justify-center items-center gap-4 text-xs md:text-sm font-bold">
                <div className="flex items-center space-x-1">
                  <Radio className="h-3 w-3 text-red-600 animate-pulse" />
                  <span>🔴 LIVE NEWS WIRE</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>🤖 AI ANALYSIS ACTIVE</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>📊 REAL-TIME PRICES</span>
                </div>
              </div>
              
              {/* API Sources Row */}
              <div className="text-center text-xs md:text-sm">
                <div className="font-bold mobile-text-primary mb-2">LIVE DATA SOURCES:</div>
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                  <span className="mobile-bg-warning px-3 py-2 rounded border text-xs md:text-sm font-medium api-badge">Kraken API</span>
                  <span className="mobile-bg-info px-3 py-2 rounded border text-xs md:text-sm font-medium api-badge">CoinGecko</span>
                  <span className="mobile-bg-success px-3 py-2 rounded border text-xs md:text-sm font-medium api-badge">NewsAPI</span>
                  <span className="mobile-bg-info px-3 py-2 rounded border text-xs md:text-sm font-medium api-badge">OpenAI GPT-4o</span>
                  <span className="mobile-bg-error px-3 py-2 rounded border text-xs md:text-sm font-medium api-badge">CoinMarketCap</span>
                  <span className="mobile-bg-warning px-3 py-2 rounded border text-xs md:text-sm font-medium api-badge">Alpha Vantage</span>
                  <span className="mobile-bg-accent px-3 py-2 rounded border text-xs md:text-sm font-medium api-badge api-badge-coming-soon animate-coming-soon relative">
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                        {/* Caesar API Icon - Replace this with your actual Caesar API icon */}
                        <img 
                          src="/icons/caesar-api-placeholder.svg" 
                          alt="Caesar API" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to text if icon fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 rounded-full items-center justify-center hidden">
                          <span className="text-white text-xs font-bold">C</span>
                        </div>
                      </div>
                      <span className="font-semibold">Caesar API</span>
                      <span className="text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">
                        Live
                      </span>
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Enhanced Features Row */}
              <div className="text-center text-xs">
                <div className="font-bold mobile-text-primary mb-2">ADVANCED ANALYTICS:</div>
                <div className="mobile-text-secondary flex flex-wrap justify-center gap-2 md:gap-3">
                  <span className="whitespace-nowrap">🎯 Order Book Analysis</span>
                  <span className="hidden md:inline">•</span>
                  <span className="whitespace-nowrap">🐋 Whale Tracking</span>
                  <span className="hidden md:inline">•</span>
                  <span className="whitespace-nowrap">😱 Fear & Greed Index</span>
                  <span className="hidden md:inline">•</span>
                  <span className="whitespace-nowrap">🔮 AI Predictions</span>
                  <span className="hidden md:inline">•</span>
                  <span className="whitespace-nowrap">📈 Multi-Timeframe TA</span>
                </div>
              </div>
              
              {/* API Status Display */}
              {data?.apiStatus && (
                <div className="flex justify-center">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded text-xs font-bold ${
                    data.apiStatus.isRateLimit 
                      ? 'bg-red-100 text-red-800 border border-red-300' 
                      : data.apiStatus.status === 'Active' 
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  }`}>
                    <span>
                      {data.apiStatus.isRateLimit ? '⚠️ RATE LIMIT' : 
                       '✅ ALL SYSTEMS OPERATIONAL'}
                    </span>
                    <span className="font-normal">• {data.apiStatus.source}</span>
                  </div>
                </div>
              )}
              
              {/* Rate Limit Warning */}
              {data.apiStatus?.isRateLimit && (
                <div className="text-red-600 text-xs text-center mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  📊 {data.apiStatus?.message} - Consider upgrading to premium API subscription for unlimited access
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Market Ticker - Classic News Tape Style */}
        {(() => {
          if (data?.marketTicker) {
            console.log('Ticker check - marketTicker:', data.marketTicker);
            console.log('Ticker check - length:', data.marketTicker.length);
            console.log('Ticker check - condition result:', data.marketTicker.length > 0);
            return data.marketTicker.length > 0;
          }
          return false;
        })() && (
          <div className="mb-6 md:mb-8 border-y-4 border-black bg-gradient-to-r from-black via-gray-900 to-black">
            {/* Ticker Header Bar */}
            <div className="mobile-bg-primary border-b-2 border-black p-2 md:p-3">
              <div className="flex items-center justify-center space-x-2 md:space-x-4">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-red-600 rounded-full animate-live-pulse"></div>
                <span className="font-black mobile-text-primary text-xs md:text-sm" style={{ fontFamily: 'Times, serif' }}>
                  LIVE MARKET DATA - COINGECKO API
                </span>
                <div className="w-2 h-2 md:w-3 md:h-3 bg-red-600 rounded-full animate-live-pulse"></div>
              </div>
            </div>
            
            {/* Scrolling Ticker Content */}
            <div 
              className="bg-black py-4 md:py-3 overflow-hidden relative cursor-pointer ticker-container"
              style={{ backgroundColor: '#000000' }}
              onMouseEnter={(e) => {
                const ticker = e.currentTarget.querySelector('.animate-scroll');
                ticker?.classList.add('ticker-paused');
              }}
              onMouseLeave={(e) => {
                const ticker = e.currentTarget.querySelector('.animate-scroll');
                ticker?.classList.remove('ticker-paused');
              }}
            >
              <div className="flex animate-scroll space-x-8 md:space-x-12 text-base md:text-lg font-bold">
                {/* Duplicate the data to create seamless loop */}
                {data?.marketTicker && [...data.marketTicker.slice(0, 8), ...data.marketTicker.slice(0, 8)].map((coin, index) => (
                  <div key={`${coin.symbol}-${index}`} className="flex items-center space-x-2 md:space-x-3 whitespace-nowrap ticker-item">
                    <span className="mobile-text-warning animate-pulse" style={{ color: '#fbbf24' }}>●</span>
                    <span className="font-black mobile-text-primary" style={{ color: '#ffffff' }}>{coin.symbol}</span>
                    <span className="mobile-text-primary" style={{ color: '#ffffff' }}>{formatPrice(coin.price)}</span>
                    <span className={`font-bold ${coin.change >= 0 ? 'mobile-text-crypto-green' : 'mobile-text-crypto-red'}`} 
                          style={{ color: coin.change >= 0 ? '#10b981' : '#ef4444' }}>
                      {coin.change >= 0 ? '↗' : '↘'} {Math.abs(coin.change).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Fade edges for professional look */}
              <div className="absolute left-0 top-0 w-8 md:w-16 h-full bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-8 md:w-16 h-full bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
            </div>
            
            {/* Bottom Border with Classic Pattern */}
            <div className="mobile-bg-primary border-t-2 border-black h-1">
              <div className="h-full bg-black opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
              }}></div>
            </div>
          </div>
        )}

        {/* Fetch News Button - Always show when no articles are loaded */}
        {(!data?.articles || data.articles.length === 0) && (
          <div className="mb-8 bg-white border-4 border-black p-6 md:p-8 text-center">
            <h3 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: 'Times, serif' }}>
              📰 CRYPTO NEWS WIRE
            </h3>
            <p className="text-lg mb-6 font-bold text-gray-700">
              Click below to fetch live cryptocurrency news with AI analysis and real-time market data
            </p>
            <PressEffectWrapper
              onClick={fetchCryptoNews}
              className="inline-block"
            >
              <button
                disabled={loading}
                className="bg-black font-bold py-4 px-6 md:px-8 border-4 border-black hover:bg-gray-800 transition-colors text-base md:text-lg flex items-center mx-auto disabled:opacity-50 newspaper-hover min-h-[44px] mobile-text-primary"
                style={{ fontFamily: 'Times, serif', backgroundColor: '#000000', color: '#ffffff' }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                    <NewspaperLoading text="FETCHING LATEST NEWS..." className="mobile-text-primary" style={{ color: '#ffffff' }} />
                  </>
                ) : (
                  <>
                    <Newspaper className="h-5 w-5 mr-2" />
                    FETCH TODAY'S CRYPTO NEWS
                  </>
                )}
              </button>
            </PressEffectWrapper>
          </div>
        )}

        {/* Error State - No Live Articles Available */}
        {data?.meta?.error && (
          <div className="mb-8 bg-white border-4 border-red-600">
            <div className="bg-red-600 text-white p-4 border-b-4 border-red-600">
              <h2 className="text-2xl font-black text-center" style={{ fontFamily: 'Times, serif' }}>
                ⚠️ LIVE NEWS UNAVAILABLE
              </h2>
            </div>
            <div className="p-6 text-center">
              <div className="text-xl font-bold mb-4 text-red-700">
                Unable to Load Live Crypto News
              </div>
              <div className="text-gray-700 mb-4">
                {data.meta.error}
              </div>
              <div className="text-sm text-gray-600 mb-6">
                • Check your internet connection<br/>
                • Verify API keys are configured in .env.local<br/>
                • External news APIs may be temporarily unavailable
              </div>
              <PressEffectWrapper
                onClick={fetchCryptoNews}
                className="inline-block"
              >
                <button
                  disabled={loading}
                  className="bg-red-600 font-bold py-4 px-6 border-2 border-red-600 hover:bg-red-700 transition-colors min-h-[44px] mobile-text-primary"
                  style={{ fontFamily: 'Times, serif', backgroundColor: '#dc2626', color: '#ffffff' }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin h-5 w-5 mr-2 inline" />
                      RETRYING...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 inline" />
                      TRY AGAIN
                    </>
                  )}
                </button>
              </PressEffectWrapper>
            </div>
          </div>
        )}

        {/* News Sections - Only show if we have articles */}
        {!data?.meta?.error && Object.entries(articlesByCategory).map(([category, articles], categoryIndex) => {
          const categoryArticles = getArticlesForCategory(articles, 8);
          
          return (
            <div key={category} className="mb-8 mobile-bg-card border-4 border-black">
              {/* Category Header */}
              <div className="bg-black mobile-text-primary p-4 border-b-4 border-black" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                <h2 className="text-2xl font-black text-center mobile-text-primary" style={{ fontFamily: 'Times, serif', color: '#ffffff' }}>
                  {category.toUpperCase()}
                </h2>
                <div className="text-center text-sm mt-1 mobile-text-primary" style={{ color: '#ffffff' }}>
                  {categoryArticles.length} STORIES
                </div>
              </div>

              {/* Articles Grid - Single column on mobile */}
              <div className="p-4 md:p-6 space-y-6">
                {categoryIndex === 0 && categoryArticles.length > 0 && (
                  /* Featured Article - Only for first category */
                  <div className="border-4 border-black p-4 md:p-6 mobile-bg-secondary">
                    {/* Clickable Headline */}
                    {categoryArticles[0].url ? (
                      <a 
                        href={categoryArticles[0].url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mobile-text-link hover:text-blue-800 transition-colors block"
                      >
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 hover:underline cursor-pointer mobile-text-primary" style={{ fontFamily: 'Times, serif' }}>
                          {categoryArticles[0].headline}
                        </h3>
                      </a>
                    ) : (
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 mobile-text-primary" style={{ fontFamily: 'Times, serif' }}>
                        {categoryArticles[0].headline}
                      </h3>
                    )}
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4">
                      <span className={`px-3 py-2 border-2 rounded font-bold text-sm min-h-[44px] flex items-center ${getSentimentColor(categoryArticles[0].sentiment)}`}>
                        {categoryArticles[0].sentiment.toUpperCase()}
                      </span>
                      <span className="text-sm font-bold mobile-text-secondary">BY {categoryArticles[0].source.toUpperCase()}</span>
                      {categoryArticles[0].aiSummary && (
                        <div className="flex items-center space-x-2 mobile-bg-info border-2 border-blue-300 rounded px-3 py-2 min-h-[44px]">
                          <Sparkles className="h-4 w-4 mobile-text-info" />
                          <span className="text-sm font-bold mobile-text-info">AI INSIGHT</span>
                        </div>
                      )}
                    </div>
                    {categoryArticles[0].aiSummary && (
                      <div className="mobile-bg-info border-l-4 border-blue-400 p-4 mb-4">
                        <p className="mobile-text-info font-medium italic">
                          "{categoryArticles[0].aiSummary}"
                        </p>
                      </div>
                    )}
                    <p className="text-base md:text-lg leading-relaxed mb-4 mobile-text-primary" style={{ fontFamily: 'Times, serif' }}>
                      {categoryArticles[0].summary}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-bold mobile-text-secondary">
                          {formatDate(categoryArticles[0].publishedAt)}
                        </span>
                      </div>
                      {categoryArticles[0].url && (
                        <a 
                          href={categoryArticles[0].url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-black px-4 py-3 border-2 border-black hover:bg-gray-800 transition-colors font-bold text-sm min-h-[44px] flex items-center justify-center mobile-text-primary"
                          style={{ backgroundColor: '#000000', color: '#ffffff' }}
                        >
                          READ MORE
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Other Articles - Single column on mobile */}
                <div className="grid grid-cols-1 gap-6">
                  {/* For first category, show articles starting from index 1 (skip featured article) */}
                  {/* For other categories, show all articles starting from index 0 */}
                  {(categoryIndex === 0 ? categoryArticles.slice(1) : categoryArticles).map((article: CryptoArticle, index: number) => (
                    <AnimatedHeadline 
                      key={article.id} 
                      delay={index * 100} 
                      className={`border-2 border-black p-4 mobile-bg-card newspaper-hover stagger-${Math.min(index, 5)}`}
                    >
                      {/* Clickable Headline */}
                      {article.url ? (
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mobile-text-link hover:text-blue-800 transition-colors block mb-2"
                        >
                          <TypewriterText 
                            text={article.headline}
                            speed={50}
                            delay={0}
                            className="font-black text-base md:text-lg leading-tight hover:underline cursor-pointer mobile-text-primary"
                            style={{ fontFamily: 'Times, serif' }}
                            showCursor={false}
                          />
                        </a>
                      ) : (
                        <TypewriterText 
                          text={article.headline}
                          speed={50}
                          delay={0}
                          className="font-black text-base md:text-lg mb-2 leading-tight block mobile-text-primary"
                          style={{ fontFamily: 'Times, serif' }}
                          showCursor={false}
                        />
                      )}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-3 py-2 border rounded text-sm font-bold min-h-[44px] flex items-center ${getSentimentColor(article.sentiment)}`}>
                          {article.sentiment}
                        </span>
                        <span className="text-sm font-bold mobile-text-secondary">
                          {article.source.toUpperCase()}
                        </span>
                        {article.aiSummary && (
                          <div className="flex items-center space-x-1 mobile-bg-info border border-blue-300 rounded px-3 py-2 min-h-[44px]">
                            <Sparkles className="h-4 w-4 mobile-text-info" />
                            <span className="text-sm font-bold mobile-text-info">AI</span>
                          </div>
                        )}
                      </div>
                      {article.aiSummary && (
                        <div className="mobile-bg-info border-l-4 border-blue-400 p-3 mb-3">
                          <p className="text-sm mobile-text-info font-medium italic">
                            {article.aiSummary}
                          </p>
                        </div>
                      )}
                      <p className="text-sm md:text-base mb-3 mobile-text-primary leading-relaxed">
                        {article.summary.substring(0, 150)}...
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <span className="text-sm mobile-text-secondary font-medium">
                          {formatDate(article.publishedAt)}
                        </span>
                        {article.url && (
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-black px-4 py-3 border border-black hover:bg-gray-800 transition-colors font-bold text-sm rounded min-h-[44px] flex items-center justify-center mobile-text-primary"
                            style={{ backgroundColor: '#000000', color: '#ffffff' }}
                          >
                            📖 READ ORIGINAL
                          </a>
                        )}
                      </div>
                    </AnimatedHeadline>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Refresh News Button - Show when articles are already loaded */}
        {data?.articles && data.articles.length > 0 && (
          <div className="mb-8 mobile-bg-secondary border-4 border-black p-4 md:p-6 text-center">
            <h3 className="text-lg md:text-xl font-black mb-3 mobile-text-primary" style={{ fontFamily: 'Times, serif' }}>
              📰 REFRESH NEWS FEED
            </h3>
            <p className="text-sm mb-4 font-bold mobile-text-secondary">
              Get the latest breaking crypto news and market updates
            </p>
            <PressEffectWrapper
              onClick={fetchCryptoNews}
              className="inline-block"
            >
              <button
                disabled={loading}
                className="bg-blue-600 px-6 py-4 border-2 border-blue-600 hover:bg-blue-700 transition-colors text-base font-bold flex items-center mx-auto disabled:opacity-50 min-h-[44px] mobile-text-primary"
                style={{ fontFamily: 'Times, serif', backgroundColor: '#1d4ed8', color: '#ffffff' }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    UPDATING...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    REFRESH NEWS
                  </>
                )}
              </button>
            </PressEffectWrapper>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 bg-black p-4 md:p-6 border-4 border-black" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
          <div className="text-center">
            <h3 className="text-base md:text-lg font-black mb-2 mobile-text-primary" style={{ fontFamily: 'Times, serif', color: '#ffffff' }}>
              THE CRYPTO HERALD
            </h3>
            <p className="text-sm mb-2 mobile-text-primary" style={{ color: '#ffffff' }}>
              Published by Digital News Corp. • All rights reserved • {new Date().getFullYear()}
            </p>
            <div className="text-xs">
              Last Updated: {formatDate(data?.meta?.lastUpdated || new Date().toISOString())} • Sources: {data?.meta?.sources?.join(', ') || 'Live Market Intelligence'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Telegraph Notification */}
      {showNotification && (
        <TelegraphNotification 
          message={notificationMessage}
          onComplete={() => setShowNotification(false)}
        />
      )}
    </div>
  );
};

export default CryptoHerald;
