import { NextApiRequest, NextApiResponse } from 'next';
import { extractResponseText, validateResponseText } from '../../utils/openai';
import OpenAI from 'openai';

// Initialize OpenAI with GPT-5.1
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'responses=v1'
  }
});

// Enhanced Bitcoin Article Interface
interface EnrichedBitcoinArticle {
  id: string;
  headline: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
  
  // Social Metrics (from LunarCrush)
  socialMetrics: {
    mentions: number;
    engagement: number;
    sentiment: number; // -1 to 1
    socialScore: number; // 0-100
    influencerScore: number;
  };
  
  // Market Impact (from GPT-5.1)
  marketImpact: {
    score: number; // 1-10
    direction: 'Bullish' | 'Bearish' | 'Neutral';
    confidence: number; // 0-100
    timeframe: 'Short' | 'Medium' | 'Long';
  };
  
  // Relevance
  relevanceScore: number; // 0-100
  category: string;
  tags: string[];
  
  // AI Analysis (GPT-5.1)
  aiAnalysis: {
    keyTakeaway: string;
    tradingSignal: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    actionableInsight: string;
  };
  
  // Source Quality
  sourceReliability: number; // 0-100
  isVerified: boolean;
}

/**
 * Fetch Bitcoin news from LunarCrush Topic Posts API
 * This provides social metrics and engagement data
 */
