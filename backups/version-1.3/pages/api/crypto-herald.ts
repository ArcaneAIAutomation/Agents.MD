import { NextApiRequest, NextApiResponse } from 'next';

// Enhanced crypto news fetch with rate limit detection and deduplication
async function fetchCryptoNews() {
  const apiStatus = {
    source: 'Unknown',
    status: 'Error',
    message: 'Failed to fetch news',
    isRateLimit: false
  };

  let allArticles: any[] = [];
  let workingSources: string[] = [];

  try {
    // Try Alpha Vantage first (usually more reliable)
    if (process.env.ALPHA_VANTAGE_API_KEY && process.env.ALPHA_VANTAGE_API_KEY !== 'undefined') {
      console.log('Trying Alpha Vantage API...');
      const alphaResult = await fetchAlphaVantageNews();
      if (alphaResult.success) {
        console.log('Alpha Vantage success:', alphaResult.articles.length, 'articles');
        allArticles = allArticles.concat(alphaResult.articles);
        workingSources.push('Alpha Vantage');
      } else {
        console.log('Alpha Vantage failed:', alphaResult.error);
        if (alphaResult.error?.includes('rate limit') || alphaResult.error?.includes('limit exceeded')) {
          console.log('Alpha Vantage rate limited - will try NewsAPI');
        }
      }
    }

    // Try NewsAPI (either as primary or fallback)
    if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'undefined') {
      console.log('Trying NewsAPI...');
      
      // Try broader search (last 10 days for better results) - English only
      const lastTenDays = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const newsUrl = `https://newsapi.org/v2/everything?q=bitcoin+OR+cryptocurrency+OR+crypto&from=${lastTenDays}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${process.env.NEWS_API_KEY}`;
      
      const response = await fetch(newsUrl, { 
        signal: AbortSignal.timeout(8000)
      });
      
      const data = await response.json();
      
      if (data.status === 'error') {
        console.log('NewsAPI error:', data.code, data.message);
        if (data.code === 'rateLimited') {
          console.log('NewsAPI rate limited');
        }
      } else if (response.ok && data.articles && data.articles.length > 0) {
        console.log('NewsAPI success:', data.articles.length, 'articles');
        
        // Filter for English articles only and process
        const englishArticles = data.articles.filter((article: any) => 
          isEnglishArticle(article.title, article.description)
        );
        
        console.log('English articles filtered:', englishArticles.length, 'of', data.articles.length);
        
        const processedArticles = englishArticles.slice(0, 15).map((article: any, index: number) => ({
          id: `news-${Date.now()}-${index}`,
          headline: article.title || 'Breaking Crypto News',
          summary: article.description || 'Latest developments in cryptocurrency markets.',
          source: extractSourceName(article.source?.name || 'Crypto News'),
          publishedAt: article.publishedAt || new Date().toISOString(),
          category: categorizeArticle(article.title || ''),
          sentiment: getSentiment(article.title || ''),
          url: article.url,
          imageUrl: article.urlToImage,
          isLive: true
        }));
        
        allArticles = allArticles.concat(processedArticles);
        workingSources.push('NewsAPI');
      }
    }

    // If we have articles from any source, deduplicate and return
    if (allArticles.length > 0) {
      const deduplicatedArticles = deduplicateArticles(allArticles);
      const finalArticles = deduplicatedArticles.slice(0, 12); // Limit to 12 total
      
      return { 
        articles: finalArticles, 
        apiStatus: { 
          source: workingSources.join(' + '), 
          status: 'Active', 
          message: `Live news feed active from ${workingSources.join(' and ')}`, 
          isRateLimit: false 
        } 
      };
    }

    // If we get here, either no API keys or all APIs failed (not rate limited)
    console.log('No valid API keys configured or all APIs failed');
    apiStatus.source = 'System';
    apiStatus.status = 'Fallback';
    apiStatus.message = 'APIs not available - using demo data for demonstration';
    apiStatus.isRateLimit = false;
    return { articles: null, apiStatus };

  } catch (error: any) {
    console.log('News fetch error:', error);
    apiStatus.source = 'System';
    apiStatus.status = 'Error';
    apiStatus.message = `Network error: ${error?.message || 'Unknown error'} - using fallback data`;
    apiStatus.isRateLimit = false;
    return { articles: null, apiStatus };
  }
}

