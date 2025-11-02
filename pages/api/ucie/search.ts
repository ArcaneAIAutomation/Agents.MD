import type { NextApiRequest, NextApiResponse } from 'next';

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank?: number;
}

interface TokenSuggestion {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank?: number;
}

interface SearchResponse {
  success: boolean;
  suggestions: TokenSuggestion[];
  cached: boolean;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

// In-memory cache for token list
let tokenListCache: CoinGeckoToken[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch complete token list from CoinGecko
 */
async function fetchTokenList(): Promise<CoinGeckoToken[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (tokenListCache && (now - cacheTimestamp) < CACHE_TTL) {
    return tokenListCache;
  }

  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = 'https://api.coingecko.com/api/v3';
    const endpoint = '/coins/list';
    
    const url = apiKey 
      ? `${baseUrl}${endpoint}?x_cg_pro_api_key=${apiKey}`
      : `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoToken[] = await response.json();
    
    // Update cache
    tokenListCache = data;
    cacheTimestamp = now;
    
    return data;
  } catch (error) {
    console.error('Error fetching token list:', error);
    
    // Return cached data even if expired, better than nothing
    if (tokenListCache) {
      return tokenListCache;
    }
    
    throw error;
  }
}

/**
 * Fuzzy search algorithm
 * Scores matches based on:
 * - Exact symbol match (highest priority)
 * - Symbol starts with query
 * - Symbol contains query
 * - Name starts with query
 * - Name contains query
 */
function fuzzySearch(tokens: CoinGeckoToken[], query: string): TokenSuggestion[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return [];
  }

  const scored = tokens.map(token => {
    const symbol = token.symbol.toLowerCase();
    const name = token.name.toLowerCase();
    let score = 0;

    // Exact symbol match (highest priority)
    if (symbol === normalizedQuery) {
      score = 1000;
    }
    // Symbol starts with query
    else if (symbol.startsWith(normalizedQuery)) {
      score = 500;
    }
    // Symbol contains query
    else if (symbol.includes(normalizedQuery)) {
      score = 250;
    }
    // Name starts with query
    else if (name.startsWith(normalizedQuery)) {
      score = 100;
    }
    // Name contains query
    else if (name.includes(normalizedQuery)) {
      score = 50;
    }

    // Boost score for tokens with market cap rank (more popular)
    if (token.market_cap_rank) {
      score += (1000 - token.market_cap_rank) / 10;
    }

    return {
      token,
      score
    };
  });

  // Filter out non-matches and sort by score
  const matches = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) // Return top 10 matches
    .map(item => ({
      id: item.token.id,
      symbol: item.token.symbol,
      name: item.token.name,
      market_cap_rank: item.token.market_cap_rank
    }));

  return matches;
}

/**
 * Validate and sanitize search query
 */
function validateQuery(query: string): string | null {
  if (!query || typeof query !== 'string') {
    return null;
  }

  // Remove potentially dangerous characters
  const sanitized = query.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  
  // Must be at least 1 character, max 50
  if (sanitized.length < 1 || sanitized.length > 50) {
    return null;
  }

  return sanitized;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { q } = req.query;
    
    // Validate query parameter
    const query = validateQuery(q as string);
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search query',
        timestamp: new Date().toISOString()
      });
    }

    // Fetch token list (from cache or API)
    const startTime = Date.now();
    const tokens = await fetchTokenList();
    const fetchTime = Date.now() - startTime;

    // Perform fuzzy search
    const searchStartTime = Date.now();
    const suggestions = fuzzySearch(tokens, query);
    const searchTime = Date.now() - searchStartTime;

    const totalTime = fetchTime + searchTime;
    const isCached = tokenListCache !== null && (Date.now() - cacheTimestamp) < CACHE_TTL;

    // Log performance metrics
    console.log(`Search completed in ${totalTime}ms (fetch: ${fetchTime}ms, search: ${searchTime}ms, cached: ${isCached})`);

    // Return results
    return res.status(200).json({
      success: true,
      suggestions,
      cached: isCached,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