async function fetchLunarCrushBitcoinNews(): Promise<any[]> {
  if (!process.env.LUNARCRUSH_API_KEY) {
    console.log('⚠️ LunarCrush API key not configured');
    return [];
  }

  try {
    console.log('🌙 Fetching Bitcoin news from LunarCrush...');
    
    // Use LunarCrush Topic Posts endpoint for Bitcoin
    const response = await fetch('https://lunarcrush.com/api4/public/topic/bitcoin/posts/1d', {
      headers: {
        'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error('❌ LunarCrush API failed:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.log('⚠️ No posts data from LunarCrush');
      return [];
    }

    console.log(`✅ LunarCrush: ${data.data.length} Bitcoin posts fetched`);
    
    // Transform LunarCrush posts to our format
    const articles = data.data
      .filter((post: any) => post.url && post.title) // Only posts with URLs and titles
      .slice(0, 15) // Top 15 most engaging posts
      .map((post: any, index: number) => ({
        id: `lunarcrush-${post.id || index}`,
        headline: post.title || 'Bitcoin Market Update',
        summary: post.body?.substring(0, 200) + '...' || 'Latest Bitcoin developments',
        url: post.url,
        publishedAt: new Date(post.time * 1000).toISOString(),
        source: post.creator_name || 'LunarCrush',
        imageUrl: post.thumbnail,
        
        // Social metrics from LunarCrush
        socialMetrics: {
          mentions: post.interactions_24h || 0,
          engagement: post.interactions || 0,
          sentiment: calculateSentiment(post.sentiment || 0),
          socialScore: Math.min(100, Math.round((post.interactions || 0) / 10)),
          influencerScore: post.creator_followers ? Math.min(100, Math.round(post.creator_followers / 1000)) : 0
        },
        
        // Initial relevance score based on engagement
        relevanceScore: calculateRelevanceScore(post),
        category: categorizeBitcoinPost(post.title || ''),
        tags: extractTags(post.title || '', post.body || ''),
        
        // Source reliability based on creator metrics
        sourceReliability: calculateSourceReliability(post),
        isVerified: post.creator_verified || false,
        
        sourceType: 'LunarCrush'
      }));

    return articles;
  } catch (error) {
    console.error('❌ LunarCrush fetch error:', error);
    return [];
  }
}

/**
 * Fetch Bitcoin news from NewsAPI (filtered for Bitcoin)
 */
async function fetchNewsAPIBitcoin(): Promise<any[]> {
  if (!process.env.NEWS_API_KEY) {
    console.log('⚠️ NewsAPI key not configured');
    return [];
  }

  try {
    console.log('📰 Fetching Bitcoin news from NewsAPI...');
    
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newsUrl = `https://newsapi.org/v2/everything?q=bitcoin&from=${lastWeek}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    
    const response = await fetch(newsUrl, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error('❌ NewsAPI failed:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
      console.log('⚠️ No articles from NewsAPI');
      return [];
    }

    console.log(`✅ NewsAPI: ${data.articles.length} Bitcoin articles fetched`);
    
    // Filter and transform NewsAPI articles
    const articles = data.articles
      .filter((article: any) => 
        article.title &&
        article.description &&
        !article.title.includes('[Removed]') &&
        isBitcoinRelevant(article.title, article.description)
      )
      .slice(0, 10)
      .map((article: any, index: number) => ({
        id: `newsapi-${Date.now()}-${index}`,
        headline: article.title,
        summary: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source?.name || 'NewsAPI',
        imageUrl: article.urlToImage,
        
        // Default social metrics (will be enhanced by GPT-5.1)
        socialMetrics: {
          mentions: 0,
          engagement: 0,
          sentiment: 0,
          socialScore: 0,
          influencerScore: 0
        },
        
        relevanceScore: calculateNewsAPIRelevance(article),
        category: categorizeBitcoinPost(article.title),
        tags: extractTags(article.title, article.description),
        
        sourceReliability: isReputableSource(article.source?.name) ? 85 : 60,
        isVerified: isReputableSource(article.source?.name),
        
        sourceType: 'NewsAPI'
      }));

    return articles;
  } catch (error) {
    console.error('❌ NewsAPI fetch error:', error);
    return [];
  }
}

/**
 * Enhance articles with GPT-5.1 analysis
 * This is the LAST step after all data is fetched
 */
async function enhanceWithGPT51(articles: any[]): Promise<EnrichedBitcoinArticle[]> {
  if (!process.env.OPENAI_API_KEY || articles.length === 0) {
    console.log('⚠️ Cannot enhance articles - no OpenAI key or no articles');
    return articles;
  }

  try {
    console.log(`🤖 Enhancing ${articles.length} articles with GPT-5.1...`);
    
    // Process in batches of 5 for optimal performance
    const batchSize = 5;
    const enhancedArticles: EnrichedBitcoinArticle[] = [];
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-5.1',
        messages: [
          {
            role: 'system',
            content: `You are an expert Bitcoin market analyst. Analyze the provided Bitcoin news articles and provide comprehensive market intelligence.

For each article, provide:
1. Market Impact Score (1-10): How significantly this news affects Bitcoin price
2. Direction (Bullish/Bearish/Neutral): Market sentiment direction
3. Confidence (0-100): How confident you are in this assessment
4. Timeframe (Short/Medium/Long): Expected impact duration
5. Key Takeaway: One sentence summarizing the most important point
6. Trading Signal: Specific actionable insight for traders
7. Risk Level (Low/Medium/High): Associated risk level
8. Actionable Insight: What traders should do based on this news

Return a JSON array with this exact structure:
[{
  "marketImpact": {
    "score": number,
    "direction": "Bullish" | "Bearish" | "Neutral",
    "confidence": number,
    "timeframe": "Short" | "Medium" | "Long"
  },
  "aiAnalysis": {
    "keyTakeaway": string,
    "tradingSignal": string,
    "riskLevel": "Low" | "Medium" | "High",
    "actionableInsight": string
  }
}]`
          },
          {
            role: 'user',
            content: `Analyze these Bitcoin news articles:\n\n${JSON.stringify(batch.map(a => ({
              headline: a.headline,
              summary: a.summary,
              source: a.source,
              socialMetrics: a.socialMetrics
            })))}`
          }
        ],
        reasoning: {
          effort: 'medium' // 3-5 seconds for quality analysis
        },
        temperature: 0.7,
        max_tokens: 4000
      });

      // Bulletproof extraction
      const responseText = extractResponseText(completion, true);
      validateResponseText(responseText, 'gpt-5.1', completion);
      
      try {
        const aiEnhancements = JSON.parse(responseText);
        
        // Merge AI enhancements with original articles
        const enhancedBatch = batch.map((article, index) => ({
          ...article,
          marketImpact: aiEnhancements[index]?.marketImpact || {
            score: 5,
            direction: 'Neutral',
            confidence: 50,
            timeframe: 'Medium'
          },
          aiAnalysis: aiEnhancements[index]?.aiAnalysis || {
            keyTakeaway: 'Market development to monitor',
            tradingSignal: 'Wait for confirmation',
            riskLevel: 'Medium',
            actionableInsight: 'Monitor price action for entry signals'
          }
        }));
        
        enhancedArticles.push(...enhancedBatch);
      } catch (parseError) {
        console.error('❌ Failed to parse GPT-5.1 response:', parseError);
        // Return original articles if parsing fails
        enhancedArticles.push(...batch);
      }
      
      // Small delay between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ GPT-5.1 enhancement complete for ${enhancedArticles.length} articles`);
    return enhancedArticles;
    
  } catch (error) {
    console.error('❌ GPT-5.1 enhancement failed:', error);
    return articles; // Return original articles if enhancement fails
  }
}

/**
 * Helper Functions
 */

function calculateSentiment(lunarcrushSentiment: number): number {
  // LunarCrush sentiment is typically 0-5, convert to -1 to 1
  return (lunarcrushSentiment - 2.5) / 2.5;
}

function calculateRelevanceScore(post: any): number {
  let score = 50; // Base score
  
  // Boost for high engagement
  if (post.interactions > 1000) score += 20;
  else if (post.interactions > 500) score += 10;
  
  // Boost for verified creators
  if (post.creator_verified) score += 15;
  
  // Boost for high follower count
  if (post.creator_followers > 10000) score += 10;
  
  // Boost for recent posts
  const hoursSincePost = (Date.now() - post.time * 1000) / (1000 * 60 * 60);
  if (hoursSincePost < 6) score += 10;
  
  return Math.min(100, score);
}

function calculateSourceReliability(post: any): number {
  let score = 50; // Base score
  
  if (post.creator_verified) score += 30;
  if (post.creator_followers > 10000) score += 10;
  if (post.creator_followers > 100000) score += 10;
  
  return Math.min(100, score);
}

function calculateNewsAPIRelevance(article: any): number {
  let score = 60; // Base score for NewsAPI
  
  const title = article.title.toLowerCase();
  const desc = (article.description || '').toLowerCase();
  
  // Boost for Bitcoin-specific content
  if (title.includes('bitcoin') || title.includes('btc')) score += 20;
  
  // Boost for price/market mentions
  if (title.includes('price') || title.includes('market')) score += 10;
  
  // Boost for reputable sources
  if (isReputableSource(article.source?.name)) score += 10;
  
  return Math.min(100, score);
}

function isBitcoinRelevant(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return text.includes('bitcoin') || text.includes('btc');
}

function isReputableSource(sourceName: string): boolean {
  if (!sourceName) return false;
  
  const reputableSources = [
    'Reuters', 'Bloomberg', 'Associated Press', 'BBC', 'CNBC', 'MarketWatch',
    'CoinDesk', 'Cointelegraph', 'The Block', 'Decrypt', 'Bitcoin Magazine',
    'Forbes', 'Wall Street Journal', 'Financial Times', 'Yahoo Finance'
  ];
  
  return reputableSources.some(source => 
    sourceName.toLowerCase().includes(source.toLowerCase())
  );
}

function categorizeBitcoinPost(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('regulation') || titleLower.includes('sec') || titleLower.includes('legal')) {
    return 'Regulation';
  }
  if (titleLower.includes('institution') || titleLower.includes('etf') || titleLower.includes('corporate')) {
    return 'Institutional';
  }
  if (titleLower.includes('mining') || titleLower.includes('hash')) {
    return 'Mining';
  }
  if (titleLower.includes('technology') || titleLower.includes('protocol') || titleLower.includes('upgrade')) {
    return 'Technology';
  }
  if (titleLower.includes('price') || titleLower.includes('market') || titleLower.includes('trading')) {
    return 'Market News';
  }
  
  return 'Market News';
}