// Deduplicate articles based on title similarity and URL
function deduplicateArticles(articles: any[]): any[] {
  const seen = new Set<string>();
  const deduplicated: any[] = [];
  
  for (const article of articles) {
    // Create a signature based on cleaned title and URL
    const titleWords = article.headline.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word: string) => word.length > 3)
      .slice(0, 5) // First 5 significant words
      .sort()
      .join(' ');
    
    const urlHost = article.url ? new URL(article.url).hostname : '';
    const signature = `${titleWords}-${urlHost}`;
    
    if (!seen.has(signature)) {
      seen.add(signature);
      deduplicated.push(article);
    }
  }
  
  return deduplicated;
}

// Check if article text is in English
function isEnglishArticle(title: string, description: string): boolean {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Common English words that are good indicators
  const englishIndicators = [
    'the', 'and', 'or', 'to', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'as',
    'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have', 'from', 'not', 'had', 'by', 'but', 'what',
    'bitcoin', 'crypto', 'cryptocurrency', 'ethereum', 'trading', 'market', 'price', 'analysis'
  ];
  
  // Non-English character patterns
  const nonEnglishPatterns = [
    /[\u4e00-\u9fff]/, // Chinese characters
    /[\u3040-\u309f\u30a0-\u30ff]/, // Japanese hiragana/katakana
    /[\u0400-\u04ff]/, // Cyrillic
    /[\u0590-\u05ff]/, // Hebrew
    /[\u0600-\u06ff]/, // Arabic
    /[\u0370-\u03ff]/, // Greek
    /[\u0900-\u097f]/, // Devanagari
  ];
  
  // Check for non-English characters
  for (const pattern of nonEnglishPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }
  
  // Count English indicator words
  const words = text.split(/\s+/);
  const englishWordCount = words.filter(word => 
    englishIndicators.includes(word.replace(/[^a-z]/g, ''))
  ).length;
  
  // If we have enough words and a reasonable percentage are English indicators
  if (words.length >= 5) {
    const englishRatio = englishWordCount / words.length;
    return englishRatio >= 0.1; // At least 10% recognizable English words
  }
  
  // For shorter text, be more lenient but still check for obvious non-English
  return words.length < 5 || englishWordCount > 0;
}

