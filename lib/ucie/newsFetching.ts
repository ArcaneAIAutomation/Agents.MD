/**
 * News Fetching Utilities for UCIE
 * 
 * Fetches cryptocurrency news from multiple sources:
 * - LunarCrush (Primary - Topic-specific social posts)
 * - NewsAPI
 * - CryptoCompare
 * 
 * Features:
 * - Multi-source aggregation
 * - News deduplication
 * - Automatic categorization
 * - Breaking news detection
 * - Relevance scoring
 */

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  category: 'partnerships' | 'technology' | 'regulatory' | 'market' | 'community';
  isBreaking: boolean;
  relevanceScore: number;
  engagements?: number; // For LunarCrush posts
  creator?: string; // For LunarCrush posts
}

export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string;
  }>;
}

export interface CryptoCompareNewsItem {
  id: string;
  guid: string;
  published_on: number;
  imageurl: string;
  title: string;
  url: string;
  source: string;
  body: string;
  tags: string;
  categories: string;
  upvotes: string;
  downvotes: string;
  lang: string;
  source_info: {
    name: string;
    lang: string;
    img: string;
  };
}

/**
 * Fetch news from NewsAPI
 */
export async function fetchNewsAPI(symbol: string): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    console.warn('NEWS_API_KEY not configured, skipping NewsAPI');
    return [];
  }

  try {
    const query = `${symbol} OR ${getFullTokenName(symbol)} cryptocurrency`;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout for news
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UCIE/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }
    
    const data: NewsAPIResponse = await response.json();
    
    return data.articles.map(article => ({
      id: `newsapi-${Buffer.from(article.url).toString('base64').substring(0, 16)}`,
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      imageUrl: article.urlToImage || undefined,
      category: categorizeNews(article.title, article.description || ''),
      isBreaking: isBreakingNews(article.publishedAt),
      relevanceScore: calculateRelevance(article.title, article.description || '', symbol)
    }));
  } catch (error) {
    console.error('NewsAPI fetch error:', error);
    return [];
  }
}

/**
 * Fetch news from CryptoCompare
 */
export async function fetchCryptoCompareNews(symbol: string): Promise<NewsArticle[]> {
  const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
  
  try {
    const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${symbol}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout for news
    
    const headers: HeadersInit = {
      'User-Agent': 'UCIE/1.0'
    };
    
    if (apiKey) {
      headers['authorization'] = `Apikey ${apiKey}`;
    }
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`CryptoCompare error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.Data || !Array.isArray(data.Data)) {
      return [];
    }
    
    return data.Data.map((item: CryptoCompareNewsItem) => ({
      id: `cryptocompare-${item.id}`,
      title: item.title,
      description: item.body.substring(0, 200) + '...',
      url: item.url,
      source: item.source_info.name,
      publishedAt: new Date(item.published_on * 1000).toISOString(),
      imageUrl: item.imageurl || undefined,
      category: categorizeNews(item.title, item.body),
      isBreaking: isBreakingNews(new Date(item.published_on * 1000).toISOString()),
      relevanceScore: calculateRelevance(item.title, item.body, symbol)
    }));
  } catch (error) {
    console.error('CryptoCompare news fetch error:', error);
    return [];
  }
}

/**
 * Fetch news from LunarCrush (Primary Source - Topic-specific posts)
 * ✅ NEW: LunarCrush provides highly relevant, crypto-specific social posts
 */
export async function fetchLunarCrushNews(symbol: string): Promise<NewsArticle[]> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('LUNARCRUSH_API_KEY not configured, skipping LunarCrush news');
    return [];
  }

  try {
    // Map common symbols to LunarCrush topic format
    const topicMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'XRP': 'xrp',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'MATIC': 'polygon',
      'AVAX': 'avalanche',
      'LINK': 'chainlink'
    };
    
    const topic = topicMap[symbol.toUpperCase()] || symbol.toLowerCase();
    
    // Fetch top posts from last 24 hours
    const url = `https://lunarcrush.com/api4/public/topic/${topic}/posts/v1?interval=1d`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'UCIE/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`LunarCrush API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }
    
    // Convert LunarCrush posts to NewsArticle format
    // Take top 15 most relevant posts
    return data.data.slice(0, 15).map((post: any, index: number) => ({
      id: `lunarcrush-${post.id || index}`,
      title: post.text?.substring(0, 100) || 'Social Post',
      description: post.text || '',
      url: post.url || `https://lunarcrush.com/topic/${topic}`,
      source: `LunarCrush - ${post.creator?.screen_name || 'Social'}`,
      publishedAt: post.created_at || new Date().toISOString(),
      imageUrl: post.image_url,
      category: 'community' as const,
      isBreaking: false,
      relevanceScore: calculateLunarCrushRelevance(post, symbol),
      engagements: post.engagements || 0,
      creator: post.creator?.screen_name
    }));
  } catch (error) {
    console.error('LunarCrush news fetch error:', error);
    return [];
  }
}

