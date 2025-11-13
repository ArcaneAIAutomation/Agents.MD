/**
 * Technical Indicators Calculator for ATGE
 * 
 * Calculates RSI, MACD, EMAs, Bollinger Bands, and ATR
 * Uses historical price data from CoinGecko API
 * 
 * Requirements: 1.3
 */

interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  ema: {
    ema20: number;
    ema50: number;
    ema200: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
  timestamp: Date;
}

interface PriceData {
  timestamp: number;
  price: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Fetch historical price data from CoinGecko
 */
async function fetchHistoricalPrices(symbol: string, days: number = 200): Promise<PriceData[]> {
  const coinId = symbol.toUpperCase() === 'BTC' ? 'bitcoin' : 'ethereum';
  
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch historical prices: ${response.status}`);
  }

  const data = await response.json();
  
  // Convert to PriceData format
  return data.prices.map((item: [number, number], index: number) => ({
    timestamp: item[0],
    price: item[1],
    high: item[1] * 1.02, // Estimate (2% above close)
    low: item[1] * 0.98,  // Estimate (2% below close)
    close: item[1]
  }));
}

/**
 * Calculate RSI (Relative Strength Index) - 14 period
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    throw new Error(`Not enough data for RSI calculation. Need ${period + 1} prices, got ${prices.length}`);
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  avgGain /= period;
  avgLoss /= period;

  // Smoothed averages
  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
    }
  }

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 100) / 100;
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    throw new Error(`Not enough data for EMA calculation. Need ${period} prices, got ${prices.length}`);
  }

  const multiplier = 2 / (period + 1);
  
  // Start with SMA
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  // Calculate EMA
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return Math.round(ema * 100) / 100;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * Default: 12, 26, 9
 */
function calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const macdLine = ema12 - ema26;
  
  // Calculate signal line (9-period EMA of MACD)
  const macdValues: number[] = [];
  for (let i = 26; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdValues.push(e12 - e26);
  }
  
  const signalLine = calculateEMA(macdValues, 9);
  const histogram = macdLine - signalLine;
  
  return {
    value: Math.round(macdLine * 100) / 100,
    signal: Math.round(signalLine * 100) / 100,
    histogram: Math.round(histogram * 100) / 100
  };
}

/**
 * Calculate Bollinger Bands (20 period, 2 standard deviations)
 */
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } {
  if (prices.length < period) {
    throw new Error(`Not enough data for Bollinger Bands. Need ${period} prices, got ${prices.length}`);
  }

  const recentPrices = prices.slice(-period);
  
  // Calculate SMA (middle band)
  const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  
  // Calculate standard deviation
  const squaredDiffs = recentPrices.map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  const upper = sma + (standardDeviation * stdDev);
  const lower = sma - (standardDeviation * stdDev);
  
  return {
    upper: Math.round(upper * 100) / 100,
    middle: Math.round(sma * 100) / 100,
    lower: Math.round(lower * 100) / 100
  };
}

/**
 * Calculate ATR (Average True Range) - 14 period
 */
function calculateATR(priceData: PriceData[], period: number = 14): number {
  if (priceData.length < period + 1) {
    throw new Error(`Not enough data for ATR calculation. Need ${period + 1} candles, got ${priceData.length}`);
  }

  const trueRanges: number[] = [];
  
  for (let i = 1; i < priceData.length; i++) {
    const high = priceData[i].high;
    const low = priceData[i].low;
    const prevClose = priceData[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  // Calculate initial ATR (simple average)
  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  
  // Smooth ATR
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }
  
  return Math.round(atr * 100) / 100;
}

/**
 * Calculate all technical indicators for a symbol
 * 
 * @param symbol - Cryptocurrency symbol (BTC or ETH)
 * @returns Complete technical indicators
 */
export async function getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
  console.log(`[ATGE] Calculating technical indicators for ${symbol}`);
  
  // Fetch historical prices (200 days for EMA200)
  const priceData = await fetchHistoricalPrices(symbol, 200);
  const prices = priceData.map(d => d.close);
  
  // Calculate all indicators
  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices);
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  const ema200 = calculateEMA(prices, 200);
  const bollingerBands = calculateBollingerBands(prices, 20, 2);
  const atr = calculateATR(priceData, 14);
  
  return {
    rsi,
    macd,
    ema: {
      ema20,
      ema50,
      ema200
    },
    bollingerBands,
    atr,
    timestamp: new Date()
  };
}

export type { TechnicalIndicators, PriceData };
