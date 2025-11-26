/**
 * Technical Indicators Calculator
 * 
 * Implements core technical analysis indicators:
 * - RSI (Relative Strength Index)
 * - MACD (Moving Average Convergence Divergence)
 * - EMA (Exponential Moving Average)
 * - Bollinger Bands
 * - ATR (Average True Range)
 * - Stochastic Oscillator
 * 
 * Requirements: 3.2
 */

export interface PriceData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  ema: {
    ema9: number;
    ema21: number;
    ema50: number;
    ema200: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
  stochastic: {
    k: number;
    d: number;
  };
}

/**
 * Calculate Exponential Moving Average (EMA)
 * Formula: EMA = (Close - EMA(previous)) * multiplier + EMA(previous)
 * Multiplier = 2 / (period + 1)
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    throw new Error(`Insufficient data for EMA calculation. Need ${period} prices, got ${prices.length}`);
  }

  // Calculate initial SMA for first EMA value
  const sma = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  const multiplier = 2 / (period + 1);
  let ema = sma;

  // Calculate EMA for remaining prices
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate all EMA periods (9, 21, 50, 200)
 */
export function calculateAllEMAs(prices: number[]): {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
} {
  if (prices.length < 200) {
    throw new Error(`Insufficient data for EMA calculations. Need 200 prices, got ${prices.length}`);
  }

  return {
    ema9: calculateEMA(prices, 9),
    ema21: calculateEMA(prices, 21),
    ema50: calculateEMA(prices, 50),
    ema200: calculateEMA(prices, 200),
  };
}

/**
 * Calculate Relative Strength Index (RSI)
 * Formula: RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    throw new Error(`Insufficient data for RSI calculation. Need ${period + 1} prices, got ${prices.length}`);
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Calculate initial average gain and loss
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate smoothed averages for remaining periods
  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
    }
  }

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * MACD Line = 12-period EMA - 26-period EMA
 * Signal Line = 9-period EMA of MACD Line
 * Histogram = MACD Line - Signal Line
 */
export function calculateMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  if (prices.length < 26) {
    throw new Error(`Insufficient data for MACD calculation. Need 26 prices, got ${prices.length}`);
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;

  // Calculate MACD values for signal line
  const macdValues: number[] = [];
  for (let i = 26; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdValues.push(e12 - e26);
  }

  const signalLine = macdValues.length >= 9 ? calculateEMA(macdValues, 9) : macdLine;
  const histogram = macdLine - signalLine;

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram,
  };
}

/**
 * Calculate Bollinger Bands
 * Middle Band = 20-period SMA
 * Upper Band = Middle Band + (2 * standard deviation)
 * Lower Band = Middle Band - (2 * standard deviation)
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDevMultiplier: number = 2): {
  upper: number;
  middle: number;
  lower: number;
} {
  if (prices.length < period) {
    throw new Error(`Insufficient data for Bollinger Bands calculation. Need ${period} prices, got ${prices.length}`);
  }

  const recentPrices = prices.slice(-period);
  
  // Calculate middle band (SMA)
  const middle = recentPrices.reduce((sum, price) => sum + price, 0) / period;

  // Calculate standard deviation
  const squaredDiffs = recentPrices.map(price => Math.pow(price - middle, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + (stdDevMultiplier * stdDev);
  const lower = middle - (stdDevMultiplier * stdDev);

  return {
    upper,
    middle,
    lower,
  };
}

/**
 * Calculate Average True Range (ATR)
 * True Range = max(high - low, abs(high - previous close), abs(low - previous close))
 * ATR = Average of True Range over period
 */
export function calculateATR(priceData: PriceData[], period: number = 14): number {
  if (priceData.length < period + 1) {
    throw new Error(`Insufficient data for ATR calculation. Need ${period + 1} candles, got ${priceData.length}`);
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < priceData.length; i++) {
    const current = priceData[i];
    const previous = priceData[i - 1];

    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);

    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
  }

  // Calculate initial ATR (simple average)
  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;

  // Calculate smoothed ATR for remaining periods
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }

  return atr;
}

/**
 * Calculate Stochastic Oscillator
 * %K = (Current Close - Lowest Low) / (Highest High - Lowest Low) * 100
 * %D = 3-period SMA of %K
 */
export function calculateStochastic(priceData: PriceData[], kPeriod: number = 14, dPeriod: number = 3): {
  k: number;
  d: number;
} {
  if (priceData.length < kPeriod) {
    throw new Error(`Insufficient data for Stochastic calculation. Need ${kPeriod} candles, got ${priceData.length}`);
  }

  const recentData = priceData.slice(-kPeriod);
  
  const currentClose = recentData[recentData.length - 1].close;
  const lowestLow = Math.min(...recentData.map(d => d.low));
  const highestHigh = Math.max(...recentData.map(d => d.high));

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

  // Calculate %D (3-period SMA of %K)
  // For simplicity, we'll calculate %K for the last dPeriod candles
  const kValues: number[] = [];
  
  for (let i = kPeriod - 1; i < priceData.length; i++) {
    const slice = priceData.slice(i - kPeriod + 1, i + 1);
    const close = slice[slice.length - 1].close;
    const low = Math.min(...slice.map(d => d.low));
    const high = Math.max(...slice.map(d => d.high));
    
    const kVal = ((close - low) / (high - low)) * 100;
    kValues.push(kVal);
  }

  const recentKValues = kValues.slice(-dPeriod);
  const d = recentKValues.reduce((sum, val) => sum + val, 0) / dPeriod;

  return {
    k,
    d,
  };
}

/**
 * Calculate all technical indicators at once
 */
export function calculateAllIndicators(priceData: PriceData[]): TechnicalIndicators {
  if (priceData.length < 200) {
    throw new Error(`Insufficient data for technical indicators. Need 200 candles, got ${priceData.length}`);
  }

  const closePrices = priceData.map(d => d.close);

  return {
    rsi: calculateRSI(closePrices),
    macd: calculateMACD(closePrices),
    ema: calculateAllEMAs(closePrices),
    bollingerBands: calculateBollingerBands(closePrices),
    atr: calculateATR(priceData),
    stochastic: calculateStochastic(priceData),
  };
}