function extractTags(title: string, body: string): string[] {
  const text = `${title} ${body}`.toLowerCase();
  const tags: string[] = [];
  
  const tagKeywords = {
    'price': ['price', 'rally', 'surge', 'drop', 'crash'],
    'adoption': ['adoption', 'mainstream', 'acceptance'],
    'regulation': ['regulation', 'sec', 'legal', 'government'],
    'institutional': ['institutional', 'etf', 'corporate', 'bank'],
    'mining': ['mining', 'hash', 'difficulty', 'miners'],
    'technology': ['technology', 'protocol', 'upgrade', 'development'],
    'trading': ['trading', 'volume', 'liquidity', 'exchange']
  };
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  }
  
  return tags.slice(0, 5); // Max 5 tags
}

/**
 * Main API Handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🚀 Bitcoin News Wire - Enhanced with LunarCrush & GPT-5.1');
    
    // Phase 1: Fetch from LunarCrush (Primary source with social metrics)
    const lunarcrushArticles = await fetchLunarCrushBitcoinNews();
    
    // Phase 2: Fetch from NewsAPI (Secondary source)
    const newsapiArticles = await fetchNewsAPIBitcoin();
    
    // Phase 3: Combine and deduplicate
    const allArticles = [...lunarcrushArticles, ...newsapiArticles];
    const uniqueArticles = deduplicateArticles(allArticles);
    
    // Sort by relevance score
    const sortedArticles = uniqueArticles
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15); // Top 15 most relevant
    
    console.log(`📊 Total unique articles: ${sortedArticles.length}`);
    
    // Phase 4: Enhance with GPT-5.1 (LAST STEP - following UCIE rules)
    const enhancedArticles = await enhanceWithGPT51(sortedArticles);
    
    // Get market ticker
    const marketTicker = await getMarketTicker();
    
    const response = {
      success: true,
      data: {
        articles: enhancedArticles,
        marketTicker: marketTicker,
        apiStatus: {
          source: 'LunarCrush + NewsAPI + GPT-5.1',
          status: 'Active',
          message: `${enhancedArticles.length} Bitcoin articles with social metrics and AI analysis`,
          isRateLimit: false
        },
        meta: {
          totalArticles: enhancedArticles.length,
          lunarcrushArticles: lunarcrushArticles.length,
          newsapiArticles: newsapiArticles.length,
          isLiveData: true,
          sources: ['LunarCrush', 'NewsAPI', 'GPT-5.1', 'CoinGecko'],
          lastUpdated: new Date().toISOString(),
          note: 'Bitcoin-focused news with social metrics and AI-powered market analysis'
        }
      }
    };

    console.log(`✅ Returning ${enhancedArticles.length} enhanced Bitcoin articles`);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Bitcoin News Wire Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Bitcoin news',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Deduplicate articles based on title similarity
 */
