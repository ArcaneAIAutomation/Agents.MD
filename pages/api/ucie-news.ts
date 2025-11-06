/**
 * UCIE News API - Cryptocurrency News Aggregation
 * 
 * Fetches real-time cryptocurrency news from multiple sources
 * Provides rich context for Caesar AI analysis
 * 
 * Endpoint: GET /api/ucie-news?symbol=BTC&limit=10
 * 
 * Features:
 * - Multi-source news aggregation (NewsAPI, CryptoCompare)
 * - Sentiment analysis
 * - Category classification
 * - 5-minute cache TTL
 * - Symbol-specific filtering
 */

import { NextApiRequest, NextApiResponse } from 'next';

// API endpoints
const APIS = {
  newsapi: 'https://newsapi.org/v2',
  cryptocompare: 'https://min-api.cryptocompare.com/data/v2'
};

// In-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 300000; // 5 minutes

/**
 * Get cached data if available and fresh
 */
function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  
  if (!cached) {
    return null;
  }

  const age = Date.now() - cached.timestamp;
  
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  console.log(`✅ Cache hit for ${key} (age: ${(age / 1000).toFixed(1)}s)`);
  return {
    ...cached.data,
    cached: true,
    cacheAge: age
  };
}

/**
 * Set cache data
 */
function setCacheData(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Categorize article based on content
 */
function categorizeArticle(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('defi') || lowerContent.includes('decentralized finance')) {
    return 'DeFi';
  } else if (lowerContent.includes('nft') || lowerContent.includes('non-fungible')) {
    return 'NFTs';
  } else if (lowerContent.includes('regulation') || lowerContent.includes('sec') || lowerContent.includes('government')) {
    return 'Regulation';
  } else if (lowerContent.includes('mining') || lowerContent.includes('hash')) {
    return 'Mining';
  } else if (lowerContent.includes('technology') || lowerContent.includes('blockchain') || lowerContent.includes('protocol')) {
    return 'Technology';
  } else if (lowerContent.includes('institutional') || lowerContent.includes('bank') || lowerContent.includes('etf')) {
    return 'Institutional';
  } else if (lowerContent.includes('gaming') || lowerContent.includes('metaverse')) {
    return 'Gaming';
  } else if (lowerContent.includes('payment') || lowerContent.includes('adoption')) {
    return 'Payments';
  } else {
    return 'Market News';
  }
}

/**
 * Analyze sentiment based on content
 */
function analyzeSentiment(content: string): { sentiment: 'Bullish' | 'Bearish' | 'Neutral'; score: number } {
  const lowerContent = content.toLowerCase();
  
  const bullishWords = ['surge', 'rise', 'gain', 'bull', 'positive', 'growth', 'increase', 'adoption', 'breakthrough', 'milestone', 'record', 'high', 'rally', 'boost', 'soar', 'jump', 'climb'];
  const bearishWords = ['fall', 'drop', 'crash', 'bear', 'negative', 'decline', 'decrease', 'concern', 'risk', 'low', 'sell-off', 'dump', 'fear', 'plunge', 'tumble', 'collapse'];
  
  const bullishCount = bullishWords.filter(word => lowerContent.includes(word)).length;
  const bearishCount = bearishWords.filter(word => lowerContent.includes(word)).length;
  
  const totalWords = bullishCount + bearishCount;
  const score = totalWords > 0 ? ((bullishCount - bearishCount) / totalWords) : 0;
  
  if (bullishCount > bearishCount && bullishCount > 0) {
    return { sentiment: 'Bullish', score: Math.min(100, 50 + (score * 50)) };
  }
  if (bearishCount > bullishCount && bearishCount > 0) {
    return { sentiment: 'Bearish', score: Math.max(0, 50 + (score * 50)) };
  }
  return { sentiment: 'Neutral', score: 50 };
}

/**
 * Fetch from NewsAPI
 */
