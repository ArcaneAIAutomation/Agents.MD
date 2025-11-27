import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  RefreshCw, 
  Radio,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  MessageCircle,
  Star,
  Shield,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

interface EnrichedBitcoinArticle {
  id: string;
  headline: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
  
  socialMetrics: {
    mentions: number;
    engagement: number;
    sentiment: number;
    socialScore: number;
    influencerScore: number;
  };
  
  marketImpact: {
    score: number;
    direction: 'Bullish' | 'Bearish' | 'Neutral';
    confidence: number;
    timeframe: 'Short' | 'Medium' | 'Long';
  };
  
  relevanceScore: number;
  category: string;
  tags: string[];
  
  aiAnalysis: {
    keyTakeaway: string;
    tradingSignal: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    actionableInsight: string;
  };
  
  sourceReliability: number;
  isVerified: boolean;
}

interface BitcoinNewsData {
  articles: EnrichedBitcoinArticle[];
  marketTicker?: any[];
  apiStatus?: {
    source: string;
    status: string;
    message: string;
    isRateLimit?: boolean;
  };
  meta: {
    totalArticles: number;
    lunarcrushArticles: number;
    newsapiArticles: number;
    isLiveData: boolean;
    sources: string[];
    lastUpdated: string;
    note?: string;
  };
}

