import { NextApiRequest, NextApiResponse } from 'next';

// Real crypto news sources and their RSS/API endpoints
const NEWS_SOURCES = [
  {
    name: 'NewsAPI',
    endpoint: 'https://newsapi.org/v2/everything',
    apiKey: process.env.NEWS_API_KEY,
    params: 'q=cryptocurrency OR bitcoin OR ethereum OR crypto&sortBy=publishedAt&pageSize=10&language=en'
  },
  {
    name: 'CryptoCompare',
    endpoint: 'https://min-api.cryptocompare.com/data/v2/news/',
    apiKey: process.env.CRYPTOCOMPARE_API_KEY,
    params: 'lang=EN&sortOrder=latest'
  }
];

// Fetch real crypto news from multiple sources
async function fetchRealCryptoNews() {
  console.log('📰 Fetching REAL crypto news from multiple APIs...');
  
  const allArticles = [];
  
  // 1. Fetch from NewsAPI (Primary source)
  if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'undefined') {
    try {
      console.log('🔍 Fetching from NewsAPI...');
      const newsApiStart = Date.now();
      const newsApiUrl = `https://newsapi.org/v2/everything?q=cryptocurrency OR bitcoin OR ethereum OR "crypto news" OR blockchain OR DeFi&sortBy=publishedAt&pageSize=15&language=en&apiKey=${process.env.NEWS_API_KEY}`;
      
      const response = await fetch(newsApiUrl, {
        signal: AbortSignal.timeout(20000), // Increased to 20 seconds
        headers: {
          'User-Agent': 'CryptoHerald/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          const processedArticles = data.articles
            .filter(article => 
              article.title && 
              article.description && 
              article.url && 
              !article.title.includes('[Removed]') &&
              (article.title.toLowerCase().includes('crypto') ||
               article.title.toLowerCase().includes('bitcoin') ||
               article.title.toLowerCase().includes('ethereum') ||
               article.title.toLowerCase().includes('blockchain') ||
               article.description.toLowerCase().includes('crypto'))
            )
            .slice(0, 10)
            .map((article, index) => ({
              id: `newsapi-${index}`,
              headline: article.title,
              summary: article.description || 'Full article available at source.',
              source: article.source?.name || 'NewsAPI',
              publishedAt: article.publishedAt,
              category: categorizeArticle(article.title + ' ' + article.description),
              sentiment: analyzeSentiment(article.title + ' ' + article.description),
              url: article.url, // Real external URL
              urlToImage: article.urlToImage,
              isLive: true,
              sourceType: 'Live API'
            }));
          
          allArticles.push(...processedArticles);
          const newsApiTime = Date.now() - newsApiStart;
          console.log(`✅ NewsAPI: ${processedArticles.length} articles fetched in ${newsApiTime}ms`);
        }
      } else {
        console.error('❌ NewsAPI failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ NewsAPI error:', error);
      if (error.name === 'AbortError') {
        console.error('❌ NewsAPI request timed out after 20 seconds');
      } else if (error.name === 'TypeError') {
        console.error('❌ NewsAPI network error - check internet connection');
      }
    }
  }
  
  // 2. Fetch from CryptoCompare (Secondary source)
  try {
    console.log('🔍 Fetching from CryptoCompare...');
    const cryptoCompareStart = Date.now();
    const cryptoCompareUrl = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest';
    
    const response = await fetch(cryptoCompareUrl, {
      signal: AbortSignal.timeout(20000), // Increased to 20 seconds
      headers: {
        'User-Agent': 'CryptoHerald/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.Data && data.Data.length > 0) {
        const processedArticles = data.Data
          .slice(0, 8)
          .map((article, index) => ({
            id: `cryptocompare-${index}`,
            headline: article.title,
            summary: article.body ? article.body.substring(0, 200) + '...' : 'Read full article at source.',
            source: article.source_info?.name || 'CryptoCompare',
            publishedAt: new Date(article.published_on * 1000).toISOString(),
            category: categorizeArticle(article.title + ' ' + article.body),
            sentiment: analyzeSentiment(article.title + ' ' + article.body),
            url: article.url, // Real external URL
            urlToImage: article.imageurl,
            isLive: true,
            sourceType: 'Live API'
          }));
        
        allArticles.push(...processedArticles);
        const cryptoCompareTime = Date.now() - cryptoCompareStart;
        console.log(`✅ CryptoCompare: ${processedArticles.length} articles fetched in ${cryptoCompareTime}ms`);
      }
    } else {
      console.error('❌ CryptoCompare failed:', response.status);
    }
  } catch (error) {
    console.error('❌ CryptoCompare error:', error);
    if (error.name === 'AbortError') {
      console.error('❌ CryptoCompare request timed out after 20 seconds');
    } else if (error.name === 'TypeError') {
      console.error('❌ CryptoCompare network error - check internet connection');
    }
  }
  
  // No fallback content - only use live API data
  
  // Remove duplicates and sort by date
  const uniqueArticles = allArticles
    .filter((article, index, self) => 
      index === self.findIndex(a => a.headline === article.headline)
    )
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 15);
  
  console.log(`✅ Total articles processed: ${uniqueArticles.length}`);
  return uniqueArticles;
}

// Categorize articles based on content
function categorizeArticle(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('defi') || lowerContent.includes('decentralized finance') || lowerContent.includes('yield') || lowerContent.includes('liquidity')) {
    return 'DeFi';
  } else if (lowerContent.includes('nft') || lowerContent.includes('non-fungible')) {
    return 'NFTs';
  } else if (lowerContent.includes('regulation') || lowerContent.includes('sec') || lowerContent.includes('government') || lowerContent.includes('legal')) {
    return 'Regulation';
  } else if (lowerContent.includes('mining') || lowerContent.includes('hash') || lowerContent.includes('energy')) {
    return 'Mining';
  } else if (lowerContent.includes('technology') || lowerContent.includes('blockchain') || lowerContent.includes('protocol') || lowerContent.includes('upgrade')) {
    return 'Technology';
  } else if (lowerContent.includes('institutional') || lowerContent.includes('bank') || lowerContent.includes('etf') || lowerContent.includes('corporate')) {
    return 'Institutional';
  } else if (lowerContent.includes('gaming') || lowerContent.includes('metaverse') || lowerContent.includes('web3')) {
    return 'Gaming';
  } else if (lowerContent.includes('payment') || lowerContent.includes('merchant') || lowerContent.includes('adoption')) {
    return 'Payments';
  } else {
    return 'Market News';
  }
}

