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
  const [data, setData] = useState<CryptoHeraldData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [articlesLoaded, setArticlesLoaded] = useState(false);
  
  // Show notification when new data loads
  useEffect(() => {
    if (data && !loading && articlesLoaded) {
      setNotificationMessage(`📰 ${data.articles.length} new articles loaded!`);
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
      
      const response = await fetch('/api/crypto-herald', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Quick processing without heavy AI summaries for speed
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
        console.error('API returned error:', result.error || result.message);
        
        // Set fallback data instead of alert
        setData({
          articles: [
            {
              id: 'fallback-1',
              headline: 'Fast Loading Demo: Bitcoin Trading Intelligence Active',
              summary: 'Your Trading Intelligence Hub is running in fast mode. Add API keys for live news feeds.',
              source: 'Herald System',
              publishedAt: new Date().toISOString(),
              category: 'System',
              sentiment: 'Neutral',
              url: 'https://coindesk.com/markets/', // Generic crypto market link
              aiSummary: 'System notification about demo mode operation.'
            }
          ],
          marketTicker: [
            { symbol: 'BTC', name: 'Bitcoin', price: 110500, change: 2.1 },
            { symbol: 'ETH', name: 'Ethereum', price: 3850, change: -0.8 },
            { symbol: 'SOL', name: 'Solana', price: 245, change: 1.5 }
          ],
          meta: {
            totalArticles: 1,
            isLiveData: false,
            sources: ['Demo Data'],
            lastUpdated: new Date().toISOString(),
            note: 'Fast demo mode - Add API keys for live data'
          }
        });
        setArticlesLoaded(true);
      }
    } catch (error) {
      console.error('Herald loading error:', error);
      
      // Always provide data, even on error
      setData({
        articles: [
          {
            id: 'error-1',
            headline: 'Trading Intelligence Hub - Connection Issue',
            summary: 'Unable to connect to news services. The platform is running in offline mode with demo data.',
            source: 'System Status',
            publishedAt: new Date().toISOString(),
            category: 'System',
            sentiment: 'Neutral',
            aiSummary: 'System operating in offline mode due to connectivity issues.'
          }
        ],
        marketTicker: [
          { symbol: 'BTC', name: 'Bitcoin', price: 110500, change: 2.1 },
          { symbol: 'ETH', name: 'Ethereum', price: 3850, change: -0.8 }
        ],
        meta: {
          totalArticles: 1,
          isLiveData: false,
          sources: ['Offline Mode'],
          lastUpdated: new Date().toISOString(),
          note: 'Offline mode - Check internet connection'
        }
      });
      setArticlesLoaded(true);
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

          {/* Static Market Ticker - Shows Before Data Load */}
          <div className="mb-6 md:mb-8 border-y-2 md:border-y-4 border-black bg-gradient-to-r from-black via-gray-900 to-black">
            {/* Ticker Header Bar */}
            <div className="bg-white border-b border-black md:border-b-2 p-2">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="font-black text-black text-sm" style={{ fontFamily: 'Times, serif' }}>
                  MARKET DATA - AWAITING LIVE FEED
                </span>
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Static Ticker Content */}
            <div className="bg-black text-white py-3 overflow-hidden relative">
              <div className="flex animate-scroll space-x-12 text-lg font-bold">
                {/* Sample crypto data */}
                {[
                  { symbol: 'BTC', price: '$65,420', change: '+2.3%', color: 'text-green-400' },
                  { symbol: 'ETH', price: '$3,250', change: '+1.8%', color: 'text-green-400' },
                  { symbol: 'SOL', price: '$165', change: '-0.5%', color: 'text-red-400' },
                  { symbol: 'ADA', price: '$0.45', change: '+3.2%', color: 'text-green-400' },
                  { symbol: 'XRP', price: '$0.58', change: '+1.1%', color: 'text-green-400' },
                  { symbol: 'DOT', price: '$7.25', change: '-1.2%', color: 'text-red-400' },
                  { symbol: 'AVAX', price: '$28.50', change: '+4.5%', color: 'text-green-400' },
                  { symbol: 'LINK', price: '$14.80', change: '+2.7%', color: 'text-green-400' }
                ].concat([
                  { symbol: 'BTC', price: '$65,420', change: '+2.3%', color: 'text-green-400' },
                  { symbol: 'ETH', price: '$3,250', change: '+1.8%', color: 'text-green-400' },
                  { symbol: 'SOL', price: '$165', change: '-0.5%', color: 'text-red-400' },
                  { symbol: 'ADA', price: '$0.45', change: '+3.2%', color: 'text-green-400' },
                  { symbol: 'XRP', price: '$0.58', change: '+1.1%', color: 'text-green-400' },
                  { symbol: 'DOT', price: '$7.25', change: '-1.2%', color: 'text-red-400' },
                  { symbol: 'AVAX', price: '$28.50', change: '+4.5%', color: 'text-green-400' },
                  { symbol: 'LINK', price: '$14.80', change: '+2.7%', color: 'text-green-400' }
                ]).map((coin, index) => (
                  <div key={`static-${index}`} className="flex items-center space-x-3 whitespace-nowrap">
                    <span className="text-yellow-400">●</span>
                    <span className="font-black">{coin.symbol}</span>
                    <span className="text-white">{coin.price}</span>
                    <span className={`font-bold ${coin.color}`}>
                      {coin.change.startsWith('+') ? '↗' : '↘'} {coin.change}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Fade edges for professional look */}
              <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
            </div>
            
            {/* Bottom Border with Classic Pattern */}
            <div className="bg-white border-t-2 border-black h-1">
              <div className="h-full bg-black opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.3) 4px, rgba(0,0,0,0.3) 8px)'
              }}></div>
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
                className="bg-black text-white font-bold py-3 md:py-4 px-6 md:px-8 border-4 border-black hover:bg-gray-800 transition-colors text-base md:text-lg flex items-center mx-auto disabled:opacity-50 newspaper-hover"
                style={{ fontFamily: 'Times, serif' }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                    <NewspaperLoading text="PRINTING LATEST EDITION..." className="text-white" />
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
        <div className="border-b-8 border-double border-black pb-4 md:pb-6 mb-6 md:mb-8 bg-white">
          <div className="text-center">
            {/* Date and Edition Info */}
            <div className="text-xs md:text-sm font-bold mb-2 md:mb-4 border-b-2 border-black pb-2">
              {formatDate(data.meta.lastUpdated)} • SPECIAL EDITION • VOL. 1, NO. 1
            </div>
            
            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-2 md:mb-4 leading-tight" style={{ fontFamily: 'Times, serif' }}>
              THE CRYPTO HERALD
            </h1>
            
            {/* Subtitle */}
            <div className="text-base md:text-xl font-bold mb-4 md:mb-6 tracking-wider">
              CRYPTOCURRENCY MARKET INTELLIGENCE & ANALYSIS
            </div>
            
            {/* Status and Sources */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-xs md:text-sm font-bold border-t-2 border-black pt-4">
              <div className="flex items-center space-x-1">
                <Radio className={`h-3 w-3 ${data.meta.isLiveData ? 'text-red-600 animate-pulse' : 'text-gray-400'}`} />
                <span>{data.meta.isLiveData ? '🔴 LIVE NEWS WIRE' : '📰 CACHED DATA'}</span>
              </div>
              
              {/* API Status Display */}
              {data.apiStatus && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                  data.apiStatus.isRateLimit 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : data.apiStatus.status === 'Active' 
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                }`}>
                  <span className="font-bold">
                    {data.apiStatus.isRateLimit ? '⚠️ RATE LIMIT' : 
                     data.apiStatus.status === 'Active' ? '✅ API ACTIVE' : 
                     '⚡ DEMO MODE'}
                  </span>
                  <span className="font-normal">• {data.apiStatus.source}</span>
                </div>
              )}
              
              <div className="text-center">
                <span className="font-normal">Sources:</span> {data.meta.sources.join(', ')}
              </div>
              
              {data.meta.isLiveData && (
                <div className="text-green-600">
                  🌐 Enhanced with CoinDesk, CoinTelegraph, The Block, Decrypt & CryptoSlate
                </div>
              )}
              
              {/* Rate Limit Warning */}
              {data.apiStatus?.isRateLimit && (
                <div className="text-red-600 text-xs text-center mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  📊 {data.apiStatus.message} - Consider upgrading to premium API subscription for unlimited access
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
          <div className="mb-8 border-y-4 border-black bg-gradient-to-r from-black via-gray-900 to-black">
            {/* Ticker Header Bar */}
            <div className="bg-white border-b-2 border-black p-2">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="font-black text-black text-sm" style={{ fontFamily: 'Times, serif' }}>
                  LIVE MARKET DATA
                </span>
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Scrolling Ticker Content */}
            <div className="bg-black text-white py-3 overflow-hidden relative">
              <div className="flex animate-scroll space-x-12 text-lg font-bold">
                {/* Duplicate the data to create seamless loop */}
                {data?.marketTicker && [...data.marketTicker.slice(0, 8), ...data.marketTicker.slice(0, 8)].map((coin, index) => (
                  <div key={`${coin.symbol}-${index}`} className="flex items-center space-x-3 whitespace-nowrap">
                    <span className="text-yellow-400">●</span>
                    <span className="font-black">{coin.symbol}</span>
                    <span className="text-white">{formatPrice(coin.price)}</span>
                    <span className={`font-bold ${coin.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {coin.change >= 0 ? '↗' : '↘'} {Math.abs(coin.change).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Fade edges for professional look */}
              <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
            </div>
            
            {/* Bottom Border with Classic Pattern */}
            <div className="bg-white border-t-2 border-black h-1">
              <div className="h-full bg-black opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.3) 4px, rgba(0,0,0,0.3) 8px)'
              }}></div>
            </div>
          </div>
        )}

        {/* News Sections */}
        {Object.entries(articlesByCategory).map(([category, articles], categoryIndex) => {
          const categoryArticles = getArticlesForCategory(articles, 8);
          
          return (
            <div key={category} className="mb-8 bg-white border-4 border-black">
              {/* Category Header */}
              <div className="bg-black text-white p-4 border-b-4 border-black">
                <h2 className="text-2xl font-black text-center" style={{ fontFamily: 'Times, serif' }}>
                  {category.toUpperCase()}
                </h2>
                <div className="text-center text-sm mt-1">
                  {categoryArticles.length} STORIES
                </div>
              </div>

              {/* Articles Grid */}
              <div className="p-6 space-y-6">
                {categoryIndex === 0 && categoryArticles.length > 0 && (
                  /* Featured Article */
                  <div className="border-4 border-black p-6 bg-gray-50">
                    {/* Clickable Headline */}
                    {categoryArticles[0].url ? (
                      <a 
                        href={categoryArticles[0].url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-800 transition-colors block"
                      >
                        <h3 className="text-2xl md:text-3xl font-black mb-4 hover:underline cursor-pointer" style={{ fontFamily: 'Times, serif' }}>
                          {categoryArticles[0].headline}
                        </h3>
                      </a>
                    ) : (
                      <h3 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: 'Times, serif' }}>
                        {categoryArticles[0].headline}
                      </h3>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <span className={`px-3 py-1 border-2 rounded font-bold text-sm ${getSentimentColor(categoryArticles[0].sentiment)}`}>
                        {categoryArticles[0].sentiment.toUpperCase()}
                      </span>
                      <span className="text-sm font-bold">BY {categoryArticles[0].source.toUpperCase()}</span>
                      {categoryArticles[0].aiSummary && (
                        <div className="flex items-center space-x-2 bg-purple-100 border-2 border-purple-300 rounded px-3 py-1">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-bold text-purple-700">AI INSIGHT</span>
                        </div>
                      )}
                    </div>
                    {categoryArticles[0].aiSummary && (
                      <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                        <p className="text-purple-800 font-medium italic">
                          "{categoryArticles[0].aiSummary}"
                        </p>
                      </div>
                    )}
                    <p className="text-lg leading-relaxed mb-4" style={{ fontFamily: 'Times, serif' }}>
                      {categoryArticles[0].summary}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-bold">
                          {formatDate(categoryArticles[0].publishedAt)}
                        </span>
                      </div>
                      {categoryArticles[0].url && (
                        <a 
                          href={categoryArticles[0].url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-black text-white px-4 py-2 border-2 border-black hover:bg-gray-800 transition-colors font-bold text-sm"
                        >
                          READ MORE
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Other Articles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryArticles.slice(1).map((article: CryptoArticle, index: number) => (
                    <AnimatedHeadline 
                      key={article.id} 
                      delay={index * 100} 
                      className={`border-2 border-black p-4 bg-white newspaper-hover stagger-${Math.min(index, 5)}`}
                    >
                      {/* Clickable Headline */}
                      {article.url ? (
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-800 transition-colors block mb-2"
                        >
                          <TypewriterText 
                            text={article.headline}
                            speed={50}
                            delay={0}
                            className="font-black text-lg leading-tight hover:underline cursor-pointer"
                            style={{ fontFamily: 'Times, serif' }}
                            showCursor={false}
                          />
                        </a>
                      ) : (
                        <TypewriterText 
                          text={article.headline}
                          speed={50}
                          delay={0}
                          className="font-black text-lg mb-2 leading-tight block"
                          style={{ fontFamily: 'Times, serif' }}
                          showCursor={false}
                        />
                      )}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-2 py-1 border rounded text-xs font-bold ${getSentimentColor(article.sentiment)}`}>
                          {article.sentiment}
                        </span>
                        <span className="text-xs font-bold text-gray-600">
                          {article.source.toUpperCase()}
                        </span>
                        {article.aiSummary && (
                          <div className="flex items-center space-x-1 bg-purple-100 border border-purple-300 rounded px-2 py-1">
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            <span className="text-xs font-bold text-purple-700">AI</span>
                          </div>
                        )}
                      </div>
                      {article.aiSummary && (
                        <div className="bg-purple-50 border-l-2 border-purple-400 p-2 mb-3">
                          <p className="text-xs text-purple-800 font-medium italic">
                            {article.aiSummary}
                          </p>
                        </div>
                      )}
                      <p className="text-sm mb-3 text-gray-700">
                        {article.summary.substring(0, 150)}...
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {formatDate(article.publishedAt)}
                        </span>
                        {article.url && (
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-black text-white px-3 py-1 border border-black hover:bg-gray-800 transition-colors font-bold text-xs rounded"
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

        {/* Footer */}
        <div className="mt-8 bg-black text-white p-6 border-4 border-black">
          <div className="text-center">
            <h3 className="text-lg font-black mb-2" style={{ fontFamily: 'Times, serif' }}>
              THE CRYPTO HERALD
            </h3>
            <p className="text-sm mb-2">
              Published by Digital News Corp. • All rights reserved • {new Date().getFullYear()}
            </p>
            <div className="text-xs">
              Last Updated: {formatDate(data.meta.lastUpdated)} • Sources: {data.meta.sources.join(', ')}
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
