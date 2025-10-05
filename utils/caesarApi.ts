/**
 * Caesar API Client
 * Comprehensive integration for Caesar cryptocurrency market analysis
 * Documentation: https://docs.caesar.xyz/get-started/introduction
 */

const CAESAR_API_KEY = process.env.CAESAR_API_KEY || process.env.NEXT_PUBLIC_CAESAR_API_KEY;
const CAESAR_BASE_URL = 'https://api.caesar.xyz/v1';

interface CaesarRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  timeout?: number;
}

interface CaesarMarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  timestamp: string;
}

interface CaesarTechnicalAnalysis {
  symbol: string;
  indicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    ema: { ema20: number; ema50: number; ema200: number };
    bollingerBands: { upper: number; middle: number; lower: number };
  };
  signals: {
    trend: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    recommendation: 'buy' | 'sell' | 'hold';
  };
  timestamp: string;
}

interface CaesarTradeSignal {
  symbol: string;
  action: 'buy' | 'sell';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number[];
  reasoning: string;
  timeframe: string;
  timestamp: string;
}

interface CaesarNewsItem {
  id: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  source: string;
  url: string;
  publishedAt: string;
  relatedSymbols: string[];
}

/**
 * Make authenticated request to Caesar API
 */
async function caesarRequest<T>(
  endpoint: string,
  options: CaesarRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, timeout = 15000 } = options;

  if (!CAESAR_API_KEY) {
    throw new Error('Caesar API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${CAESAR_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${CAESAR_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AgentsMD/1.0',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Caesar API error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Caesar API request timeout');
    }
    
    throw error;
  }
}

/**
 * Get real-time market data for a cryptocurrency
 */
export async function getCaesarMarketData(symbol: string): Promise<CaesarMarketData> {
  return caesarRequest<CaesarMarketData>(`/market/${symbol.toLowerCase()}`);
}

/**
 * Get technical analysis for a cryptocurrency
 */
export async function getCaesarTechnicalAnalysis(
  symbol: string,
  timeframe: string = '1h'
): Promise<CaesarTechnicalAnalysis> {
  return caesarRequest<CaesarTechnicalAnalysis>(
    `/analysis/${symbol.toLowerCase()}?timeframe=${timeframe}`
  );
}

/**
 * Get AI-powered trade signals
 */
export async function getCaesarTradeSignals(symbol: string): Promise<CaesarTradeSignal[]> {
  return caesarRequest<CaesarTradeSignal[]>(`/signals/${symbol.toLowerCase()}`);
}

/**
 * Get cryptocurrency news with sentiment analysis
 */
export async function getCaesarNews(
  symbols?: string[],
  limit: number = 15
): Promise<CaesarNewsItem[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (symbols && symbols.length > 0) {
    params.append('symbols', symbols.join(','));
  }
  return caesarRequest<CaesarNewsItem[]>(`/news?${params.toString()}`);
}

/**
 * Get comprehensive market overview
 */
export async function getCaesarMarketOverview(): Promise<{
  topGainers: CaesarMarketData[];
  topLosers: CaesarMarketData[];
  trending: CaesarMarketData[];
  marketSentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    fearGreedIndex: number;
  };
}> {
  return caesarRequest('/market/overview');
}

/**
 * Get historical price data
 */
export async function getCaesarHistoricalData(
  symbol: string,
  timeframe: string = '1h',
  limit: number = 100
): Promise<Array<{
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}>> {
  return caesarRequest(
    `/market/${symbol.toLowerCase()}/history?timeframe=${timeframe}&limit=${limit}`
  );
}

/**
 * Get order book data
 */
export async function getCaesarOrderBook(symbol: string): Promise<{
  bids: Array<[number, number]>;
  asks: Array<[number, number]>;
  timestamp: string;
}> {
  return caesarRequest(`/market/${symbol.toLowerCase()}/orderbook`);
}

/**
 * Health check for Caesar API
 */
export async function caesarHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  timestamp: string;
}> {
  const startTime = Date.now();
  try {
    await caesarRequest('/health', { timeout: 5000 });
    return {
      status: 'healthy',
      latency: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

export type {
  CaesarMarketData,
  CaesarTechnicalAnalysis,
  CaesarTradeSignal,
  CaesarNewsItem,
};