function deduplicateArticles(articles: any[]): any[] {
  const seen = new Set<string>();
  const deduplicated: any[] = [];
  
  for (const article of articles) {
    const titleWords = article.headline.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word: string) => word.length > 3)
      .slice(0, 5)
      .sort()
      .join(' ');
    
    if (!seen.has(titleWords)) {
      seen.add(titleWords);
      deduplicated.push(article);
    }
  }
  
  return deduplicated;
}

/**
 * Get market ticker from CoinGecko
 */
async function getMarketTicker() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana&vs_currencies=usd&include_24hr_change=true',
      {
        headers: {
          'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || ''
        },
        signal: AbortSignal.timeout(10000)
      }
    );
    
    if (!response.ok) {
      console.error('❌ CoinGecko ticker failed');
      return [];
    }
    
    const data = await response.json();
    
    return [
      { symbol: 'BTC', name: 'Bitcoin', price: data.bitcoin?.usd || 0, change: data.bitcoin?.usd_24h_change || 0 },
      { symbol: 'ETH', name: 'Ethereum', price: data.ethereum?.usd || 0, change: data.ethereum?.usd_24h_change || 0 },
      { symbol: 'BNB', name: 'BNB', price: data.binancecoin?.usd || 0, change: data.binancecoin?.usd_24h_change || 0 },
      { symbol: 'SOL', name: 'Solana', price: data.solana?.usd || 0, change: data.solana?.usd_24h_change || 0 }
    ];
  } catch (error) {
    console.error('❌ Market ticker error:', error);
    return [];
  }
}
