import { NextApiRequest, NextApiResponse } from 'next';

// Fast crypto news fetch - optimized for speed
async function fetchFastCryptoNews() {
  try {
    // Get last 24 hours only for faster processing
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Single optimized NewsAPI call instead of multiple
    const newsUrl = `https://newsapi.org/v2/everything?q=bitcoin+OR+ethereum+OR+cryptocurrency&from=${yesterday}&sortBy=publishedAt&pageSize=15&apiKey=${process.env.NEWS_API_KEY}`;
    
    if (newsUrl.includes('undefined')) {
      return null;
    }

    const response = await fetch(newsUrl, { 
      signal: AbortSignal.timeout(8000)  // 8 second timeout
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
      return null;
    }

    // Quick processing - no AI summaries for speed
    const processedArticles = data.articles.slice(0, 12).map((article: any, index: number) => ({
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

    return processedArticles;

  } catch (error) {
    console.log('Fast news fetch failed:', error);
    return null;
  }
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

// Fast fallback news generation
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
      isLive: false
    },
    {
      id: 'fallback-3',
      headline: 'Institutional Crypto Adoption Continues Global Expansion',
      summary: 'Major financial institutions report increased cryptocurrency integration across multiple markets worldwide.',
      source: 'FinanceTech',
      publishedAt: currentTime,
      category: 'Institutional',
      sentiment: 'Bullish',
      isLive: false
    },
    {
      id: 'fallback-4',
      headline: 'DeFi Protocols Report Strong Trading Volumes',
      summary: 'Decentralized finance platforms show consistent growth patterns with improved user engagement metrics.',
      source: 'DeFiToday',
      publishedAt: currentTime,
      category: 'DeFi',
      sentiment: 'Neutral',
      isLive: false
    },
    {
      id: 'fallback-5',
      headline: 'Regulatory Framework Development Progresses Globally',
      summary: 'Cryptocurrency regulation initiatives show positive development across multiple jurisdictions.',
      source: 'RegulatoryWatch',
      publishedAt: currentTime,
      category: 'Regulation',
      sentiment: 'Neutral',
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
    console.log('🚀 Fast Crypto Herald API called');
    
    // Parallel execution for speed
    const [liveNews, marketTicker] = await Promise.allSettled([
      fetchFastCryptoNews(),
      getMarketTicker()
    ]);

    const newsData = liveNews.status === 'fulfilled' ? liveNews.value : null;
    const tickerData = marketTicker.status === 'fulfilled' ? marketTicker.value : getFallbackTicker();

    // Use live news if available, otherwise fallback
    const articles = newsData || generateFallbackNews();
    const isLive = newsData !== null;

    const response = {
      success: true,
      data: {
        articles: articles,
        marketTicker: tickerData,
        meta: {
          totalArticles: articles.length,
          isLiveData: isLive,
          sources: isLive ? ['NewsAPI', 'CoinGecko'] : ['Demo Data'],
          lastUpdated: new Date().toISOString(),
          processingTime: 'Optimized for speed',
          note: isLive ? 'Live cryptocurrency news' : 'Demo articles - Add API keys for live feeds'
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Fast Crypto Herald Error:', error);
    
    // Even in error, return fallback data
    const fallbackResponse = {
      success: true,
      data: {
        articles: generateFallbackNews(),
        marketTicker: getFallbackTicker(),
        meta: {
          totalArticles: 6,
          isLiveData: false,
          sources: ['Demo Data'],
          lastUpdated: new Date().toISOString(),
          note: 'Fallback mode - Add API keys for live data'
        }
      }
    };

    res.status(200).json(fallbackResponse);
  }
}
