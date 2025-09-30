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
    // Try Alpha Vantage first (usually more reliable) - but skip if disabled
    if (process.env.ALPHA_VANTAGE_API_KEY && 
        process.env.ALPHA_VANTAGE_API_KEY !== 'undefined' && 
        process.env.ALPHA_VANTAGE_API_KEY !== 'DISABLED') {
      console.log('Trying Alpha Vantage API...');
      try {
        const alphaResult = await fetchAlphaVantageNews();
        if (alphaResult.success) {
          console.log('Alpha Vantage success:', alphaResult.articles.length, 'articles');
          allArticles = allArticles.concat(alphaResult.articles);
          workingSources.push('Alpha Vantage');
        } else {
          console.log('Alpha Vantage failed:', alphaResult.error);
          // Don't let Alpha Vantage failures block other sources
        }
      } catch (alphaError) {
        console.log('Alpha Vantage API call failed:', alphaError);
        // Continue to NewsAPI without failing
      }
    } else {
      console.log('Alpha Vantage API disabled or not configured');
    }

    // Try NewsAPI (either as primary or fallback)
    if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'undefined') {
      console.log('Trying NewsAPI...');
      
      // Try broader search (last 10 days for better results) - English only
      const lastTenDays = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const newsUrl = `https://newsapi.org/v2/everything?q=bitcoin+OR+cryptocurrency+OR+crypto&from=${lastTenDays}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${process.env.NEWS_API_KEY}`;
      
      const response = await fetch(newsUrl, { 
        signal: AbortSignal.timeout(4000)
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

// Parse Alpha Vantage date format safely
function parseAlphaVantageDate(timePublished: string): string {
  try {
    // Alpha Vantage format is typically: "20241226T123000" or "20241226T123000Z"
    if (typeof timePublished === 'string' && timePublished.length >= 15) {
      // Extract year, month, day, hour, minute, second
      const year = timePublished.substring(0, 4);
      const month = timePublished.substring(4, 6);
      const day = timePublished.substring(6, 8);
      const hour = timePublished.substring(9, 11);
      const minute = timePublished.substring(11, 13);
      const second = timePublished.substring(13, 15);
      
      // Create ISO format: YYYY-MM-DDTHH:mm:ss.000Z
      const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
      
      // Validate the date
      const date = new Date(isoString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // If parsing fails, try direct parsing as fallback
    const fallbackDate = new Date(timePublished);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate.toISOString();
    }
    
    // If all else fails, return current time
    console.warn('Failed to parse Alpha Vantage date:', timePublished);
    return new Date().toISOString();
    
  } catch (error) {
    console.warn('Error parsing Alpha Vantage date:', timePublished, error);
    return new Date().toISOString();
  }
}

// Alpha Vantage news fetcher
async function fetchAlphaVantageNews() {
  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=CRYPTO:BTC,CRYPTO:ETH&topics=blockchain,technology&apikey=${process.env.ALPHA_VANTAGE_API_KEY}&limit=20`;
    
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'CryptoTradingIntelligence/1.0'
      }
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
      publishedAt: item.time_published ? parseAlphaVantageDate(item.time_published) : new Date().toISOString(),
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

// Market ticker using CoinGecko API (more reliable for global access)
async function getMarketTicker() {
  console.log('🎯 Starting market ticker fetch with CoinGecko...');
  
  try {
    // Use CoinGecko as primary source since Binance is blocked in some regions
    const coinIds = 'bitcoin,ethereum,binancecoin,solana,ripple,cardano,avalanche-2,polkadot';
    const apiKey = process.env.COINGECKO_API_KEY;
    const keyParam = (apiKey && apiKey !== 'CG-YourActualAPIKeyHere') ? `&x_cg_demo_api_key=${apiKey}` : '';
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true${keyParam}`;
    
    console.log('🔄 Fetching from CoinGecko API...');
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AgentsMD/2.0)'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ CoinGecko API failed: ${response.status} ${response.statusText}`);
      console.log(`❌ Error response: ${errorText}`);
      throw new Error(`CoinGecko API failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ CoinGecko API response received');
    
    // Map CoinGecko data to our ticker format
    const coinMapping = {
      'bitcoin': { symbol: 'BTC', name: 'Bitcoin' },
      'ethereum': { symbol: 'ETH', name: 'Ethereum' },
      'binancecoin': { symbol: 'BNB', name: 'BNB' },
      'solana': { symbol: 'SOL', name: 'Solana' },
      'ripple': { symbol: 'XRP', name: 'XRP' },
      'cardano': { symbol: 'ADA', name: 'Cardano' },
      'avalanche-2': { symbol: 'AVAX', name: 'Avalanche' },
      'polkadot': { symbol: 'DOT', name: 'Polkadot' }
    };
    
    const tickerData = Object.entries(data).map(([coinId, coinData]: [string, any]) => {
      const mapping = coinMapping[coinId as keyof typeof coinMapping];
      if (!mapping) return null;
      
      return {
        symbol: mapping.symbol,
        name: mapping.name,
        price: coinData.usd || 0,
        change: coinData.usd_24h_change || 0,
        volume: coinData.usd_24h_vol || 0
      };
    }).filter(item => item !== null);
    
    console.log(`📊 Processed ${tickerData.length} ticker items from CoinGecko`);
    
    if (tickerData.length > 0) {
      console.log('🎉 CoinGecko ticker data ready:', tickerData.map(r => `${r.symbol}: $${r.price.toLocaleString()}`));
      console.log('📊 Sample ticker item:', JSON.stringify(tickerData[0], null, 2));
      return tickerData;
    } else {
      console.log('❌ No valid ticker data from CoinGecko');
      return [];
    }
    
  } catch (error) {
    console.error('💥 CoinGecko ticker fetch failed:', error);
    
    // Fallback: Try a simple price API as last resort
    try {
      console.log('🔄 Trying fallback price API...');
      
      const fallbackData = [
        { symbol: 'BTC', name: 'Bitcoin', price: 67500, change: 2.5 },
        { symbol: 'ETH', name: 'Ethereum', price: 2650, change: 1.8 },
        { symbol: 'BNB', name: 'BNB', price: 315, change: -0.5 },
        { symbol: 'SOL', name: 'Solana', price: 145, change: 3.2 }
      ];
      
      // Try to get at least BTC price from a simple endpoint
      try {
        const btcResponse = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC', {
          signal: AbortSignal.timeout(5000)
        });
        
        if (btcResponse.ok) {
          const btcData = await btcResponse.json();
          const btcPrice = parseFloat(btcData.data.rates.USD);
          if (btcPrice > 0) {
            fallbackData[0].price = btcPrice;
            console.log('✅ Got live BTC price from Coinbase:', btcPrice);
          }
        }
      } catch (coinbaseError) {
        console.log('⚠️ Coinbase fallback also failed');
      }
      
      console.log('📊 Using fallback ticker data');
      return fallbackData;
      
    } catch (fallbackError) {
      console.error('💥 All ticker sources failed:', fallbackError);
      return [];
    }
  }
}

// Initialize OpenAI for AI-powered news analysis
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-2024-08-06';

// AI-powered news analysis and summarization
async function generateAINewsSummary(articles: any[]) {
  if (!process.env.OPENAI_API_KEY || !articles.length) return articles;
  
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert cryptocurrency news analyst. Analyze the provided news articles and generate concise, insightful summaries that highlight:
          1. Market impact and implications
          2. Key technical or fundamental insights
          3. Trading relevance
          4. Sentiment (Bullish/Bearish/Neutral)
          
          For each article, provide a 1-2 sentence AI summary that adds analytical value beyond the original headline.
          Return a JSON array with the same structure but enhanced with "aiSummary" and "sentiment" fields.`
        },
        {
          role: "user",
          content: `Analyze these crypto news articles: ${JSON.stringify(articles.slice(0, 5).map(a => ({ title: a.headline, description: a.summary })))}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const aiContent = completion.choices[0]?.message?.content;
    if (aiContent) {
      try {
        // Clean the AI response - remove markdown code blocks if present
        const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const aiAnalysis = JSON.parse(cleanContent);
        
        return articles.map((article, index) => ({
          ...article,
          aiSummary: aiAnalysis[index]?.aiSummary || null,
          sentiment: aiAnalysis[index]?.sentiment || article.sentiment
        }));
      } catch (parseError) {
        console.error('Failed to parse AI news analysis:', parseError);
        console.error('Raw AI content:', aiContent);
        // Return articles without AI enhancement if parsing fails
        return articles;
      }
    }
  } catch (error) {
    console.error('AI news analysis failed:', error);
  }
  
  return articles;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🚀 AI-Enhanced Crypto Herald API called');
    
    // Parallel execution for speed
    const [newsResult, marketTicker] = await Promise.allSettled([
      fetchCryptoNews(),
      getMarketTicker()
    ]);

    const newsData = newsResult.status === 'fulfilled' ? newsResult.value : null;
    const tickerData = marketTicker.status === 'fulfilled' ? marketTicker.value : [];
    
    // Debug ticker data
    console.log('🎯 Ticker fetch status:', marketTicker.status);
    console.log('🎯 Ticker data length:', tickerData?.length || 0);
    console.log('🎯 Ticker data sample:', tickerData?.slice(0, 2));
    
    if (tickerData && tickerData.length > 0) {
      console.log('✅ Ticker data is available and will be included in response');
      console.log('📊 First ticker item:', JSON.stringify(tickerData[0], null, 2));
    } else {
      console.log('❌ No ticker data available - ticker will not display');
    }

    let articles: any[];
    let apiStatus: any;
    let isLive = false;

    if (newsData && newsData.articles) {
      // We got live articles from an API
      articles = newsData.articles;
      apiStatus = newsData.apiStatus;
      isLive = true;
      
      // Enhance articles with AI analysis if enabled
      if (process.env.USE_REAL_AI_ANALYSIS === 'true') {
        console.log('🤖 Generating AI summaries for', articles.length, 'articles');
        articles = await generateAINewsSummary(articles);
      }
      
      console.log('Using live articles from:', apiStatus.source);
    } else {
      // No articles but still provide market ticker
      articles = [];
      apiStatus = newsData?.apiStatus || {
        source: 'Market Data',
        status: 'Partial',
        message: 'News APIs unavailable - showing market ticker data only',
        isRateLimit: false
      };
      console.log('No articles available. Reason:', apiStatus.message);
    }

    const response = {
      success: true,
      data: {
        articles: articles,
        marketTicker: tickerData,
        apiStatus: apiStatus,
        meta: {
          totalArticles: articles.length,
          isLiveData: isLive,
          sources: isLive ? [apiStatus.source, 'CoinGecko'] : ['Market Data Only'],
          lastUpdated: new Date().toISOString(),
          processingTime: 'AI-Enhanced Processing',
          note: isLive ? `Live feed via ${apiStatus.source} with AI analysis` : 'Market ticker available - news APIs unavailable',
          aiModel: process.env.USE_REAL_AI_ANALYSIS === 'true' ? OPENAI_MODEL : null
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Enhanced Crypto Herald Error:', error);
    
    // Try to get live ticker data even if news fails
    let liveTickerData = [];
    try {
      liveTickerData = await getMarketTicker();
    } catch (tickerError) {
      console.error('Ticker fetch also failed:', tickerError);
    }
    
    const errorResponse = {
      success: false,
      data: {
        articles: [],
        marketTicker: liveTickerData,
        apiStatus: {
          source: 'Error Handler',
          status: 'Error',
          message: 'System error - showing fallback market data',
          isRateLimit: false
        },
        meta: {
          totalArticles: 0,
          isLiveData: false,
          sources: ['Fallback System'],
          lastUpdated: new Date().toISOString(),
          note: 'System error - fallback market ticker active'
        }
      }
    };

    res.status(500).json(errorResponse);
  }
}