/**
 * Calculate relevance score for LunarCrush posts
 */
function calculateLunarCrushRelevance(post: any, symbol: string): number {
  let score = 0.7; // Base score for LunarCrush (high quality source)
  
  // Boost for high engagement
  const engagements = post.engagements || 0;
  if (engagements > 10000) score += 0.2;
  else if (engagements > 1000) score += 0.15;
  else if (engagements > 100) score += 0.1;
  
  // Boost for verified creators
  if (post.creator?.verified) score += 0.1;
  
  // Boost for high follower count
  const followers = post.creator?.followers || 0;
  if (followers > 100000) score += 0.1;
  else if (followers > 10000) score += 0.05;
  
  return Math.min(score, 1.0);
}

/**
 * Fetch news from all sources and deduplicate
 * ✅ IMPROVED: Returns source status for better error visibility
 * ✅ ENHANCED: Now includes LunarCrush as primary source
 */
export async function fetchAllNews(symbol: string): Promise<{
  articles: NewsArticle[];
  sources: {
    LunarCrush: { success: boolean; articles: number; error?: string };
    NewsAPI: { success: boolean; articles: number; error?: string };
    CryptoCompare: { success: boolean; articles: number; error?: string };
  };
}> {
  const [lunarCrushArticles, newsAPIArticles, cryptoCompareArticles] = await Promise.allSettled([
    fetchLunarCrushNews(symbol),
    fetchNewsAPI(symbol),
    fetchCryptoCompareNews(symbol)
  ]);
  
  const allArticles: NewsArticle[] = [];
  
  // Track source status
  const sources = {
    LunarCrush: { success: false, articles: 0, error: undefined as string | undefined },
    NewsAPI: { success: false, articles: 0, error: undefined as string | undefined },
    CryptoCompare: { success: false, articles: 0, error: undefined as string | undefined }
  };
  
  // LunarCrush (Primary Source)
  if (lunarCrushArticles.status === 'fulfilled') {
    allArticles.push(...lunarCrushArticles.value);
    sources.LunarCrush = {
      success: true,
      articles: lunarCrushArticles.value.length,
      error: undefined
    };
  } else {
    sources.LunarCrush = {
      success: false,
      articles: 0,
      error: lunarCrushArticles.reason?.message || 'Failed to fetch'
    };
  }
  
  // NewsAPI
  if (newsAPIArticles.status === 'fulfilled') {
    allArticles.push(...newsAPIArticles.value);
    sources.NewsAPI = {
      success: true,
      articles: newsAPIArticles.value.length,
      error: undefined
    };
  } else {
    sources.NewsAPI = {
      success: false,
      articles: 0,
      error: newsAPIArticles.reason?.message || 'Failed to fetch'
    };
  }
  
  // CryptoCompare
  if (cryptoCompareArticles.status === 'fulfilled') {
    allArticles.push(...cryptoCompareArticles.value);
    sources.CryptoCompare = {
      success: true,
      articles: cryptoCompareArticles.value.length,
      error: undefined
    };
  } else {
    sources.CryptoCompare = {
      success: false,
      articles: 0,
      error: cryptoCompareArticles.reason?.message || 'Failed to fetch'
    };
  }
  
  // Deduplicate by title similarity
  const deduplicated = deduplicateNews(allArticles);
  
  // Sort by relevance and recency
  deduplicated.sort((a, b) => {
    // Breaking news first
    if (a.isBreaking && !b.isBreaking) return -1;
    if (!a.isBreaking && b.isBreaking) return 1;
    
    // Then by relevance score
    const relevanceDiff = b.relevanceScore - a.relevanceScore;
    if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
    
    // Then by recency
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
  
  // Return top 20 with source status
  return {
    articles: deduplicated.slice(0, 20),
    sources
  };
}

/**
 * Deduplicate news articles by title similarity
 */
function deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const deduplicated: NewsArticle[] = [];
  
  for (const article of articles) {
    const normalizedTitle = normalizeTitle(article.title);
    
    // Check if we've seen a similar title
    let isDuplicate = false;
    for (const seenTitle of seen) {
      if (calculateSimilarity(normalizedTitle, seenTitle) > 0.8) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.add(normalizedTitle);
      deduplicated.push(article);
    }
  }
  
  return deduplicated;
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(' '));
  const words2 = new Set(str2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Categorize news article by content
 */
function categorizeNews(title: string, description: string): NewsArticle['category'] {
  const text = (title + ' ' + description).toLowerCase();
  
  // Partnership keywords
  if (text.match(/partner|collaboration|integrate|alliance|team up|join forces/)) {
    return 'partnerships';
  }
  
  // Technology keywords
  if (text.match(/upgrade|launch|release|protocol|network|blockchain|smart contract|update|feature/)) {
    return 'technology';
  }
  
  // Regulatory keywords
  if (text.match(/sec|regulation|legal|lawsuit|compliance|government|ban|approve|license/)) {
    return 'regulatory';
  }
  
  // Community keywords
  if (text.match(/community|airdrop|token burn|governance|vote|proposal/)) {
    return 'community';
  }
  
  // Default to market analysis
  return 'market';
}

/**
 * Check if news is breaking (< 2 hours old)
 */
function isBreakingNews(publishedAt: string): boolean {
  const publishedTime = new Date(publishedAt).getTime();
  const now = Date.now();
  const twoHoursAgo = now - (2 * 60 * 60 * 1000);
  
  return publishedTime > twoHoursAgo;
}

/**
 * Calculate relevance score (0-1) based on keyword matching
 */
function calculateRelevance(title: string, description: string, symbol: string): number {
  const text = (title + ' ' + description).toLowerCase();
  const symbolLower = symbol.toLowerCase();
  const fullName = getFullTokenName(symbol).toLowerCase();
  
  let score = 0;
  
  // Title mentions
  if (title.toLowerCase().includes(symbolLower)) score += 0.4;
  if (title.toLowerCase().includes(fullName)) score += 0.3;
  
  // Description mentions
  if (description.toLowerCase().includes(symbolLower)) score += 0.2;
  if (description.toLowerCase().includes(fullName)) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * Get full token name from symbol
 */
function getFullTokenName(symbol: string): string {
  const tokenNames: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'XRP': 'Ripple',
    'SOL': 'Solana',
    'ADA': 'Cardano',
    'DOT': 'Polkadot',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink',
    'UNI': 'Uniswap',
    'AAVE': 'Aave',
    'AVAX': 'Avalanche',
    'ATOM': 'Cosmos',
    'ALGO': 'Algorand',
    'XLM': 'Stellar',
    'VET': 'VeChain',
    'ICP': 'Internet Computer',
    'FIL': 'Filecoin',
    'TRX': 'Tron',
    'ETC': 'Ethereum Classic',
    'XMR': 'Monero'
  };
  
  return tokenNames[symbol.toUpperCase()] || symbol;
}