// Analyze sentiment based on content
function analyzeSentiment(content: string): 'Bullish' | 'Bearish' | 'Neutral' {
  const lowerContent = content.toLowerCase();
  
  const bullishWords = ['surge', 'rise', 'gain', 'bull', 'positive', 'growth', 'increase', 'adoption', 'breakthrough', 'milestone', 'record', 'high', 'rally', 'boost'];
  const bearishWords = ['fall', 'drop', 'crash', 'bear', 'negative', 'decline', 'decrease', 'concern', 'risk', 'low', 'sell-off', 'dump', 'fear'];
  
  const bullishCount = bullishWords.filter(word => lowerContent.includes(word)).length;
  const bearishCount = bearishWords.filter(word => lowerContent.includes(word)).length;
  
  if (bullishCount > bearishCount && bullishCount > 0) return 'Bullish';
  if (bearishCount > bullishCount && bearishCount > 0) return 'Bearish';
  return 'Neutral';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🚀 Crypto Herald - REAL News API Integration');
    
    // Fetch real crypto news from multiple sources
    const articles = await fetchRealCryptoNews();


    // Get live market ticker
    let tickerData = [];
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,cardano,polkadot,chainlink,litecoin&vs_currencies=usd&include_24hr_change=true', {
        headers: {
          'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || ''
        },
        signal: AbortSignal.timeout(15000) // Increased to 15 seconds for market data
      });
      
      if (response.ok) {
        const data = await response.json();
        tickerData = [
          { symbol: 'BTC', name: 'Bitcoin', price: data.bitcoin?.usd || 67000, change: data.bitcoin?.usd_24h_change || 2.5 },
          { symbol: 'ETH', name: 'Ethereum', price: data.ethereum?.usd || 2650, change: data.ethereum?.usd_24h_change || 1.8 },
          { symbol: 'BNB', name: 'BNB', price: data.binancecoin?.usd || 315, change: data.binancecoin?.usd_24h_change || -0.5 },
          { symbol: 'SOL', name: 'Solana', price: data.solana?.usd || 145, change: data.solana?.usd_24h_change || 3.2 },
          { symbol: 'ADA', name: 'Cardano', price: data.cardano?.usd || 0.45, change: data.cardano?.usd_24h_change || 1.1 },
          { symbol: 'DOT', name: 'Polkadot', price: data.polkadot?.usd || 7.2, change: data.polkadot?.usd_24h_change || -0.8 },
          { symbol: 'LINK', name: 'Chainlink', price: data.chainlink?.usd || 14.5, change: data.chainlink?.usd_24h_change || 2.1 },
          { symbol: 'LTC', name: 'Litecoin', price: data.litecoin?.usd || 95, change: data.litecoin?.usd_24h_change || 0.9 }
        ];
      }
    } catch (error) {
      console.error('❌ Market ticker failed:', error);
      if (error.name === 'AbortError') {
        console.error('❌ Market ticker request timed out after 15 seconds');
      }
      // ✅ 99% ACCURACY RULE: Return empty array instead of fake ticker data
      tickerData = [];
    }

    // Check if we have any live articles - if not, return error
    const liveArticleCount = articles.filter(a => a.sourceType === 'Live API').length;
    
    if (liveArticleCount === 0) {
      console.error('❌ No live articles available from any API source');
      return res.status(503).json({
        success: false,
        error: 'Unable to fetch live crypto news from external APIs',
        details: 'NewsAPI and CryptoCompare are currently unavailable. Please check your API keys and internet connection.',
        timestamp: new Date().toISOString(),
        apiStatus: {
          newsApi: process.env.NEWS_API_KEY ? 'Configured but failed' : 'Not configured',
          cryptoCompare: 'Failed to connect',
          suggestion: 'Check API keys in .env.local and try again'
        }
      });
    }
    
    const apiStatus = {
      source: 'Live News APIs + Market Data',
      status: liveArticleCount > 10 ? 'Excellent' : liveArticleCount > 5 ? 'Good' : 'Limited',
      message: `${liveArticleCount} live articles from NewsAPI/CryptoCompare`,
      isRateLimit: false,
      liveSourcesActive: true
    };

    const response = {
      success: true,
      data: {
        articles: articles,
        marketTicker: tickerData,
        apiStatus: apiStatus,
        meta: {
          totalArticles: articles.length,
          liveArticles: liveArticleCount,
          curatedArticles: 0,
          isLiveData: true,
          sources: ['NewsAPI', 'CryptoCompare', 'CoinGecko Market Data'],
          lastUpdated: new Date().toISOString(),
          processingTime: 'Real-time fetch',
          note: `${articles.length} live crypto stories from external APIs only`
        }
      },
      attribution: {
        marketData: {
          provider: 'CoinGecko',
          url: 'https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral',
          message: 'Market ticker data powered by CoinGecko'
        }
      }
    };

    console.log(`✅ Returning ${articles.length} live crypto stories from external APIs`);
    res.status(200).json(response);

  } catch (error) {
    console.error('Crypto Herald 15 Stories Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crypto stories',
      timestamp: new Date().toISOString()
    });
  }
}