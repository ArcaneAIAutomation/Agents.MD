/**
 * Technical Indicators Calculator V2 for ATGE
 * 
 * Multi-timeframe technical indicators with accurate data sources
 * Uses real OHLC data from Binance/Kraken instead of estimated values
 * 
 * Improvements over V1:
 * - Timeframe-specific calculations (15m, 1h, 4h, 1d)
 * - Real OHLC data (no estimates)
 * - Multiple data sources with attribution
 * - Industry-standard formulas
 * - Data quality scoring
 * 
 * Requirements: 1.3
 */

import { fetchOHLCData, calculateDataQuality, type OHLCVCandle } from './dataProviders';

export interface TechnicalIndicatorsV2 {
  // Indicator values
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
  
  // Metadata
  timeframe: '15m' | '1h' | '4h' | '1d';
  dataSource: string;
  calculatedAt: Date;
  dataQuality: number;
  candleCount: number;
}

interface TimeframeConfig {
  timeframe: '15m' | '1h' | '4h' | '1d';
  candleCount: number; // How many candles to fetch
  rsiPeriod: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  emaPeriods: [number, number, number]; // [20, 50, 200]
  bbPeriod: number;
  bbStdDev: number;
  atrPeriod: number;
}

const TIMEFRAME_CONFIGS: Record<string, TimeframeConfig> = {
  '15m': {
    timeframe: '15m',
    candleCount: 500, // ~5 days of 15m candles
    rsiPeriod: 14,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    emaPeriods: [20, 50, 200],
    bbPeriod: 20,
    bbStdDev: 2,
    atrPeriod: 14
  },
  '1h': {
    timeframe: '1h',
    candleCount: 500, // ~20 days of 1h candles
    rsiPeriod: 14,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    emaPeriods: [20, 50, 200],
    bbPeriod: 20,
    bbStdDev: 2,
    atrPeriod: 14
  },
  '4h': {
    timeframe: '4h',
    candleCount: 500, // ~83 days of 4h candles
    rsiPeriod: 14,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    emaPeriods: [20, 50, 200],
    bbPeriod: 20,
    bbStdDev: 2,
    atrPeriod: 14
  },
  '1d': {
    timeframe: '1d',
    candleCount: 500, // ~500 days of daily candles
    rsiPeriod: 14,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    emaPeriods: [20, 50, 200],
    bbPeriod: 20,
    bbStdDev: 2,
    atrPeriod: 14
  }
};

/**
 * Calculate RSI (Relative Strength Index)
 * Industry-standard Wilder's smoothing method
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

  // Initial average (simple average of first period)
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  avgGain /= period;
  avgLoss /= period;

  // Wilder's smoothing for subsequent values
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
 * Industry-standard formula
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
 * Industry-standard: 12, 26, 9
 */
function calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): { value: number; signal: number; histogram: number } {
  if (prices.length < slow + signal) {
    throw new Error(`Not enough data for MACD calculation. Need ${slow + signal} prices, got ${prices.length}`);
  }

  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  
  const macdLine = emaFast - emaSlow;
  
  // Calculate signal line (EMA of MACD values)
  const macdValues: number[] = [];
  for (let i = slow; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const eFast = calculateEMA(slice, fast);
    const eSlow = calculateEMA(slice, slow);
    macdValues.push(eFast - eSlow);
  }
  
  const signalLine = calculateEMA(macdValues, signal);
  const histogram = macdLine - signalLine;
  
  return {
    value: Math.round(macdLine * 100) / 100,
    signal: Math.round(signalLine * 100) / 100,
    histogram: Math.round(histogram * 100) / 100
  };
}

/**
 * Calculate Bollinger Bands
 * Industry-standard: 20 period, 2 standard deviations
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
 * Calculate ATR (Average True Range)
 * Industry-standard: 14 period
 */
function calculateATR(candles: OHLCVCandle[], period: number = 14): number {
  if (candles.length < period + 1) {
    throw new Error(`Not enough data for ATR calculation. Need ${period + 1} candles, got ${candles.length}`);
  }

  const trueRanges: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  // Calculate initial ATR (simple average)
  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  
  // Wilder's smoothing
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }
  
  return Math.round(atr * 100) / 100;
}

/**
 * Calculate all technical indicators for a symbol and timeframe
 * 
 * Uses real OHLC data from Binance/Kraken for accurate calculations
 * 
 * @param symbol - Cryptocurrency symbol (BTC or ETH)
 * @param timeframe - Candle timeframe (15m, 1h, 4h, 1d)
 * @returns Complete technical indicators with metadata
 */
export async function getTechnicalIndicatorsV2(
  symbol: string,
  timeframe: '15m' | '1h' | '4h' | '1d' = '1h'
): Promise<TechnicalIndicatorsV2> {
  console.log(`[ATGE] Calculating technical indicators V2 for ${symbol} ${timeframe}`);
  
  const config = TIMEFRAME_CONFIGS[timeframe];
  if (!config) {
    throw new Error(`Invalid timeframe: ${timeframe}`);
  }
  
  // Fetch OHLC data from multi-provider system
  const ohlcData = await fetchOHLCData(symbol, timeframe, config.candleCount);
  
  console.log(`[ATGE] Fetched ${ohlcData.candles.length} candles from ${ohlcData.source}`);
  
  // Extract close prices for calculations
  const closePrices = ohlcData.candles.map(c => c.close);
  
  // Calculate all indicators
  const rsi = calculateRSI(closePrices, config.rsiPeriod);
  const macd = calculateMACD(closePrices, config.macdFast, config.macdSlow, config.macdSignal);
  const ema20 = calculateEMA(closePrices, config.emaPeriods[0]);
  const ema50 = calculateEMA(closePrices, config.emaPeriods[1]);
  const ema200 = calculateEMA(closePrices, config.emaPeriods[2]);
  const bollingerBands = calculateBollingerBands(closePrices, config.bbPeriod, config.bbStdDev);
  const atr = calculateATR(ohlcData.candles, config.atrPeriod);
  
  // Calculate data quality
  const dataQuality = Math.min(
    ohlcData.quality,
    calculateDataQuality(ohlcData.candles, timeframe)
  );
  
  console.log(`[ATGE] Indicators calculated - RSI: ${rsi}, MACD: ${macd.value}, EMA20: ${ema20}, Quality: ${dataQuality}%`);
  
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
    timeframe,
    dataSource: ohlcData.source,
    calculatedAt: ohlcData.fetchedAt,
    dataQuality,
    candleCount: ohlcData.candles.length
  };
}

export type { TimeframeConfig };