// Alpha Vantage news fetcher
async function fetchAlphaVantageNews() {
  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=CRYPTO:BTC,CRYPTO:ETH&topics=blockchain,technology&apikey=${process.env.ALPHA_VANTAGE_API_KEY}&limit=20`;
    
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(10000)
    });
    
    const data = await response.json();
    
    // Check for rate limit or API limit messages
    if (data.Information) {
      if (data.Information.includes('rate limit') || data.Information.includes('daily rate limit') || data.Information.includes('25 requests per day')) {
        return { success: false, error: 'Alpha Vantage daily rate limit exceeded (25 requests/day)' };
      }
      return { success: false, error: data.Information };
    }
    
    if (data.Error) {
      return { success: false, error: data.Error };
    }
    
    if (!data.feed || data.feed.length === 0) {
      return { success: false, error: 'No articles returned from Alpha Vantage' };
    }
    
    const articles = data.feed.slice(0, 15).map((item: any, index: number) => ({
      id: `alpha-${Date.now()}-${index}`,
      headline: item.title,
      summary: item.summary?.substring(0, 200) + '...' || 'Latest cryptocurrency market developments.',
      source: extractSourceName(item.source || 'Financial News'),
      publishedAt: item.time_published ? new Date(item.time_published).toISOString() : new Date().toISOString(),
      category: categorizeArticleAdvanced(item.title, item.topics),
      sentiment: mapAlphaVantageSentiment(item.overall_sentiment_label),
      url: item.url,
      isLive: true,
      relevanceScore: item.relevance_score
    }));
    
    return { success: true, articles };
    
  } catch (error: any) {
    return { success: false, error: `Alpha Vantage error: ${error?.message || 'Unknown error'}` };
  }
}

// Enhanced categorization using Alpha Vantage topics
function categorizeArticleAdvanced(title: string, topics: any[] = []) {
  const titleLower = title.toLowerCase();
  
  // Check topics first
  if (topics?.some(t => t.topic === 'technology' || t.topic === 'blockchain')) {
    return 'Technology';
  }
  if (topics?.some(t => t.topic === 'financial_markets')) {
    return 'Market News';
  }
  
  // Fallback to title analysis
  if (titleLower.includes('regulation') || titleLower.includes('sec') || titleLower.includes('legal')) {
    return 'Regulation';
  }
  if (titleLower.includes('defi') || titleLower.includes('decentralized')) {
    return 'DeFi';
  }
  if (titleLower.includes('institution') || titleLower.includes('bank') || titleLower.includes('corporate')) {
    return 'Institutional';
  }
  if (titleLower.includes('market') || titleLower.includes('price') || titleLower.includes('trading')) {
    return 'Market News';
  }
  if (titleLower.includes('technology') || titleLower.includes('blockchain') || titleLower.includes('protocol')) {
    return 'Technology';
  }
  
  return 'Market News';
}

// Map Alpha Vantage sentiment to our format
function mapAlphaVantageSentiment(sentiment: string): string {
  if (!sentiment) return 'Neutral';
  
  const s = sentiment.toLowerCase();
  if (s.includes('positive') || s.includes('bullish')) return 'Bullish';
  if (s.includes('negative') || s.includes('bearish')) return 'Bearish';
  return 'Neutral';
}

// Quick sentiment analysis without AI
function getSentiment(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('surge') || titleLower.includes('bull') || titleLower.includes('up') || 
      titleLower.includes('gain') || titleLower.includes('rise') || titleLower.includes('pump')) {
    return 'Bullish';
  }
  
  if (titleLower.includes('crash') || titleLower.includes('bear') || titleLower.includes('down') || 
      titleLower.includes('fall') || titleLower.includes('drop') || titleLower.includes('dump')) {
    return 'Bearish';
  }
  
  return 'Neutral';
}

// Quick categorization
function categorizeArticle(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('regulation') || titleLower.includes('sec') || titleLower.includes('legal')) {
    return 'Regulation';
  }
  if (titleLower.includes('market') || titleLower.includes('price') || titleLower.includes('trading')) {
    return 'Market News';
  }
  if (titleLower.includes('technology') || titleLower.includes('blockchain') || titleLower.includes('defi')) {
    return 'Technology';
  }
  
  return 'Market News';
}

// Clean source names
function extractSourceName(sourceName: string): string {
  return sourceName
    .replace(/\.com.*/, '')
    .replace(/\s*-\s*.*/, '')
    .replace(/\s+\w+$/, '')
    .trim() || 'Crypto News';
}

// Fallback news generation with proper category distribution
function generateFallbackNews() {
  const currentTime = new Date().toISOString();
  const fallbackArticles = [
    {
      id: 'fallback-1',
      headline: 'Bitcoin Maintains Strong Position Above Key Support Level',
      summary: 'Technical analysis suggests continued institutional interest as BTC holds key support levels despite market volatility.',
      source: 'CryptoDaily',
      publishedAt: currentTime,
      category: 'Market News',
      sentiment: 'Bullish',
      url: 'https://coindesk.com/markets/2025/08/22/bitcoin-holds-support-levels/',
      isLive: false
    },
    {
      id: 'fallback-2', 
      headline: 'Ethereum Network Upgrade Shows Promising Results',
      summary: 'Latest blockchain metrics indicate improved transaction efficiency following recent network enhancements.',
      source: 'BlockchainNews',
      publishedAt: currentTime,
      category: 'Technology',
      sentiment: 'Neutral',
      url: 'https://cointelegraph.com/news/ethereum-upgrade-metrics',
      isLive: false
    },
    {
      id: 'fallback-3',
      headline: 'Major Banks Announce Crypto Custody Services Expansion',
      summary: 'Leading financial institutions report increased cryptocurrency integration across multiple markets worldwide.',
      source: 'FinanceTech',
      publishedAt: currentTime,
      category: 'Institutional',
      sentiment: 'Bullish',
      url: 'https://decrypt.co/institutions-crypto-adoption',
      isLive: false
    },
    {
      id: 'fallback-4',
      headline: 'DeFi Protocols Report Record Trading Volumes',
      summary: 'Decentralized finance platforms show consistent growth patterns with improved user engagement metrics.',
      source: 'DeFiToday',
      publishedAt: currentTime,
      category: 'DeFi',
      sentiment: 'Neutral',
      url: 'https://theblock.co/defi-trading-volumes',
      isLive: false
    },
    {
      id: 'fallback-5',
      headline: 'New Regulatory Framework Clarifies Crypto Classification',
      summary: 'Cryptocurrency regulation initiatives show positive development across multiple jurisdictions.',
      source: 'RegulatoryWatch',
      publishedAt: currentTime,
      category: 'Regulation',
      sentiment: 'Neutral',
      url: 'https://coindesk.com/policy/crypto-regulation-framework',
      isLive: false
    },
    {
      id: 'fallback-6',
      headline: 'Market Analysis: Crypto Sector Shows Resilience',
      summary: 'Technical indicators suggest continued market strength with balanced trading patterns across major cryptocurrencies.',
      source: 'MarketWatch',
      publishedAt: currentTime,
      category: 'Market News',
      sentiment: 'Neutral',
      url: 'https://coindesk.com/markets/crypto-market-analysis',
      isLive: false
    }
  ];

  return fallbackArticles;
}

// Optimized market ticker data
async function getMarketTicker() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=8&page=1&sparkline=false',
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (!response.ok) {
      return getFallbackTicker();
    }
    
    const data = await response.json();
    return data.map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change: coin.price_change_percentage_24h
    }));
  } catch (error) {
    return getFallbackTicker();
  }
}

function getFallbackTicker() {
  return [
    { symbol: 'BTC', name: 'Bitcoin', price: 110500, change: 2.1 },
    { symbol: 'ETH', name: 'Ethereum', price: 3850, change: -0.8 },
    { symbol: 'SOL', name: 'Solana', price: 245, change: 1.5 },
    { symbol: 'XRP', name: 'XRP', price: 2.80, change: 0.3 },
    { symbol: 'ADA', name: 'Cardano', price: 1.25, change: -1.2 }
  ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🚀 Enhanced Crypto Herald API called');
    
    // Parallel execution for speed
    const [newsResult, marketTicker] = await Promise.allSettled([
      fetchCryptoNews(),
      getMarketTicker()
    ]);

    const newsData = newsResult.status === 'fulfilled' ? newsResult.value : null;
    const tickerData = marketTicker.status === 'fulfilled' ? marketTicker.value : getFallbackTicker();

    let articles: any[];
    let apiStatus: any;
    let isLive = false;

    if (newsData && newsData.articles) {
      // We got live articles from an API
      articles = newsData.articles;
      apiStatus = newsData.apiStatus;
      isLive = true;
      console.log('Using live articles from:', apiStatus.source);
    } else {
      // Using fallback articles
      articles = generateFallbackNews();
      apiStatus = newsData?.apiStatus || {
        source: 'System',
        status: 'Fallback',
        message: 'Using demo data - API keys not configured',
        isRateLimit: false
      };
      console.log('Using fallback articles. Reason:', apiStatus.message);
    }

    const response = {
      success: true,
      data: {
        articles: articles,
        marketTicker: tickerData,
        apiStatus: apiStatus, // Include detailed API status
        meta: {
          totalArticles: articles.length,
          isLiveData: isLive,
          sources: isLive ? [apiStatus.source, 'CoinGecko'] : ['Demo Data', 'CoinGecko'],
          lastUpdated: new Date().toISOString(),
          processingTime: 'Enhanced with API monitoring',
          note: isLive ? `Live feed via ${apiStatus.source}` : apiStatus.message
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Enhanced Crypto Herald Error:', error);
    
    // Even in error, return fallback data with error status
    const fallbackResponse = {
      success: true,
      data: {
        articles: generateFallbackNews(),
        marketTicker: getFallbackTicker(),
        apiStatus: {
          source: 'Error Handler',
          status: 'Error',
          message: 'System error - using fallback data',
          isRateLimit: false
        },
        meta: {
          totalArticles: 6,
          isLiveData: false,
          sources: ['Fallback System'],
          lastUpdated: new Date().toISOString(),
          note: 'System error - using demo articles'
        }
      }
    };

    res.status(200).json(fallbackResponse);
  }
}