const BitcoinNewsWire: React.FC = () => {
  const [data, setData] = useState<BitcoinNewsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchBitcoinNews = async () => {
    setLoading(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/bitcoin-news-wire', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        setIsExpanded(true); // Auto-expand on load
      } else {
        throw new Error('No data available');
      }
    } catch (error) {
      console.error('Bitcoin News Wire error:', error);
      setData({
        articles: [],
        marketTicker: [],
        apiStatus: {
          source: 'Error',
          status: 'Failed',
          message: 'Unable to load Bitcoin news',
          isRateLimit: true
        },
        meta: {
          totalArticles: 0,
          lunarcrushArticles: 0,
          newsapiArticles: 0,
          isLiveData: false,
          sources: ['Error'],
          lastUpdated: new Date().toISOString()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleArticle = (articleId: string) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedArticles(newExpanded);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'Bullish': return <TrendingUp className="h-4 w-4 text-bitcoin-orange" />;
      case 'Bearish': return <TrendingDown className="h-4 w-4 text-bitcoin-white-60" />;
      default: return <Minus className="h-4 w-4 text-bitcoin-white-60" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-bitcoin-orange';
      case 'Medium': return 'text-bitcoin-white-80';
      case 'High': return 'text-bitcoin-white-60';
      default: return 'text-bitcoin-white-60';
    }
  };

  if (!data) {
    return (
      <div className="w-full bg-bitcoin-black mx-auto">
        <div className="p-4 md:p-6 lg:p-8 bg-bitcoin-black">
          {/* Header */}
          <div className="border-b border-bitcoin-orange pb-6 mb-8 bg-bitcoin-black">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 leading-tight text-bitcoin-white font-sans">
                BITCOIN NEWS WIRE
              </h1>
              <p className="text-base md:text-xl font-bold mb-6 tracking-wider text-bitcoin-orange">
                ENHANCED WITH LUNARCRUSH SOCIAL METRICS & GPT-5.1 AI ANALYSIS
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-xs md:text-sm font-bold border-t border-bitcoin-orange-20 pt-4 text-bitcoin-white-80">
                <div className="flex items-center space-x-2">
                  <Radio className="h-4 w-4 text-bitcoin-orange animate-pulse" />
                  <span className="text-bitcoin-orange">READY TO FETCH</span>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bitcoin-block bg-bitcoin-black p-8">
            <h2 className="text-2xl md:text-3xl font-black mb-6 text-bitcoin-white font-sans">
              🗞️ FETCH BITCOIN NEWS 🗞️
            </h2>
            <button
              onClick={fetchBitcoinNews}
              disabled={loading}
              className="btn-bitcoin-primary py-4 px-8 text-lg flex items-center mx-auto disabled:opacity-50 min-h-[48px]"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  LOADING...
                </>
              ) : (
                <>
                  <Newspaper className="h-5 w-5 mr-2" />
                  FETCH LATEST BITCOIN NEWS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-bitcoin-black mx-auto">
      <div className="p-4 md:p-6 lg:p-8 bg-bitcoin-black">
        {/* Header */}
        <div className="pb-6 mb-8 bg-bitcoin-black">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 leading-tight text-bitcoin-white font-sans">
              BITCOIN NEWS WIRE
            </h1>
            <p className="text-base md:text-xl font-bold mb-6 tracking-wider text-bitcoin-orange">
              ENHANCED WITH LUNARCRUSH SOCIAL METRICS & GPT-5.1 AI ANALYSIS
            </p>
            
            {/* Data Sources */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="bg-bitcoin-black border border-bitcoin-orange px-4 py-2 rounded text-xs font-medium text-bitcoin-orange">
                LunarCrush API
              </span>
              <span className="bg-bitcoin-black border border-bitcoin-orange px-4 py-2 rounded text-xs font-medium text-bitcoin-orange">
                NewsAPI
              </span>
              <span className="bg-bitcoin-black border border-bitcoin-orange px-4 py-2 rounded text-xs font-medium text-bitcoin-orange">
                GPT-5.1
              </span>
              <span className="bg-bitcoin-black border border-bitcoin-orange px-4 py-2 rounded text-xs font-medium text-bitcoin-orange">
                CoinGecko
              </span>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-bitcoin-white-80">
              <div className="flex items-center space-x-2">
                <Radio className="h-4 w-4 text-bitcoin-orange animate-pulse" />
                <span className="text-bitcoin-orange">LIVE DATA</span>
              </div>
              <div>
                <span className="text-bitcoin-white-60">Articles:</span> {data.meta.totalArticles}
              </div>
              <div>
                <span className="text-bitcoin-white-60">LunarCrush:</span> {data.meta.lunarcrushArticles}
              </div>
              <div>
                <span className="text-bitcoin-white-60">NewsAPI:</span> {data.meta.newsapiArticles}
              </div>
            </div>
          </div>
          
          <div className="w-full h-px bg-bitcoin-orange mt-6"></div>
        </div>

        {/* Market Ticker */}
        {data.marketTicker && data.marketTicker.length > 0 && (
          <div className="mb-8 border-y-2 border-bitcoin-orange bg-bitcoin-black">
            <div className="bg-bitcoin-black border-b border-bitcoin-orange-30 p-3">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-3 h-3 bg-bitcoin-orange rounded-full animate-pulse"></div>
                <span className="font-black text-bitcoin-white text-sm uppercase tracking-wider">
                  LIVE MARKET DATA
                </span>
                <div className="w-3 h-3 bg-bitcoin-orange rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="bg-bitcoin-black py-3 overflow-hidden relative">
              <div className="flex animate-scroll space-x-12 text-lg font-bold">
                {[...data.marketTicker, ...data.marketTicker].map((coin, index) => (
                  <div key={`${coin.symbol}-${index}`} className="flex items-center space-x-3 whitespace-nowrap">
                    <span className="text-bitcoin-orange">●</span>
                    <span className="font-black text-bitcoin-white">{coin.symbol}</span>
                    <span className="text-bitcoin-orange">{formatPrice(coin.price)}</span>
                    <span className={`font-bold ${coin.change >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                      {coin.change >= 0 ? '↗' : '↘'} {Math.abs(coin.change).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collapsible News Section */}
        <div className="mb-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-6 bg-bitcoin-black border border-bitcoin-orange rounded-xl hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
              <Newspaper className="h-6 w-6 text-bitcoin-orange" />
              <div className="text-left">
                <h2 className="text-2xl font-black text-bitcoin-white">
                  BITCOIN NEWS ({data.articles.length})
                </h2>
                <p className="text-sm text-bitcoin-white-60">
                  Enhanced with social metrics and AI analysis
                </p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-6 w-6 text-bitcoin-orange" />
            ) : (
              <ChevronDown className="h-6 w-6 text-bitcoin-orange" />
            )}
          </button>
        </div>

        {/* Articles Grid */}
        {isExpanded && (
          <div className="grid grid-cols-1 gap-6">
            {data.articles.map((article) => (
              <div
                key={article.id}
                className="bg-bitcoin-black border border-bitcoin-orange rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] transition-all"
              >
                {/* Article Header */}
                <div className="p-6 border-b border-bitcoin-orange-20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-bitcoin-white mb-2 leading-tight">
                        {article.headline}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-bitcoin-white-60">
                        <span className="flex items-center space-x-1">
                          {article.isVerified && <Shield className="h-3 w-3 text-bitcoin-orange" />}
                          <span>{article.source}</span>
                        </span>
                        <span>•</span>
                        <span>{formatDate(article.publishedAt)}</span>
                        <span>•</span>
                        <span className="text-bitcoin-orange">{article.category}</span>
                      </div>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 p-2 bg-bitcoin-orange text-bitcoin-black rounded hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Summary */}
                  <p className="text-bitcoin-white-80 mb-4">
                    {article.summary}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white-60"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Social Score */}
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Users className="h-4 w-4 text-bitcoin-orange" />
                        <span className="text-xs text-bitcoin-white-60">Social Score</span>
                      </div>
                      <div className="text-lg font-bold text-bitcoin-orange">
                        {article.socialMetrics.socialScore}/100
                      </div>
                    </div>

                    {/* Engagement */}
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageCircle className="h-4 w-4 text-bitcoin-orange" />
                        <span className="text-xs text-bitcoin-white-60">Engagement</span>
                      </div>
                      <div className="text-lg font-bold text-bitcoin-white">
                        {article.socialMetrics.engagement.toLocaleString()}
                      </div>
                    </div>

                    {/* Market Impact */}
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Target className="h-4 w-4 text-bitcoin-orange" />
                        <span className="text-xs text-bitcoin-white-60">Impact</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getDirectionIcon(article.marketImpact.direction)}
                        <span className="text-lg font-bold text-bitcoin-white">
                          {article.marketImpact.score}/10
                        </span>
                      </div>
                    </div>

                    {/* Relevance */}
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Star className="h-4 w-4 text-bitcoin-orange" />
                        <span className="text-xs text-bitcoin-white-60">Relevance</span>
                      </div>
                      <div className="text-lg font-bold text-bitcoin-orange">
                        {article.relevanceScore}/100
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Section */}
                <div className="p-6 bg-bitcoin-black">
                  <button
                    onClick={() => toggleArticle(article.id)}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-bitcoin-orange">
                        🤖 GPT-5.1 AI ANALYSIS
                      </span>
                      <span className="text-xs text-bitcoin-white-60">
                        ({article.marketImpact.confidence}% confidence)
                      </span>
                    </div>
                    {expandedArticles.has(article.id) ? (
                      <ChevronUp className="h-5 w-5 text-bitcoin-orange" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-bitcoin-orange" />
                    )}
                  </button>

                  {expandedArticles.has(article.id) && (
                    <div className="space-y-4">
                      {/* Key Takeaway */}
                      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-4">
                        <div className="text-xs font-bold text-bitcoin-white-60 mb-2">
                          KEY TAKEAWAY
                        </div>
                        <div className="text-sm text-bitcoin-white">
                          {article.aiAnalysis.keyTakeaway}
                        </div>
                      </div>

                      {/* Trading Signal */}
                      <div className="bg-bitcoin-black border border-bitcoin-orange rounded p-4">
                        <div className="text-xs font-bold text-bitcoin-white-60 mb-2">
                          TRADING SIGNAL
                        </div>
                        <div className="text-sm font-bold text-bitcoin-orange">
                          {article.aiAnalysis.tradingSignal}
                        </div>
                      </div>

                      {/* Actionable Insight */}
                      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-4">
                        <div className="text-xs font-bold text-bitcoin-white-60 mb-2">
                          ACTIONABLE INSIGHT
                        </div>
                        <div className="text-sm text-bitcoin-white">
                          {article.aiAnalysis.actionableInsight}
                        </div>
                      </div>

                      {/* Risk & Timeframe */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className={`h-4 w-4 ${getRiskColor(article.aiAnalysis.riskLevel)}`} />
                            <span className="text-xs font-bold text-bitcoin-white-60">
                              RISK LEVEL
                            </span>
                          </div>
                          <div className={`text-sm font-bold ${getRiskColor(article.aiAnalysis.riskLevel)}`}>
                            {article.aiAnalysis.riskLevel}
                          </div>
                        </div>

                        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-4">
                          <div className="text-xs font-bold text-bitcoin-white-60 mb-2">
                            TIMEFRAME
                          </div>
                          <div className="text-sm font-bold text-bitcoin-white">
                            {article.marketImpact.timeframe}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchBitcoinNews}
            disabled={loading}
            className="btn-bitcoin-secondary py-3 px-6 text-base flex items-center mx-auto disabled:opacity-50 min-h-[48px]"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                REFRESHING...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                REFRESH NEWS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BitcoinNewsWire;
