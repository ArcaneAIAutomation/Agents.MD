/**
 * Token Validation Utilities for UCIE
 * Validates token symbols and provides suggestions
 * Uses database-first approach with CoinGecko API fallback
 * 
 * NOTE: Database functions are only available server-side (API routes)
 * Client-side code should call API endpoints instead
 */

interface ValidationResult {
  valid: boolean;
  symbol?: string;
  error?: string;
  suggestions?: string[];
}

interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  exists: boolean;
  exchanges?: string[];
  marketCapRank?: number;
  currentPrice?: number;
}

/**
 * Validate token symbol format
 */
export function validateSymbolFormat(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') {
    return false;
  }

  // Only allow alphanumeric characters, max 10 chars
  const symbolRegex = /^[A-Z0-9]{1,10}$/;
  return symbolRegex.test(symbol.toUpperCase());
}

/**
 * Sanitize user input
 */
export function sanitizeSymbol(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove any potentially dangerous characters
  return input.replace(/[^a-zA-Z0-9-_]/g, '').toUpperCase().trim();
}

/**
 * Check if token exists in database (primary method)
 * SERVER-SIDE ONLY - Must be called from API routes
 */
export async function checkTokenInDatabase(symbol: string): Promise<TokenInfo | null> {
  // This function can only be used server-side
  if (typeof window !== 'undefined') {
    throw new Error('checkTokenInDatabase can only be called server-side');
  }

  try {
    // Dynamic import to avoid bundling pg in client code
    const { query } = await import('../db');
    
    const result = await query(
      `SELECT 
        coingecko_id as id,
        symbol,
        name,
        market_cap_rank,
        current_price_usd
      FROM ucie_tokens 
      WHERE UPPER(symbol) = UPPER($1) 
        AND is_active = TRUE
      LIMIT 1`,
      [symbol]
    );

    if (result.rows.length > 0) {
      const token = result.rows[0];
      return {
        id: token.id,
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        exists: true,
        marketCapRank: token.market_cap_rank,
        currentPrice: token.current_price_usd ? parseFloat(token.current_price_usd) : undefined
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking token in database:', error);
    return null;
  }
}

/**
 * Check if token exists on CoinGecko (fallback method)
 */
export async function checkTokenOnCoinGecko(symbol: string): Promise<TokenInfo | null> {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = 'https://api.coingecko.com/api/v3';
    
    // Search for token by symbol
    const searchUrl = apiKey
      ? `${baseUrl}/search?query=${encodeURIComponent(symbol)}&x_cg_pro_api_key=${apiKey}`
      : `${baseUrl}/search?query=${encodeURIComponent(symbol)}`;

    const response = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Find exact symbol match
    const coin = data.coins?.find((c: any) => 
      c.symbol.toUpperCase() === symbol.toUpperCase()
    );

    if (coin) {
      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        exists: true
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking token on CoinGecko:', error);
    return null;
  }
}

/**
 * Check if token exists (database first, API fallback)
 */
export async function checkTokenExists(symbol: string): Promise<TokenInfo | null> {
  // Try database first (fast)
  const dbResult = await checkTokenInDatabase(symbol);
  if (dbResult) {
    console.log(`Token ${symbol} found in database`);
    return dbResult;
  }

  // Fallback to CoinGecko API (slower)
  console.log(`Token ${symbol} not in database, checking CoinGecko...`);
  const apiResult = await checkTokenOnCoinGecko(symbol);
  
  if (apiResult) {
    console.log(`Token ${symbol} found on CoinGecko`);
  }
  
  return apiResult;
}

/**
 * Check token across multiple exchanges
 */
export async function checkTokenOnExchanges(symbol: string): Promise<string[]> {
  const exchanges: string[] = [];
  
  try {
    // Check Binance
    const binanceResponse = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (binanceResponse.ok) {
      exchanges.push('Binance');
    }
  } catch (error) {
    // Token not on Binance or request failed
  }

  try {
    // Check Kraken
    const krakenResponse = await fetch(
      `https://api.kraken.com/0/public/Ticker?pair=${symbol}USD`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (krakenResponse.ok) {
      const data = await krakenResponse.json();
      if (data.result && Object.keys(data.result).length > 0) {
        exchanges.push('Kraken');
      }
    }
  } catch (error) {
    // Token not on Kraken or request failed
  }

  try {
    // Check Coinbase
    const coinbaseResponse = await fetch(
      `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (coinbaseResponse.ok) {
      exchanges.push('Coinbase');
    }
  } catch (error) {
    // Token not on Coinbase or request failed
  }

  return exchanges;
}

/**
 * Validate token with comprehensive checks
 */
export async function validateToken(symbol: string): Promise<ValidationResult> {
  // Sanitize input
  const sanitized = sanitizeSymbol(symbol);
  
  // Check format
  if (!validateSymbolFormat(sanitized)) {
    return {
      valid: false,
      error: 'Invalid token symbol format. Use 1-10 alphanumeric characters (e.g., BTC, ETH, SOL).'
    };
  }

  // Check if token exists
  const tokenInfo = await checkTokenExists(sanitized);
  
  if (!tokenInfo) {
    // Try to find similar tokens
    const suggestions = await getSimilarTokens(sanitized);
    
    return {
      valid: false,
      error: `Token "${sanitized}" not found.`,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  // Check exchanges (optional, for additional info)
  const exchanges = await checkTokenOnExchanges(sanitized);

  return {
    valid: true,
    symbol: tokenInfo.symbol
  };
}

/**
 * Get similar token suggestions from database
 * SERVER-SIDE ONLY - Must be called from API routes
 */
async function getSimilarTokensFromDatabase(symbol: string): Promise<string[]> {
  // This function can only be used server-side
  if (typeof window !== 'undefined') {
    return [];
  }

  try {
    // Dynamic import to avoid bundling pg in client code
    const { query } = await import('../db');
    
    const result = await query(
      `SELECT symbol 
      FROM ucie_tokens 
      WHERE UPPER(symbol) LIKE UPPER($1) 
        OR UPPER(name) LIKE UPPER($2)
        AND is_active = TRUE
      ORDER BY market_cap_rank ASC NULLS LAST
      LIMIT 5`,
      [`%${symbol}%`, `%${symbol}%`]
    );

    return result.rows.map(row => row.symbol.toUpperCase());
  } catch (error) {
    console.error('Error getting similar tokens from database:', error);
    return [];
  }
}

/**
 * Get similar token suggestions from CoinGecko
 */
async function getSimilarTokensFromCoinGecko(symbol: string): Promise<string[]> {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = 'https://api.coingecko.com/api/v3';
    
    const searchUrl = apiKey
      ? `${baseUrl}/search?query=${encodeURIComponent(symbol)}&x_cg_pro_api_key=${apiKey}`
      : `${baseUrl}/search?query=${encodeURIComponent(symbol)}`;

    const response = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    // Return top 5 similar tokens
    return data.coins
      ?.slice(0, 5)
      .map((c: any) => c.symbol.toUpperCase()) || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get similar token suggestions (database first, API fallback)
 */
async function getSimilarTokens(symbol: string): Promise<string[]> {
  // Try database first
  const dbSuggestions = await getSimilarTokensFromDatabase(symbol);
  if (dbSuggestions.length > 0) {
    return dbSuggestions;
  }

  // Fallback to CoinGecko
  return await getSimilarTokensFromCoinGecko(symbol);
}

/**
 * Recent Searches Management (localStorage)
 */
export class RecentSearches {
  private static readonly STORAGE_KEY = 'ucie_recent_searches';
  private static readonly MAX_ITEMS = 5;

  static get(): string[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading recent searches:', error);
      return [];
    }
  }

  static add(symbol: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const current = this.get();
      const sanitized = sanitizeSymbol(symbol);
      
      // Remove if already exists
      const filtered = current.filter(s => s !== sanitized);
      
      // Add to beginning
      const updated = [sanitized, ...filtered].slice(0, this.MAX_ITEMS);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }
}

/**
 * Popular Tokens (hardcoded list of top tokens)
 */
export const POPULAR_TOKENS = [
  'BTC',   // Bitcoin
  'ETH',   // Ethereum
  'SOL',   // Solana
  'XRP',   // Ripple
  'ADA',   // Cardano
  'AVAX',  // Avalanche
  'DOT',   // Polkadot
  'MATIC', // Polygon
  'LINK',  // Chainlink
  'UNI'    // Uniswap
];

/**
 * Get popular tokens with current prices (optional enhancement)
 */
export async function getPopularTokensWithPrices(): Promise<Array<{ symbol: string; price?: number }>> {
  try {
    const symbols = POPULAR_TOKENS.join(',');
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = 'https://api.coingecko.com/api/v3';
    
    const url = apiKey
      ? `${baseUrl}/simple/price?ids=${symbols}&vs_currencies=usd&x_cg_pro_api_key=${apiKey}`
      : `${baseUrl}/simple/price?ids=${symbols}&vs_currencies=usd`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      // Return without prices if API fails
      return POPULAR_TOKENS.map(symbol => ({ symbol }));
    }

    const data = await response.json();
    
    return POPULAR_TOKENS.map(symbol => ({
      symbol,
      price: data[symbol.toLowerCase()]?.usd
    }));
  } catch (error) {
    // Return without prices if request fails
    return POPULAR_TOKENS.map(symbol => ({ symbol }));
  }
}
