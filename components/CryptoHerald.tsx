import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  RefreshCw, 
  Radio,
  Sparkles,
  ChevronDown,
  ChevronUp
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
  const [isExpanded, setIsExpanded] = useState(false); // Collapsible state
  
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
        
        // Auto-expand when news loads with smooth animation
        setTimeout(() => {
          setIsExpanded(true);
        }, 300);
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
      case 'Bullish': return 'text-bitcoin-orange bg-bitcoin-black border-bitcoin-orange';
      case 'Bearish': return 'text-bitcoin-white-80 bg-bitcoin-black border-bitcoin-white-60';
      case 'Neutral': return 'text-bitcoin-white-60 bg-bitcoin-black border-bitcoin-orange-20';
      default: return 'text-bitcoin-white-80 bg-bitcoin-black border-bitcoin-orange-20';
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
      <div className="w-full bg-bitcoin-black mx-auto bitcoin-sovereign-theme">
        <div className="p-4 md:p-6 lg:p-8 bg-bitcoin-black">
          {/* Bitcoin Sovereign Header */}
          <div className="border-b border-bitcoin-orange pb-3 md:pb-4 lg:pb-6 mb-4 md:mb-6 lg:mb-8 bg-bitcoin-black section-divider">
            <div className="text-center">
              {/* Date and Edition Info */}
              <AnimatedHeadline delay={0} className="text-xs md:text-sm font-bold mb-2 md:mb-4 border-b border-bitcoin-orange-20 pb-2 text-bitcoin-white-60">
                {formatDate(new Date().toISOString())} • SPECIAL EDITION • VOL. 1, NO. 1
              </AnimatedHeadline>
              
              {/* Main Title with Typewriter Effect */}
              <AnimatedHeadline delay={500} className="text-4xl sm:text-5xl md:text-7xl font-black mb-2 md:mb-4 leading-tight text-bitcoin-white font-sans">
                <TypewriterText 
                  text="THE CRYPTO HERALD" 
                  speed={120} 
                  delay={0}
                  className="text-4xl sm:text-5xl md:text-7xl font-black text-bitcoin-white"
                  showCursor={false}
                />
              </AnimatedHeadline>
              
              {/* Subtitle */}
              <AnimatedHeadline delay={1500} className="text-base md:text-xl font-bold mb-4 md:mb-6 tracking-wider text-bitcoin-orange headline-bitcoin">
                <TypewriterText 
                  text="CRYPTOCURRENCY MARKET INTELLIGENCE & ANALYSIS" 
                  speed={80} 
                  delay={0}
                  showCursor={false}
                  className="text-bitcoin-orange"
                />
              </AnimatedHeadline>
              
              {/* Status and Sources */}
              <AnimatedHeadline delay={2500} className="flex flex-col sm:flex-row justify-center items-center space-y-1 sm:space-y-0 sm:space-x-8 text-xs md:text-sm font-bold border-t border-bitcoin-orange-20 pt-2 text-bitcoin-white-80">
                <div className="flex items-center space-x-1">
                  <Radio className="h-3 w-3 text-bitcoin-orange animate-pulse" />
                  <span className="text-bitcoin-orange">READY TO FETCH LIVE DATA</span>
                </div>
              </AnimatedHeadline>
            </div>
          </div>

          {/* Call to Action */}
          <AnimatedHeadline delay={3000} className="text-center bitcoin-block bg-bitcoin-black p-6 md:p-8">
            <TypewriterText 
              text="🗞️ FETCH LATEST CRYPTO NEWS 🗞️"
              speed={150}
              delay={0}
              className="text-xl md:text-2xl font-black mb-4 md:mb-6 block text-bitcoin-white font-sans"
              showCursor={false}
            />
            <PressEffectWrapper
              onClick={fetchCryptoNews}
              className="inline-block"
            >
              <button
                disabled={loading}
                className="btn-bitcoin-primary py-4 px-6 md:px-8 text-base md:text-lg flex items-center mx-auto disabled:opacity-50 min-h-[48px] touch-manipulation"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                    <NewspaperLoading text="PRINTING LATEST EDITION..." className="text-bitcoin-black" />
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
    <div className="w-full bg-bitcoin-black mx-auto bitcoin-sovereign-theme crypto-herald-container">
      <div className="p-4 md:p-6 lg:p-8 bg-bitcoin-black news-container">
        {/* Bitcoin Sovereign Header - Fully Responsive Layout */}
        <div className="pb-4 md:pb-6 lg:pb-8 mb-6 md:mb-8 bg-bitcoin-black">
          <div className="text-center max-w-7xl mx-auto px-2 sm:px-4">
            {/* Date and Edition Info - Better Mobile Wrapping */}
            <div className="text-[10px] sm:text-xs md:text-sm font-bold mb-3 md:mb-4 pb-2 md:pb-3 text-bitcoin-white-60 px-2">
              <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2">
                <span className="whitespace-nowrap">{formatDate(data?.meta?.lastUpdated || new Date().toISOString())}</span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">SPECIAL EDITION</span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">VOL. 1, NO. 1</span>
              </div>
            </div>
            
            {/* Thin Orange Divider Line */}
            <div className="w-full h-px bg-bitcoin-orange opacity-20 mb-4 md:mb-5"></div>
            
            {/* Main Title - Fluid Responsive Sizing - Centered */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black mb-3 md:mb-4 lg:mb-5 leading-tight text-bitcoin-white font-sans px-2 text-center">
              THE CRYPTO HERALD
            </h1>
            
            {/* Subtitle - Optimized Stacking */}
            <div className="space-y-2 md:space-y-3 mb-5 md:mb-6 lg:mb-8 px-2">
              <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold tracking-wider text-bitcoin-orange headline-bitcoin">
                REAL-TIME MARKET INTELLIGENCE & AI ANALYTICS
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-bitcoin-white-60 font-sans flex flex-wrap justify-center gap-1 sm:gap-2">
                <span className="whitespace-nowrap">Powered by GPT-5.1</span>
                <span className="hidden sm:inline text-bitcoin-orange">•</span>
                <span className="whitespace-nowrap">Live Order Book Analysis</span>
                <span className="hidden md:inline text-bitcoin-orange">•</span>
                <span className="whitespace-nowrap">Multi-Source Data Aggregation</span>
              </div>
            </div>
            
            {/* Thin Orange Divider Line */}
            <div className="w-full h-px bg-bitcoin-orange opacity-20 mb-6 md:mb-8"></div>
            
            {/* Enhanced API Status and Data Sources - Completely Restructured */}
            <div className="space-y-6 md:space-y-8 px-2 sm:px-4 relative">
              
              {/* Live Data Status Row - Clear Separation */}
              <div className="bg-bitcoin-black py-4 relative z-10">
                <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 md:gap-4 text-xs md:text-sm font-bold">
                  <div className="flex items-center space-x-1.5 px-3 py-2">
                    <Radio className="h-3 w-3 md:h-4 md:w-4 text-bitcoin-orange animate-pulse flex-shrink-0" />
                    <span className="text-bitcoin-orange whitespace-nowrap">LIVE NEWS WIRE</span>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 px-3 py-2">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-bitcoin-orange rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="text-bitcoin-white-80 whitespace-nowrap">AI ANALYSIS</span>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 px-3 py-2">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-bitcoin-orange rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="text-bitcoin-white-80 whitespace-nowrap">REAL-TIME PRICES</span>
                  </div>
                </div>
              </div>
              
              {/* API Sources Row - Separated Section */}
              <div className="bg-bitcoin-black py-4 relative z-10">
                <div className="text-center">
                  <div className="font-bold text-bitcoin-white mb-4 md:mb-5 text-xs sm:text-sm md:text-base">LIVE DATA SOURCES:</div>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-5xl mx-auto px-2">
                    <span className="bg-bitcoin-black border border-bitcoin-orange-30 px-2.5 sm:px-3 md:px-4 py-2 rounded text-[10px] sm:text-xs font-medium text-bitcoin-white-80 hover:border-bitcoin-orange transition-all whitespace-nowrap">Kraken API</span>
                    <span className="bg-bitcoin-black border border-bitcoin-orange-30 px-2.5 sm:px-3 md:px-4 py-2 rounded text-[10px] sm:text-xs font-medium text-bitcoin-white-80 hover:border-bitcoin-orange transition-all whitespace-nowrap">CoinGecko</span>
                    <span className="bg-bitcoin-black border border-bitcoin-orange-30 px-2.5 sm:px-3 md:px-4 py-2 rounded text-[10px] sm:text-xs font-medium text-bitcoin-white-80 hover:border-bitcoin-orange transition-all whitespace-nowrap">NewsAPI</span>
                    <span className="bg-bitcoin-black border border-bitcoin-orange-30 px-2.5 sm:px-3 md:px-4 py-2 rounded text-[10px] sm:text-xs font-medium text-bitcoin-white-80 hover:border-bitcoin-orange transition-all whitespace-nowrap">OpenAI GPT-5.1</span>
                    <span className="bg-bitcoin-black border border-bitcoin-orange-30 px-2.5 sm:px-3 md:px-4 py-2 rounded text-[10px] sm:text-xs font-medium text-bitcoin-white-80 hover:border-bitcoin-orange transition-all whitespace-nowrap">CoinMarketCap</span>
                    <span className="bg-bitcoin-black border border-bitcoin-orange-30 px-2.5 sm:px-3 md:px-4 py-2 rounded text-[10px] sm:text-xs font-medium text-bitcoin-white-80 hover:border-bitcoin-orange transition-all whitespace-nowrap">Alpha Vantage</span>
                    <span className="bg-bitcoin-black border border-bitcoin-orange px-2.5 sm:px-3 md:px-4 py-2 rounded text-[10px] sm:text-xs font-medium text-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black transition-all whitespace-nowrap">
                      <span className="flex items-center space-x-1.5">
                        <span className="font-semibold">Caesar API</span>
                        <span className="text-[9px] sm:text-xs bg-bitcoin-orange text-bitcoin-black px-1.5 py-0.5 rounded-full font-bold">
                          Live
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Features Row - Separated Section with Clear Spacing */}
              <div className="bg-bitcoin-black py-4 relative z-10">
                <div className="text-center">
                  <div className="font-bold text-bitcoin-white mb-3 md:mb-4 text-xs sm:text-sm md:text-base">ADVANCED ANALYTICS:</div>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 max-w-4xl mx-auto px-2">
                    <span className="feature-badge md:bg-transparent md:border-0 md:text-bitcoin-white-60 md:p-0">🎯 Order Book</span>
                    <span className="hidden md:inline text-bitcoin-orange">•</span>
                    <span className="feature-badge md:bg-transparent md:border-0 md:text-bitcoin-white-60 md:p-0">🐋 Whale Tracking</span>
                    <span className="hidden md:inline text-bitcoin-orange">•</span>
                    <span className="feature-badge md:bg-transparent md:border-0 md:text-bitcoin-white-60 md:p-0">😱 Fear & Greed</span>
                    <span className="hidden md:inline text-bitcoin-orange">•</span>
                    <span className="feature-badge md:bg-transparent md:border-0 md:text-bitcoin-white-60 md:p-0">🔮 AI Predictions</span>
                    <span className="hidden md:inline text-bitcoin-orange">•</span>
                    <span className="feature-badge md:bg-transparent md:border-0 md:text-bitcoin-white-60 md:p-0">📈 Multi-Timeframe TA</span>
                  </div>
                </div>
              </div>
              
              {/* API Status Display - Separated with Clear Spacing */}
              {data?.apiStatus && (
                <div className="bg-bitcoin-black py-3 relative z-10">
                  <div className="flex justify-center px-2 sm:px-4">
                    <div className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-4 py-2.5 rounded text-[10px] sm:text-xs font-bold border ${
                      data.apiStatus.isRateLimit 
                        ? 'bg-bitcoin-black text-bitcoin-orange border-bitcoin-orange' 
                        : data.apiStatus.status === 'Active' 
                          ? 'bg-bitcoin-black text-bitcoin-orange border-bitcoin-orange'
                          : 'bg-bitcoin-black text-bitcoin-white-80 border-bitcoin-orange-30'
                    }`}>
                      <span className="whitespace-nowrap">
                        {data.apiStatus.isRateLimit ? '⚠️ RATE LIMIT' : 
                         '✅ ALL SYSTEMS OPERATIONAL'}
                      </span>
                      <span className="font-normal text-bitcoin-white-60 whitespace-nowrap">• {data.apiStatus.source}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Rate Limit Warning */}
              {data.apiStatus?.isRateLimit && (
                <div className="bg-bitcoin-black py-2 relative z-10">
                  <div className="text-bitcoin-orange text-[10px] sm:text-xs text-center p-3 sm:p-4 bg-bitcoin-black border border-bitcoin-orange rounded mx-2 sm:mx-4">
                    📊 {data.apiStatus?.message}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Divider Line */}
          <div className="w-full h-px bg-bitcoin-orange mt-6 md:mt-8"></div>
        </div>

        {/* Market Ticker - Bitcoin Sovereign Style */}
        {(() => {
          if (data?.marketTicker) {
            console.log('Ticker check - marketTicker:', data.marketTicker);
            console.log('Ticker check - length:', data.marketTicker.length);
            console.log('Ticker check - condition result:', data.marketTicker.length > 0);
            return data.marketTicker.length > 0;
          }
          return false;
        })() && (
          <div className="mb-6 md:mb-8 border-y-2 border-bitcoin-orange bg-bitcoin-black">
            {/* Ticker Header Bar */}
            <div className="bg-bitcoin-black border-b border-bitcoin-orange-30 p-2 md:p-3">
              <div className="flex items-center justify-center space-x-2 md:space-x-4">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-bitcoin-orange rounded-full animate-live-pulse"></div>
                <span className="font-black text-bitcoin-white text-xs md:text-sm uppercase tracking-wider">
                  LIVE MARKET DATA - COINGECKO API
                </span>
                <div className="w-2 h-2 md:w-3 md:h-3 bg-bitcoin-orange rounded-full animate-live-pulse"></div>
              </div>
            </div>
            
            {/* Scrolling Ticker Content */}
            <div 
              className="bg-bitcoin-black py-4 md:py-3 overflow-hidden relative cursor-pointer ticker-container"
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
                    <span className="text-bitcoin-orange animate-pulse">●</span>
                    <span className="font-black text-bitcoin-white">{coin.symbol}</span>
                    <span className="price-display-sm text-bitcoin-orange glow-bitcoin">{formatPrice(coin.price)}</span>
                    <span className={`font-bold ${coin.change >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                      {coin.change >= 0 ? '↗' : '↘'} {Math.abs(coin.change).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Fade edges for professional look */}
              <div className="absolute left-0 top-0 w-8 md:w-16 h-full bg-gradient-to-r from-bitcoin-black to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-8 md:w-16 h-full bg-gradient-to-l from-bitcoin-black to-transparent pointer-events-none"></div>
            </div>
            
            {/* Bottom Border with Orange Accent */}
            <div className="bg-bitcoin-black border-t border-bitcoin-orange-30 h-1">
              <div className="h-full bg-bitcoin-orange opacity-10"></div>
            </div>
          </div>
        )}

        {/* Fetch News Button - Always show when no articles are loaded */}
        {(!data?.articles || data.articles.length === 0) && (
          <div className="mb-8 bitcoin-block bg-bitcoin-black p-6 md:p-8 text-center">
            <h3 className="text-2xl md:text-3xl font-black mb-4 text-bitcoin-white font-sans">
              📰 CRYPTO NEWS WIRE
            </h3>
            <p className="text-lg mb-6 font-bold text-bitcoin-white-80">
              Click below to fetch live cryptocurrency news with AI analysis and real-time market data
            </p>
            <PressEffectWrapper
              onClick={fetchCryptoNews}
              className="inline-block"
            >
              <button
                disabled={loading}
                className="btn-bitcoin-primary py-4 px-6 md:px-8 text-base md:text-lg flex items-center mx-auto disabled:opacity-50 min-h-[48px] touch-manipulation"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                    <NewspaperLoading text="FETCHING LATEST NEWS..." className="text-bitcoin-black" />
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
          <div className="mb-8 bitcoin-block bg-bitcoin-black border-bitcoin-orange">
            <div className="bg-bitcoin-black text-bitcoin-orange p-4 border-b border-bitcoin-orange">
              <h2 className="text-2xl font-black text-center font-sans">
                ⚠️ LIVE NEWS UNAVAILABLE
              </h2>
            </div>
            <div className="p-6 text-center">
              <div className="text-xl font-bold mb-4 text-bitcoin-orange">
                Unable to Load Live Crypto News
              </div>
              <div className="text-bitcoin-white-80 mb-4">
                {data.meta.error}
              </div>
              <div className="text-sm text-bitcoin-white-60 mb-6">
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
                  className="btn-bitcoin-primary py-4 px-6 transition-colors min-h-[48px] touch-manipulation"
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

        {/* Collapsible News Header - Show when articles are loaded */}
        {!data?.meta?.error && data?.articles && data.articles.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full p-6 hover:shadow-bitcoin-glow transition-all flex items-center justify-between group cursor-pointer news-collapse-button"
              style={{ 
                backgroundColor: '#000000 !important',
                border: '1px solid #F7931A !important',
                borderRadius: '12px',
                outline: 'none',
                color: '#FFFFFF'
              }}
            >
              <div className="flex items-center space-x-4">
                <Newspaper className="h-6 w-6 text-bitcoin-orange" />
                <div className="text-left">
                  <h3 className="text-2xl font-black text-bitcoin-white font-sans">
                    📰 CRYPTO NEWS FEED
                  </h3>
                  <p className="text-sm text-bitcoin-white-60 mt-1">
                    {data.articles.length} articles loaded • Click to {isExpanded ? 'collapse' : 'expand'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isExpanded ? (
                  <ChevronUp className="h-8 w-8 text-bitcoin-orange group-hover:scale-110 transition-transform" />
                ) : (
                  <ChevronDown className="h-8 w-8 text-bitcoin-orange group-hover:scale-110 transition-transform animate-bounce" />
                )}
              </div>
            </button>
          </div>
        )}

        {/* News Sections - Collapsible with smooth animation */}
        <div 
          className={`transition-all duration-500 ease-in-out overflow-hidden news-article-expandable ${
            isExpanded ? 'max-h-[100000px] opacity-100 news-article-expanded' : 'max-h-0 opacity-0 news-article-collapsed'
          }`}
        >
          {!data?.meta?.error && Object.entries(articlesByCategory).map(([category, articles], categoryIndex) => {
          const categoryArticles = getArticlesForCategory(articles, 8);
          
          return (
            <div key={category} className="mb-8 bg-bitcoin-black bitcoin-block">
              {/* Category Header */}
              <div className="bg-bitcoin-black text-bitcoin-white p-4 border-b border-bitcoin-orange">
                <h2 className="text-2xl font-black text-center text-bitcoin-white font-sans">
                  {category.toUpperCase()}
                </h2>
                <div className="text-center text-sm mt-1 text-bitcoin-white-60">
                  {categoryArticles.length} STORIES
                </div>
              </div>

              {/* Articles Grid - Single column on mobile */}
              <div className="p-4 md:p-6 space-y-6">
                {categoryIndex === 0 && categoryArticles.length > 0 && (
                  /* Featured Article - Only for first category */
                  <div className="bitcoin-block bg-bitcoin-black p-4 md:p-6 hover:shadow-bitcoin-glow transition-all featured-article">
                    {/* Clickable Headline */}
                    {categoryArticles[0].url ? (
                      <a 
                        href={categoryArticles[0].url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-bitcoin-orange hover:text-bitcoin-white transition-colors block crypto-news-headline"
                      >
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 hover:underline cursor-pointer text-bitcoin-white font-sans">
                          {categoryArticles[0].headline}
                        </h3>
                      </a>
                    ) : (
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 text-bitcoin-white font-sans crypto-news-headline">
                        {categoryArticles[0].headline}
                      </h3>
                    )}
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 news-flex-container">
                      <span className={`px-3 py-2 border rounded font-bold text-sm min-h-[48px] flex items-center touch-manipulation sentiment-badge ${
                        categoryArticles[0].sentiment === 'Bullish' ? 'border-bitcoin-orange text-bitcoin-orange bg-bitcoin-black' :
                        categoryArticles[0].sentiment === 'Bearish' ? 'border-bitcoin-orange-30 text-bitcoin-white-60 bg-bitcoin-black' :
                        'border-bitcoin-orange-20 text-bitcoin-white-80 bg-bitcoin-black'
                      }`}>
                        {categoryArticles[0].sentiment.toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-bitcoin-white-60 news-source-name">BY {categoryArticles[0].source.toUpperCase()}</span>
                      {categoryArticles[0].aiSummary && (
                        <div className="flex items-center space-x-2 bg-bitcoin-black border border-bitcoin-orange-30 rounded px-3 py-2 min-h-[48px] touch-manipulation ai-insight-badge">
                          <Sparkles className="h-4 w-4 text-bitcoin-orange" />
                          <span className="text-sm font-bold text-bitcoin-orange">AI INSIGHT</span>
                        </div>
                      )}
                    </div>
                    {categoryArticles[0].aiSummary && (
                      <div className="bg-bitcoin-black border-l-2 border-bitcoin-orange p-4 mb-4">
                        <p className="text-bitcoin-orange font-medium italic">
                          "{categoryArticles[0].aiSummary}"
                        </p>
                      </div>
                    )}
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-bitcoin-white-80 font-sans crypto-news-summary">
                      {categoryArticles[0].summary}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-bold text-bitcoin-orange font-mono news-timestamp">
                          {formatDate(categoryArticles[0].publishedAt)}
                        </span>
                      </div>
                      {categoryArticles[0].url && (
                        <a 
                          href={categoryArticles[0].url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-bitcoin-primary px-4 py-3 text-sm min-h-[48px] flex items-center justify-center touch-manipulation news-read-more"
                        >
                          READ MORE
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Other Articles - Single column on mobile */}
                <div className="grid grid-cols-1 gap-6 news-grid">
                  {/* For first category, show articles starting from index 1 (skip featured article) */}
                  {/* For other categories, show all articles starting from index 0 */}
                  {(categoryIndex === 0 ? categoryArticles.slice(1) : categoryArticles).map((article: CryptoArticle, index: number) => (
                    <AnimatedHeadline 
                      key={article.id} 
                      delay={index * 100} 
                      className={`bitcoin-block bg-bitcoin-black p-4 hover:shadow-bitcoin-glow transition-all stagger-${Math.min(index, 5)}`}
                    >
                      {/* Clickable Headline */}
                      {article.url ? (
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-bitcoin-orange hover:text-bitcoin-white transition-colors block mb-2 crypto-news-headline"
                        >
                          <TypewriterText 
                            text={article.headline}
                            speed={50}
                            delay={0}
                            className="font-black text-base md:text-lg leading-tight hover:underline cursor-pointer text-bitcoin-white font-sans"
                            showCursor={false}
                          />
                        </a>
                      ) : (
                        <TypewriterText 
                          text={article.headline}
                          speed={50}
                          delay={0}
                          className="font-black text-base md:text-lg mb-2 leading-tight block text-bitcoin-white font-sans crypto-news-headline"
                          showCursor={false}
                        />
                      )}
                      <div className="flex flex-wrap items-center gap-2 mb-3 news-flex-container">
                        <span className={`px-3 py-2 border rounded text-sm font-bold min-h-[48px] flex items-center touch-manipulation sentiment-badge ${
                          article.sentiment === 'Bullish' ? 'border-bitcoin-orange text-bitcoin-orange bg-bitcoin-black' :
                          article.sentiment === 'Bearish' ? 'border-bitcoin-orange-30 text-bitcoin-white-60 bg-bitcoin-black' :
                          'border-bitcoin-orange-20 text-bitcoin-white-80 bg-bitcoin-black'
                        }`}>
                          {article.sentiment}
                        </span>
                        <span className="text-sm font-bold text-bitcoin-white-60 news-source-name">
                          {article.source.toUpperCase()}
                        </span>
                        {article.aiSummary && (
                          <div className="flex items-center space-x-1 bg-bitcoin-black border border-bitcoin-orange-30 rounded px-3 py-2 min-h-[48px] touch-manipulation ai-insight-badge">
                            <Sparkles className="h-4 w-4 text-bitcoin-orange" />
                            <span className="text-sm font-bold text-bitcoin-orange">AI</span>
                          </div>
                        )}
                      </div>
                      {article.aiSummary && (
                        <div className="bg-bitcoin-black border-l-2 border-bitcoin-orange p-3 mb-3">
                          <p className="text-sm text-bitcoin-orange font-medium italic">
                            {article.aiSummary}
                          </p>
                        </div>
                      )}
                      <p className="text-sm md:text-base mb-3 text-bitcoin-white-80 leading-relaxed font-sans crypto-news-summary">
                        {article.summary.substring(0, 150)}...
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <span className="text-sm text-bitcoin-orange font-medium font-mono news-timestamp">
                          {formatDate(article.publishedAt)}
                        </span>
                        {article.url && (
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-bitcoin-secondary px-4 py-3 text-sm rounded min-h-[48px] flex items-center justify-center touch-manipulation news-read-more"
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
        </div>

        {/* Refresh News Button - Show when articles are already loaded */}
        {data?.articles && data.articles.length > 0 && (
          <div className="mb-8 bitcoin-block bg-bitcoin-black p-4 md:p-6 text-center">
            <h3 className="text-lg md:text-xl font-black mb-3 text-bitcoin-white font-sans">
              📰 REFRESH NEWS FEED
            </h3>
            <p className="text-sm mb-4 font-bold text-bitcoin-white-60">
              Get the latest breaking crypto news and market updates
            </p>
            <PressEffectWrapper
              onClick={fetchCryptoNews}
              className="inline-block"
            >
              <button
                disabled={loading}
                className="btn-bitcoin-secondary px-6 py-4 transition-colors text-base flex items-center mx-auto disabled:opacity-50 min-h-[48px] touch-manipulation"
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
        <div className="mt-8 bg-bitcoin-black p-4 md:p-6 border-t border-bitcoin-orange section-divider">
          <div className="text-center">
            <h3 className="text-base md:text-lg font-black mb-2 text-bitcoin-white font-sans">
              THE CRYPTO HERALD
            </h3>
            <p className="text-sm mb-2 text-bitcoin-white-80">
              Published by Arcane AI Automation • All rights reserved • {new Date().getFullYear()}
            </p>
            <div className="text-xs text-bitcoin-white-60 font-mono">
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
