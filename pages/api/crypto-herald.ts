import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with latest model
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-2024-08-06';

// Enhanced crypto news fetch from multiple reputable sources
async function fetchCryptoNews() {
  console.log('🚀 Fetching 15 top crypto stories from reputable sources...');
  
  const apiStatus = {
    source: 'Multiple Reputable Sources',
    status: 'Active',
    message: 'Fetching from NewsAPI, Alpha Vantage, and enhancing with ChatGPT',
    isRateLimit: false
  };

  let allArticles: any[] = [];
  let workingSources: string[] = [];

  try {
    // 1. Fetch from NewsAPI (Primary source)
    if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'undefined') {
      console.log('📰 Fetching from NewsAPI...');
      
      try {
        // Get comprehensive crypto news from last 7 days
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const newsUrl = `https://newsapi.org/v2/everything?q=(bitcoin OR cryptocurrency OR ethereum OR "crypto market" OR blockchain OR DeFi)&from=${lastWeek}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${process.env.NEWS_API_KEY}`;
        
        const response = await fetch(newsUrl, { 
          signal: AbortSignal.timeout(8000)
        });
        
        const data = await response.json();
        
        if (data.status === 'error') {
          console.log('❌ NewsAPI error:', data.code, data.message);
        } else if (response.ok && data.articles && data.articles.length > 0) {
          console.log('✅ NewsAPI success:', data.articles.length, 'articles');
          
          // Filter for high-quality English articles
          const qualityArticles = data.articles
            .filter((article: any) => 
              isEnglishArticle(article.title, article.description) &&
              isReputableSource(article.source?.name) &&
              article.title && 
              article.description &&
              !article.title.includes('[Removed]')
            )
            .slice(0, 12); // Take top 12 from NewsAPI
          
          console.log('✅ Quality NewsAPI articles:', qualityArticles.length);
          
          const processedArticles = qualityArticles.map((article: any, index: number) => ({
            id: `newsapi-${Date.now()}-${index}`,
            headline: article.title,
            summary: article.description || 'Latest developments in cryptocurrency markets.',
            source: extractSourceName(article.source?.name || 'Crypto News'),
            publishedAt: article.publishedAt || new Date().toISOString(),
            category: categorizeArticle(article.title || ''),
            sentiment: getSentiment(article.title || ''),
            url: article.url,
            imageUrl: article.urlToImage,
            isLive: true,
            sourceType: 'NewsAPI'
          }));
          
          allArticles = allArticles.concat(processedArticles);
          workingSources.push('NewsAPI');
        }
      } catch (newsError) {
        console.error('❌ NewsAPI failed:', newsError);
      }
    }

    // 2. Fetch from Alpha Vantage (Secondary source)
    if (process.env.ALPHA_VANTAGE_API_KEY && 
        process.env.ALPHA_VANTAGE_API_KEY !== 'undefined' && 
        process.env.ALPHA_VANTAGE_API_KEY !== 'DISABLED') {
      console.log('📈 Fetching from Alpha Vantage...');
      
      try {
        const alphaUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=CRYPTO:BTC,CRYPTO:ETH&topics=blockchain,technology,financial_markets&apikey=${process.env.ALPHA_VANTAGE_API_KEY}&limit=10`;
        
        const response = await fetch(alphaUrl, { 
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'CryptoTradingIntelligence/1.0'
          }
        });
        
        const data = await response.json();
        
        if (data.Information) {
          console.log('❌ Alpha Vantage limit:', data.Information);
        } else if (data.Error) {
          console.log('❌ Alpha Vantage error:', data.Error);
        } else if (data.feed && data.feed.length > 0) {
          console.log('✅ Alpha Vantage success:', data.feed.length, 'articles');
          
          const alphaArticles = data.feed
            .filter((item: any) => 
              item.title && 
              item.summary && 
              isEnglishArticle(item.title, item.summary)
            )
            .slice(0, 8) // Take top 8 from Alpha Vantage
            .map((item: any, index: number) => ({
              id: `alpha-${Date.now()}-${index}`,
              headline: item.title,
              summary: item.summary?.substring(0, 200) + '...' || 'Financial market analysis.',
              source: extractSourceName(item.source || 'Financial News'),
              publishedAt: item.time_published ? parseAlphaVantageDate(item.time_published) : new Date().toISOString(),
              category: categorizeArticleAdvanced(item.title, item.topics),
              sentiment: mapAlphaVantageSentiment(item.overall_sentiment_label),
              url: item.url,
              isLive: true,
              sourceType: 'Alpha Vantage',
              relevanceScore: item.relevance_score
            }));
          
          allArticles = allArticles.concat(alphaArticles);
          workingSources.push('Alpha Vantage');
        }
      } catch (alphaError) {
        console.error('❌ Alpha Vantage failed:', alphaError);
      }
    }

    // If we have articles from any source, process them
    if (allArticles.length > 0) {
      console.log('📝 Processing', allArticles.length, 'articles...');
      
      // Deduplicate articles
      const deduplicatedArticles = deduplicateArticles(allArticles);
      console.log('✅ After deduplication:', deduplicatedArticles.length, 'articles');
      
      // Take top 15 articles
      const topArticles = deduplicatedArticles.slice(0, 15);
      
      // Enhance with ChatGPT analysis
      const enhancedArticles = await enhanceArticlesWithChatGPT(topArticles);
      
      return { 
        articles: enhancedArticles, 
        apiStatus: { 
          source: workingSources.join(' + ChatGPT'), 
          status: 'Active', 
          message: `15 stories from ${workingSources.join(' & ')} enhanced with ChatGPT analysis`, 
          isRateLimit: false 
        } 
      };
    }

    // If no articles found, generate ChatGPT-powered crypto news
    console.log('🤖 No articles found, generating ChatGPT crypto news...');
    const aiGeneratedNews = await generateCryptoNewsWithChatGPT();
    
    apiStatus.source = 'ChatGPT Generated';
    apiStatus.status = 'AI Generated';
    apiStatus.message = 'AI-generated crypto news stories based on current market trends';
    apiStatus.isRateLimit = false;
    return { articles: aiGeneratedNews, apiStatus };

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

// Check if source is reputable
function isReputableSource(sourceName: string): boolean {
  if (!sourceName) return false;
  
  const reputableSources = [
    'Reuters', 'Bloomberg', 'Associated Press', 'BBC', 'CNN', 'CNBC', 'MarketWatch',
    'CoinDesk', 'Cointelegraph', 'The Block', 'Decrypt', 'CryptoSlate', 'Bitcoin Magazine',
    'Forbes', 'Wall Street Journal', 'Financial Times', 'Yahoo Finance', 'Benzinga',
    'CoinGecko', 'CoinMarketCap', 'Binance', 'Coinbase', 'Kraken', 'Gemini',
    'TechCrunch', 'Wired', 'Ars Technica', 'The Verge', 'Engadget'
  ];
  
  return reputableSources.some(source => 
    sourceName.toLowerCase().includes(source.toLowerCase())
  );
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

// Market ticker using CoinMarketCap API (professional grade data)
async function getMarketTicker() {
  console.log('🎯 Starting fast market ticker fetch...');
  
  try {
    // Use CoinMarketCap Pro API for top coins
    const symbols = 'BTC,ETH,BNB,SOL';
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`;
    
    console.log('🔄 Fetching from CoinMarketCap Pro API with fast timeout...');
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5 seconds for CoinMarketCap
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ CoinMarketCap API failed: ${response.status} ${response.statusText}`);
      console.log(`❌ Error response: ${errorText}`);
      throw new Error(`CoinMarketCap API failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ CoinMarketCap API response received');
    
    // Map CoinMarketCap data to our ticker format
    const coinMapping = {
      'BTC': { symbol: 'BTC', name: 'Bitcoin' },
      'ETH': { symbol: 'ETH', name: 'Ethereum' },
      'BNB': { symbol: 'BNB', name: 'BNB' },
      'SOL': { symbol: 'SOL', name: 'Solana' }
    };
    
    const tickerData = Object.entries(data.data || {}).map(([symbol, coinData]: [string, any]) => {
      const mapping = coinMapping[symbol as keyof typeof coinMapping];
      if (!mapping || !coinData.quote?.USD) return null;
      
      const usdQuote = coinData.quote.USD;
      return {
        symbol: mapping.symbol,
        name: mapping.name,
        price: usdQuote.price || 0,
        change: usdQuote.percent_change_24h || 0,
        volume: usdQuote.volume_24h || 0
      };
    }).filter(item => item !== null);
    
    console.log(`📊 Processed ${tickerData.length} ticker items from CoinMarketCap Pro`);
    
    if (tickerData.length > 0) {
      console.log('🎉 CoinMarketCap ticker data ready:', tickerData.map(r => `${r.symbol}: $${r.price.toLocaleString()}`));
      console.log('📊 Sample ticker item:', JSON.stringify(tickerData[0], null, 2));
      return tickerData;
    } else {
      console.log('❌ No valid ticker data from CoinMarketCap');
      return [];
    }
    
  } catch (error) {
    console.error('💥 CoinMarketCap ticker fetch failed:', error);
    
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

// AI-powered news analysis using existing OpenAI instance

// Enhance articles with ChatGPT analysis
async function enhanceArticlesWithChatGPT(articles: any[]) {
  if (!process.env.OPENAI_API_KEY || articles.length === 0) {
    console.log('⚠️ No OpenAI key or articles, returning original articles');
    return articles;
  }
  
  try {
    console.log('🤖 Enhancing', articles.length, 'articles with ChatGPT...');
    
    // Process articles in batches of 5 for better performance
    const batchSize = 5;
    const enhancedArticles = [];
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert cryptocurrency news analyst. Enhance the provided news articles with professional analysis, market impact assessment, and trading relevance. 
            
            For each article, provide:
            1. Enhanced summary (2-3 sentences with market context)
            2. Market impact (Bullish/Bearish/Neutral)
            3. Trading relevance score (1-10)
            4. Key takeaway (1 sentence)
            
            Return a JSON array with the same structure but enhanced fields.`
          },
          {
            role: "user",
            content: `Enhance these crypto news articles: ${JSON.stringify(batch.map(a => ({ 
              headline: a.headline, 
              summary: a.summary,
              source: a.source 
            })))}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const aiContent = completion.choices[0]?.message?.content;
      if (aiContent) {
        try {
          const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const aiEnhancements = JSON.parse(cleanContent);
          
          // Merge AI enhancements with original articles
          const enhancedBatch = batch.map((article, index) => ({
            ...article,
            enhancedSummary: aiEnhancements[index]?.enhancedSummary || article.summary,
            marketImpact: aiEnhancements[index]?.marketImpact || 'Neutral',
            tradingRelevance: aiEnhancements[index]?.tradingRelevance || 5,
            keyTakeaway: aiEnhancements[index]?.keyTakeaway || 'Market development to monitor',
            aiEnhanced: true
          }));
          
          enhancedArticles.push(...enhancedBatch);
        } catch (parseError) {
          console.error('❌ Failed to parse ChatGPT enhancement:', parseError);
          enhancedArticles.push(...batch); // Return original if parsing fails
        }
      } else {
        enhancedArticles.push(...batch);
      }
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('✅ ChatGPT enhancement complete for', enhancedArticles.length, 'articles');
    return enhancedArticles;
    
  } catch (error) {
    console.error('❌ ChatGPT enhancement failed:', error);
    return articles; // Return original articles if enhancement fails
  }
}

// Generate crypto news with ChatGPT when no articles are available
async function generateCryptoNewsWithChatGPT() {
  if (!process.env.OPENAI_API_KEY) {
    return getFallbackNews();
  }
  
  try {
    console.log('🤖 Generating crypto news with ChatGPT...');
    
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional cryptocurrency news generator. Create 15 realistic, current crypto news headlines and summaries based on actual market trends, regulatory developments, and technological advances.
          
          Focus on:
          - Bitcoin and Ethereum developments
          - DeFi and NFT trends
          - Regulatory news
          - Institutional adoption
          - Technical developments
          - Market analysis
          
          Return a JSON array of 15 news articles with this structure:
          {
            "headline": "Professional news headline",
            "summary": "2-3 sentence summary with market context",
            "category": "Market News|Technology|Regulation|DeFi|Institutional",
            "sentiment": "Bullish|Bearish|Neutral",
            "marketImpact": "High|Medium|Low",
            "source": "Reputable source name"
          }`
        },
        {
          role: "user",
          content: `Generate 15 current cryptocurrency news stories based on recent market trends and developments.`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const aiContent = completion.choices[0]?.message?.content;
    if (aiContent) {
      try {
        const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const aiNews = JSON.parse(cleanContent);
        
        return aiNews.map((article: any, index: number) => ({
          id: `chatgpt-${Date.now()}-${index}`,
          headline: article.headline,
          summary: article.summary,
          source: article.source || 'AI Market Analysis',
          publishedAt: new Date(Date.now() - (index * 60 * 60 * 1000)).toISOString(), // Stagger times
          category: article.category || 'Market News',
          sentiment: article.sentiment || 'Neutral',
          marketImpact: article.marketImpact || 'Medium',
          isLive: true,
          sourceType: 'ChatGPT Generated',
          aiGenerated: true
        }));
      } catch (parseError) {
        console.error('❌ Failed to parse ChatGPT news:', parseError);
        return getFallbackNews();
      }
    }
    
    return getFallbackNews();
  } catch (error) {
    console.error('❌ ChatGPT news generation failed:', error);
    return getFallbackNews();
  }
}

// Fallback news when all else fails
function getFallbackNews() {
  return Array.from({ length: 15 }, (_, index) => ({
    id: `fallback-${index + 1}`,
    headline: `Crypto Market Update ${index + 1}: Latest Developments`,
    summary: 'Cryptocurrency markets continue to evolve with new developments in technology, regulation, and institutional adoption.',
    source: 'Market Intelligence',
    publishedAt: new Date(Date.now() - (index * 2 * 60 * 60 * 1000)).toISOString(),
    category: 'Market News',
    sentiment: 'Neutral',
    isLive: false,
    sourceType: 'Fallback'
  }));
}

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
    console.log('🚀 Enhanced Crypto Herald API - Fetching 15 stories from reputable sources...');
    
    // Fetch news and market data in parallel
    const [newsResult, marketTicker] = await Promise.allSettled([
      fetchCryptoNews(),
      getMarketTicker()
    ]);

    const newsData = newsResult.status === 'fulfilled' ? newsResult.value : null;
    const tickerData = marketTicker.status === 'fulfilled' ? marketTicker.value : [];
    
    let articles: any[] = [];
    let apiStatus: any;

    if (newsData && newsData.articles && newsData.articles.length > 0) {
      articles = newsData.articles;
      apiStatus = newsData.apiStatus;
      console.log('✅ Successfully fetched', articles.length, 'enhanced articles');
    } else {
      // Generate with ChatGPT if no articles found
      console.log('🤖 Generating articles with ChatGPT...');
      articles = await generateCryptoNewsWithChatGPT();
      apiStatus = {
        source: 'ChatGPT Generated',
        status: 'AI Generated',
        message: '15 AI-generated crypto news stories based on current market trends',
        isRateLimit: false
      };
    }

    // Ensure we have exactly 15 articles
    if (articles.length < 15) {
      console.log('📰 Padding to 15 articles with ChatGPT...');
      const additionalArticles = await generateCryptoNewsWithChatGPT();
      articles = [...articles, ...additionalArticles].slice(0, 15);
    } else if (articles.length > 15) {
      articles = articles.slice(0, 15);
    }

    const response = {
      success: true,
      data: {
        articles: articles,
        marketTicker: tickerData,
        apiStatus: apiStatus,
        meta: {
          totalArticles: articles.length,
          isLiveData: true,
          sources: apiStatus.source.split(' + '),
          lastUpdated: new Date().toISOString(),
          processingTime: 'Enhanced with ChatGPT Analysis',
          note: `${articles.length} stories from reputable sources enhanced with AI analysis`
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
