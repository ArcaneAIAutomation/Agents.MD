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
 * 
 * NOTE: This function is a placeholder for client-side compatibility.
 * The actual database check is performed in the API route.
 * Import from tokenValidation.server.ts in API routes instead.
 */
export async function checkTokenInDatabase(symbol: string): Promise<TokenInfo | null> {
  // This function should not be called - use API route instead
  console.warn('checkTokenInDatabase should only be called from API routes');
  return null;
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
 * Check if token exists in hardcoded database (last resort fallback)
 */
export function checkTokenInHardcodedDatabase(symbol: string): TokenInfo | null {
  const upperSymbol = symbol.toUpperCase();
  
  if (HARDCODED_TOKENS[upperSymbol]) {
    console.log(`✅ Token ${symbol} found in hardcoded database (fallback layer 3)`);
    return HARDCODED_TOKENS[upperSymbol];
  }
  
  return null;
}

/**
 * Check if token exists (4-layer fallback system)
 * Layer 1: Database (fastest, most reliable)
 * Layer 2: CoinGecko API (slower, rate-limited)
 * Layer 3: Hardcoded database (guaranteed for top 50)
 * Layer 4: Exchange APIs (Binance, Kraken, Coinbase)
 */
export async function checkTokenExists(symbol: string): Promise<TokenInfo | null> {
  // Layer 1: Try database first (fast, reliable)
  try {
    const dbResult = await checkTokenInDatabase(symbol);
    if (dbResult) {
      console.log(`✅ Token ${symbol} found in database (layer 1)`);
      return dbResult;
    }
  } catch (error) {
    console.error(`❌ Database check failed for ${symbol}:`, error);
  }

  // Layer 2: Fallback to CoinGecko API (slower, rate-limited)
  console.log(`⚠️ Token ${symbol} not in database, checking CoinGecko API (layer 2)...`);
  try {
    const apiResult = await checkTokenOnCoinGecko(symbol);
    if (apiResult) {
      console.log(`✅ Token ${symbol} found on CoinGecko (layer 2)`);
      return apiResult;
    }
  } catch (error) {
    console.error(`❌ CoinGecko API check failed for ${symbol}:`, error);
  }

  // Layer 3: Check hardcoded database (guaranteed for top 50)
  console.log(`⚠️ Token ${symbol} not found via API, checking hardcoded database (layer 3)...`);
  const hardcodedResult = checkTokenInHardcodedDatabase(symbol);
  if (hardcodedResult) {
    return hardcodedResult;
  }

  // Layer 4: Try exchange APIs as last resort
  console.log(`⚠️ Token ${symbol} not in hardcoded database, checking exchanges (layer 4)...`);
  const exchanges = await checkTokenOnExchanges(symbol);
  if (exchanges.length > 0) {
    console.log(`✅ Token ${symbol} found on exchanges: ${exchanges.join(', ')} (layer 4)`);
    return {
      id: symbol.toLowerCase(),
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      exists: true,
      exchanges
    };
  }

  console.error(`❌ Token ${symbol} not found in any source (all 4 layers failed)`);
  return null;
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
 * 
 * NOTE: This function is a placeholder for client-side compatibility.
 * The actual database check is performed in the API route.
 * Import from tokenValidation.server.ts in API routes instead.
 */
async function getSimilarTokensFromDatabase(symbol: string): Promise<string[]> {
  // This function should not be called - use API route instead
  console.warn('getSimilarTokensFromDatabase should only be called from API routes');
  return [];
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
 * Get similar tokens from hardcoded database
 */
function getSimilarTokensFromHardcodedDatabase(symbol: string): string[] {
  const upperSymbol = symbol.toUpperCase();
  const suggestions: string[] = [];
  
  // Find tokens that start with the same letter or contain the search term
  for (const [tokenSymbol, tokenInfo] of Object.entries(HARDCODED_TOKENS)) {
    if (tokenSymbol.startsWith(upperSymbol.charAt(0)) || 
        tokenSymbol.includes(upperSymbol) ||
        tokenInfo.name.toUpperCase().includes(upperSymbol)) {
      suggestions.push(tokenSymbol);
      if (suggestions.length >= 5) break;
    }
  }
  
  return suggestions;
}

/**
 * Get similar token suggestions (3-layer fallback)
 * Layer 1: Database (fastest)
 * Layer 2: CoinGecko API (comprehensive)
 * Layer 3: Hardcoded database (guaranteed)
 */
async function getSimilarTokens(symbol: string): Promise<string[]> {
  // Layer 1: Try database first
  try {
    const dbSuggestions = await getSimilarTokensFromDatabase(symbol);
    if (dbSuggestions.length > 0) {
      console.log(`✅ Found ${dbSuggestions.length} suggestions from database`);
      return dbSuggestions;
    }
  } catch (error) {
    console.error('❌ Database suggestions failed:', error);
  }

  // Layer 2: Fallback to CoinGecko
  try {
    const apiSuggestions = await getSimilarTokensFromCoinGecko(symbol);
    if (apiSuggestions.length > 0) {
      console.log(`✅ Found ${apiSuggestions.length} suggestions from CoinGecko`);
      return apiSuggestions;
    }
  } catch (error) {
    console.error('❌ CoinGecko suggestions failed:', error);
  }

  // Layer 3: Use hardcoded database
  const hardcodedSuggestions = getSimilarTokensFromHardcodedDatabase(symbol);
  if (hardcodedSuggestions.length > 0) {
    console.log(`✅ Found ${hardcodedSuggestions.length} suggestions from hardcoded database`);
  }
  
  return hardcodedSuggestions;
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
 * Hardcoded Token Database (Top 50 Cryptocurrencies)
 * Used as last-resort fallback when database and APIs fail
 * Ensures major tokens always work with 100% reliability
 */
export const HARDCODED_TOKENS: Record<string, TokenInfo> = {
  'BTC': { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', exists: true },
  'ETH': { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', exists: true },
  'USDT': { id: 'tether', symbol: 'USDT', name: 'Tether', exists: true },
  'XRP': { id: 'ripple', symbol: 'XRP', name: 'XRP', exists: true },
  'BNB': { id: 'binancecoin', symbol: 'BNB', name: 'BNB', exists: true },
  'SOL': { id: 'solana', symbol: 'SOL', name: 'Solana', exists: true },
  'USDC': { id: 'usd-coin', symbol: 'USDC', name: 'USDC', exists: true },
  'STETH': { id: 'staked-ether', symbol: 'STETH', name: 'Lido Staked Ether', exists: true },
  'DOGE': { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', exists: true },
  'TRX': { id: 'tron', symbol: 'TRX', name: 'TRON', exists: true },
  'ADA': { id: 'cardano', symbol: 'ADA', name: 'Cardano', exists: true },
  'AVAX': { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', exists: true },
  'SHIB': { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', exists: true },
  'WBTC': { id: 'wrapped-bitcoin', symbol: 'WBTC', name: 'Wrapped Bitcoin', exists: true },
  'TON': { id: 'the-open-network', symbol: 'TON', name: 'Toncoin', exists: true },
  'LINK': { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', exists: true },
  'DOT': { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', exists: true },
  'MATIC': { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', exists: true },
  'DAI': { id: 'dai', symbol: 'DAI', name: 'Dai', exists: true },
  'LTC': { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', exists: true },
  'BCH': { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', exists: true },
  'UNI': { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', exists: true },
  'ATOM': { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos Hub', exists: true },
  'XLM': { id: 'stellar', symbol: 'XLM', name: 'Stellar', exists: true },
  'XMR': { id: 'monero', symbol: 'XMR', name: 'Monero', exists: true },
  'ETC': { id: 'ethereum-classic', symbol: 'ETC', name: 'Ethereum Classic', exists: true },
  'OKB': { id: 'okb', symbol: 'OKB', name: 'OKB', exists: true },
  'ICP': { id: 'internet-computer', symbol: 'ICP', name: 'Internet Computer', exists: true },
  'FIL': { id: 'filecoin', symbol: 'FIL', name: 'Filecoin', exists: true },
  'APT': { id: 'aptos', symbol: 'APT', name: 'Aptos', exists: true },
  'HBAR': { id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera', exists: true },
  'ARB': { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', exists: true },
  'VET': { id: 'vechain', symbol: 'VET', name: 'VeChain', exists: true },
  'NEAR': { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', exists: true },
  'OP': { id: 'optimism', symbol: 'OP', name: 'Optimism', exists: true },
  'AAVE': { id: 'aave', symbol: 'AAVE', name: 'Aave', exists: true },
  'GRT': { id: 'the-graph', symbol: 'GRT', name: 'The Graph', exists: true },
  'ALGO': { id: 'algorand', symbol: 'ALGO', name: 'Algorand', exists: true },
  'MKR': { id: 'maker', symbol: 'MKR', name: 'Maker', exists: true },
  'SAND': { id: 'the-sandbox', symbol: 'SAND', name: 'The Sandbox', exists: true },
  'MANA': { id: 'decentraland', symbol: 'MANA', name: 'Decentraland', exists: true },
  'AXS': { id: 'axie-infinity', symbol: 'AXS', name: 'Axie Infinity', exists: true },
  'FTM': { id: 'fantom', symbol: 'FTM', name: 'Fantom', exists: true },
  'EGLD': { id: 'elrond-erd-2', symbol: 'EGLD', name: 'MultiversX', exists: true },
  'THETA': { id: 'theta-token', symbol: 'THETA', name: 'Theta Network', exists: true },
  'XTZ': { id: 'tezos', symbol: 'XTZ', name: 'Tezos', exists: true },
  'EOS': { id: 'eos', symbol: 'EOS', name: 'EOS', exists: true },
  'FLOW': { id: 'flow', symbol: 'FLOW', name: 'Flow', exists: true },
  'KLAY': { id: 'klay-token', symbol: 'KLAY', name: 'Klaytn', exists: true },
  'CHZ': { id: 'chiliz', symbol: 'CHZ', name: 'Chiliz', exists: true }
};

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