async function fetchNewsAPIData(symbol: string, limit: number) {
  try {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NewsAPI key not configured');
    }

    const searchQuery = `${symbol} OR cryptocurrency OR crypto`;
    console.log(`🔍 Fetching NewsAPI data for "${searchQuery}"...`);
    
    const response = await fetch(
      `${APIS.newsapi}/everything?q=${encodeURIComponent(searchQuery)}&sortBy=publishedAt&pageSize=${limit}&language=en&apiKey=${process.env.NEWS_API_KEY}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'UCIE/1.0' }
      }
    );

    if (!response.ok) throw new Error(`NewsAPI HTTP ${response.status}`);

    const data = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
      throw new Error('No articles returned');
    }

    const articles = data.articles
      .filter((article: any) => 
        article.title && 
        article.description && 
        !article.title.includes('[Removed]')
      )
      .map((article: any) => {
        const content = `${article.title} ${article.description}`;
        const sentimentAnalysis = analyzeSentiment(content);
        
        return {
          id: `newsapi-${article.publishedAt}`,
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.urlToImage,
          source: article.source?.name || 'NewsAPI',
          publishedAt: article.publishedAt,
          category: categorizeArticle(content),
          sentiment: sentimentAnalysis.sentiment,
          sentimentScore: sentimentAnalysis.score,
          author: article.author
        };
      });

    console.log(`✅ NewsAPI: ${articles.length} articles`);
    return { success: true, articles, source: 'NewsAPI' };

  } catch (error) {
    console.error(`❌ NewsAPI failed:`, error instanceof Error ? error.message : 'Unknown error');
    return { success: false, articles: [], source: 'NewsAPI', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch from CryptoCompare
 */
async function fetchCryptoCompareData(symbol: string, limit: number) {
  try {
    console.log(`🔍 Fetching CryptoCompare news for ${symbol}...`);
    
    const response = await fetch(
      `${APIS.cryptocompare}/news/?lang=EN&sortOrder=latest&categories=${symbol}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'UCIE/1.0' }
      }
    );

    if (!response.ok) throw new Error(`CryptoCompare HTTP ${response.status}`);

    const data = await response.json();
    
    if (!data.Data || data.Data.length === 0) {
      throw new Error('No articles returned');
    }

    const articles = data.Data
      .slice(0, limit)
      .map((article: any) => {
        const content = `${article.title} ${article.body}`;
        const sentimentAnalysis = analyzeSentiment(content);
        
        return {
          id: `cryptocompare-${article.id}`,
          title: article.title,
          description: article.body ? article.body.substring(0, 200) + '...' : '',
          url: article.url,
          urlToImage: article.imageurl,
          source: article.source_info?.name || 'CryptoCompare',
          publishedAt: new Date(article.published_on * 1000).toISOString(),
          category: categorizeArticle(content),
          sentiment: sentimentAnalysis.sentiment,
          sentimentScore: sentimentAnalysis.score,
          tags: article.tags?.split('|') || []
        };
      });

    console.log(`✅ CryptoCompare: ${articles.length} articles`);
    return { success: true, articles, source: 'CryptoCompare' };

  } catch (error) {
    console.error(`❌ CryptoCompare failed:`, error instanceof Error ? error.message : 'Unknown error');
    return { success: false, articles: [], source: 'CryptoCompare', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Calculate overall sentiment from articles
 */
function calculateOverallSentiment(articles: any[]) {
  if (articles.length === 0) {
    return { sentiment: 'Neutral', score: 50, distribution: { bullish: 0, bearish: 0, neutral: 0 } };
  }

  const bullishCount = articles.filter(a => a.sentiment === 'Bullish').length;
  const bearishCount = articles.filter(a => a.sentiment === 'Bearish').length;
  const neutralCount = articles.filter(a => a.sentiment === 'Neutral').length;

  const avgScore = articles.reduce((sum, a) => sum + a.sentimentScore, 0) / articles.length;

  let overallSentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (bullishCount > bearishCount && bullishCount > neutralCount) {
    overallSentiment = 'Bullish';
  } else if (bearishCount > bullishCount && bearishCount > neutralCount) {
    overallSentiment = 'Bearish';
  }

  return {
    sentiment: overallSentiment,
    score: Math.round(avgScore),
    distribution: {
      bullish: Math.round((bullishCount / articles.length) * 100),
      bearish: Math.round((bearishCount / articles.length) * 100),
      neutral: Math.round((neutralCount / articles.length) * 100)
    }
  };
}

/**
 * Main API handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { symbol = 'BTC', limit = '10' } = req.query;

    // Validate parameters
    if (typeof symbol !== 'string' || typeof limit !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        timestamp: new Date().toISOString()
      });
    }

    const symbolUpper = symbol.toUpperCase();
    const limitNum = Math.min(parseInt(limit, 10), 50); // Max 50 articles
    const cacheKey = `news-${symbolUpper}-${limitNum}`;

    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    console.log(`🚀 Fetching news for ${symbolUpper} (limit: ${limitNum})...`);

    // Fetch from both sources in parallel
    const [newsAPIData, cryptoCompareData] = await Promise.all([
      fetchNewsAPIData(symbolUpper, limitNum),
      fetchCryptoCompareData(symbolUpper, limitNum)
    ]);

    // Combine and deduplicate articles
    const allArticles = [...newsAPIData.articles, ...cryptoCompareData.articles];
    const uniqueArticles = allArticles
      .filter((article, index, self) => 
        index === self.findIndex(a => a.title === article.title)
      )
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limitNum);

    if (uniqueArticles.length === 0) {
      throw new Error('No news articles available from any source');
    }

    // Calculate overall sentiment
    const overallSentiment = calculateOverallSentiment(uniqueArticles);

    // Build response
    const response = {
      success: true,
      symbol: symbolUpper,
      articles: uniqueArticles,
      sentiment: overallSentiment,
      sources: {
        newsapi: newsAPIData,
        cryptocompare: cryptoCompareData
      },
      dataQuality: {
        totalArticles: uniqueArticles.length,
        successfulSources: [newsAPIData, cryptoCompareData].filter(s => s.success).length,
        failedSources: [newsAPIData, cryptoCompareData].filter(s => !s.success).map(s => s.source)
      },
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Cache the response
    setCacheData(cacheKey, response);

    console.log(`✅ News for ${symbolUpper}: ${uniqueArticles.length} articles, sentiment: ${overallSentiment.sentiment} (${overallSentiment.score})`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ UCIE News API Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
