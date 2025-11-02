/**
 * Technical Indicators Calculator
 * Implements 11+ technical indicators for cryptocurrency analysis
 * Requirements: 7.1
 */

export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RSIResult {
  value: number;
  signal: 'overbought' | 'oversold' | 'neutral';
  interpretation: string;
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  signalType: 'bullish' | 'bearish' | 'neutral';
  interpretation: string;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  signal: 'overbought' | 'oversold' | 'neutral';
  interpretation: string;
}

export interface EMAResult {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  interpretation: string;
}

export interface StochasticResult {
  k: number;
  d: number;
  signal: 'overbought' | 'oversold' | 'neutral';
  interpretation: string;
}

export interface ATRResult {
  value: number;
  volatility: 'high' | 'medium' | 'low';
  interpretation: string;
}

export interface ADXResult {
  value: number;
  trend: 'strong' | 'weak' | 'no_trend';
  interpretation: string;
}

export interface OBVResult {
  value: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  interpretation: string;
}

export interface FibonacciResult {
  levels: {
    level: number;
    price: number;
    label: string;
  }[];
  currentLevel: string;
  interpretation: string;
}

export interface IchimokuResult {
  tenkanSen: number;
  kijunSen: number;
  senkouSpanA: number;
  senkouSpanB: number;
  chikouSpan: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  cloud: 'bullish' | 'bearish';
  interpretation: string;
}

export interface VolumeProfileResult {
  poc: number; // Point of Control
  vah: number; // Value Area High
  val: number; // Value Area Low
  interpretation: string;
}

/**
 * Calculate RSI (Relative Strength Index)
 * Period: 14 (standard)
 */
export function calculateRSI(data: OHLCVData[], period: number = 14): RSIResult {
  if (data.length < period + 1) {
    throw new Error(`Insufficient data for RSI calculation. Need at least ${period + 1} data points.`);
  }

  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
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

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  let signal: 'overbought' | 'oversold' | 'neutral';
  let interpretation: string;

  if (rsi > 70) {
    signal = 'overbought';
    interpretation = `RSI at ${rsi.toFixed(2)} indicates overbought conditions. Price may be due for a correction.`;
  } else if (rsi < 30) {
    signal = 'oversold';
    interpretation = `RSI at ${rsi.toFixed(2)} indicates oversold conditions. Price may be due for a bounce.`;
  } else {
    signal = 'neutral';
    interpretation = `RSI at ${rsi.toFixed(2)} is in neutral territory. No extreme conditions detected.`;
  }

  return { value: rsi, signal, interpretation };
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * Standard: 12, 26, 9
 */
export function calculateMACD(
  data: OHLCVData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  if (data.length < slowPeriod + signalPeriod) {
    throw new Error(`Insufficient data for MACD calculation.`);
  }

  const closes = data.map(d => d.close);
  
  // Calculate EMAs
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  
  // MACD line
  const macdLine = fastEMA[fastEMA.length - 1] - slowEMA[slowEMA.length - 1];
  
  // Signal line (EMA of MACD)
  const macdValues: number[] = [];
  for (let i = 0; i < Math.min(fastEMA.length, slowEMA.length); i++) {
    macdValues.push(fastEMA[i] - slowEMA[i]);
  }
  const signalLine = calculateEMA(macdValues, signalPeriod);
  const signal = signalLine[signalLine.length - 1];
  
  // Histogram
  const histogram = macdLine - signal;

  let signalType: 'bullish' | 'bearish' | 'neutral';
  let interpretation: string;

  if (macdLine > signal && histogram > 0) {
    signalType = 'bullish';
    interpretation = `MACD line (${macdLine.toFixed(2)}) is above signal line (${signal.toFixed(2)}). Bullish momentum detected.`;
  } else if (macdLine < signal && histogram < 0) {
    signalType = 'bearish';
    interpretation = `MACD line (${macdLine.toFixed(2)}) is below signal line (${signal.toFixed(2)}). Bearish momentum detected.`;
  } else {
    signalType = 'neutral';
    interpretation = `MACD lines are converging. Momentum is neutral.`;
  }

  return {
    macd: macdLine,
    signal,
    histogram,
    signalType,
    interpretation
  };
}

/**
 * Calculate Bollinger Bands
 * Standard: 20 period, 2 standard deviations
 */
export function calculateBollingerBands(
  data: OHLCVData[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult {
  if (data.length < period) {
    throw new Error(`Insufficient data for Bollinger Bands calculation.`);
  }

  const closes = data.map(d => d.close);
  const sma = calculateSMA(closes, period);
  const middle = sma[sma.length - 1];

  // Calculate standard deviation
  const recentCloses = closes.slice(-period);
  const variance = recentCloses.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const sd = Math.sqrt(variance);

  const upper = middle + (stdDev * sd);
  const lower = middle - (stdDev * sd);
  const currentPrice = closes[closes.length - 1];

  let signal: 'overbought' | 'oversold' | 'neutral';
  let interpretation: string;

  const upperDistance = ((currentPrice - upper) / upper) * 100;
  const lowerDistance = ((lower - currentPrice) / lower) * 100;

  if (currentPrice > upper) {
    signal = 'overbought';
    interpretation = `Price (${currentPrice.toFixed(2)}) is above upper band (${upper.toFixed(2)}). Overbought conditions.`;
  } else if (currentPrice < lower) {
    signal = 'oversold';
    interpretation = `Price (${currentPrice.toFixed(2)}) is below lower band (${lower.toFixed(2)}). Oversold conditions.`;
  } else {
    signal = 'neutral';
    interpretation = `Price (${currentPrice.toFixed(2)}) is within bands. Normal trading range.`;
  }

  return { upper, middle, lower, signal, interpretation };
}

/**
 * Calculate multiple EMAs (9, 21, 50, 200)
 */
export function calculateEMAs(data: OHLCVData[]): EMAResult {
  const closes = data.map(d => d.close);
  
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  const ema9Val = ema9[ema9.length - 1];
  const ema21Val = ema21[ema21.length - 1];
  const ema50Val = ema50[ema50.length - 1];
  const ema200Val = ema200[ema200.length - 1];

  let trend: 'bullish' | 'bearish' | 'neutral';
  let interpretation: string;

  // Check EMA alignment
  if (ema9Val > ema21Val && ema21Val > ema50Val && ema50Val > ema200Val) {
    trend = 'bullish';
    interpretation = `All EMAs are aligned bullishly (9 > 21 > 50 > 200). Strong uptrend.`;
  } else if (ema9Val < ema21Val && ema21Val < ema50Val && ema50Val < ema200Val) {
    trend = 'bearish';
    interpretation = `All EMAs are aligned bearishly (9 < 21 < 50 < 200). Strong downtrend.`;
  } else {
    trend = 'neutral';
    interpretation = `EMAs are mixed. No clear trend direction.`;
  }

  return {
    ema9: ema9Val,
    ema21: ema21Val,
    ema50: ema50Val,
    ema200: ema200Val,
    trend,
    interpretation
  };
}

/**
 * Calculate Stochastic Oscillator
 * Standard: %K = 14, %D = 3
 */
export function calculateStochastic(
  data: OHLCVData[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticResult {
  if (data.length < kPeriod) {
    throw new Error(`Insufficient data for Stochastic calculation.`);
  }

  const recentData = data.slice(-kPeriod);
  const currentClose = data[data.length - 1].close;
  const highestHigh = Math.max(...recentData.map(d => d.high));
  const lowestLow = Math.min(...recentData.map(d => d.low));

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

  // Calculate %D (SMA of %K)
  const kValues: number[] = [];
  for (let i = data.length - dPeriod; i < data.length; i++) {
    const periodData = data.slice(Math.max(0, i - kPeriod + 1), i + 1);
    const close = data[i].close;
    const high = Math.max(...periodData.map(d => d.high));
    const low = Math.min(...periodData.map(d => d.low));
    kValues.push(((close - low) / (high - low)) * 100);
  }
  const d = kValues.reduce((sum, val) => sum + val, 0) / kValues.length;

  let signal: 'overbought' | 'oversold' | 'neutral';
  let interpretation: string;

  if (k > 80 && d > 80) {
    signal = 'overbought';
    interpretation = `Stochastic %K (${k.toFixed(2)}) and %D (${d.toFixed(2)}) are above 80. Overbought.`;
  } else if (k < 20 && d < 20) {
    signal = 'oversold';
    interpretation = `Stochastic %K (${k.toFixed(2)}) and %D (${d.toFixed(2)}) are below 20. Oversold.`;
  } else {
    signal = 'neutral';
    interpretation = `Stochastic %K (${k.toFixed(2)}) and %D (${d.toFixed(2)}) are in neutral range.`;
  }

  return { k, d, signal, interpretation };
}

/**
 * Calculate ATR (Average True Range)
 * Standard: 14 period
 */
export function calculateATR(data: OHLCVData[], period: number = 14): ATRResult {
  if (data.length < period + 1) {
    throw new Error(`Insufficient data for ATR calculation.`);
  }

  const trueRanges: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate ATR as EMA of True Range
  const atr = calculateEMA(trueRanges, period);
  const atrValue = atr[atr.length - 1];
  const currentPrice = data[data.length - 1].close;
  const atrPercent = (atrValue / currentPrice) * 100;

  let volatility: 'high' | 'medium' | 'low';
  let interpretation: string;

  if (atrPercent > 5) {
    volatility = 'high';
    interpretation = `ATR at ${atrValue.toFixed(2)} (${atrPercent.toFixed(2)}% of price). High volatility.`;
  } else if (atrPercent > 2) {
    volatility = 'medium';
    interpretation = `ATR at ${atrValue.toFixed(2)} (${atrPercent.toFixed(2)}% of price). Medium volatility.`;
  } else {
    volatility = 'low';
    interpretation = `ATR at ${atrValue.toFixed(2)} (${atrPercent.toFixed(2)}% of price). Low volatility.`;
  }

  return { value: atrValue, volatility, interpretation };
}

/**
 * Calculate ADX (Average Directional Index)
 * Standard: 14 period
 */
export function calculateADX(data: OHLCVData[], period: number = 14): ADXResult {
  if (data.length < period * 2) {
    throw new Error(`Insufficient data for ADX calculation.`);
  }

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const highDiff = data[i].high - data[i - 1].high;
    const lowDiff = data[i - 1].low - data[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    const trValue = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    tr.push(trValue);
  }

  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);
  const smoothedTR = calculateEMA(tr, period);

  const plusDI = (smoothedPlusDM[smoothedPlusDM.length - 1] / smoothedTR[smoothedTR.length - 1]) * 100;
  const minusDI = (smoothedMinusDM[smoothedMinusDM.length - 1] / smoothedTR[smoothedTR.length - 1]) * 100;

  const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
  const adx = dx; // Simplified; full ADX would smooth DX values

  let trend: 'strong' | 'weak' | 'no_trend';
  let interpretation: string;

  if (adx > 25) {
    trend = 'strong';
    interpretation = `ADX at ${adx.toFixed(2)} indicates a strong trend.`;
  } else if (adx > 20) {
    trend = 'weak';
    interpretation = `ADX at ${adx.toFixed(2)} indicates a weak trend.`;
  } else {
    trend = 'no_trend';
    interpretation = `ADX at ${adx.toFixed(2)} indicates no clear trend.`;
  }

  return { value: adx, trend, interpretation };
}

/**
 * Calculate OBV (On-Balance Volume)
 */
export function calculateOBV(data: OHLCVData[]): OBVResult {
  if (data.length < 2) {
    throw new Error(`Insufficient data for OBV calculation.`);
  }

  let obv = 0;
  const obvValues: number[] = [0];

  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      obv += data[i].volume;
    } else if (data[i].close < data[i - 1].close) {
      obv -= data[i].volume;
    }
    obvValues.push(obv);
  }

  // Determine trend by comparing recent OBV values
  const recentOBV = obvValues.slice(-10);
  const obvTrend = recentOBV[recentOBV.length - 1] - recentOBV[0];

  let trend: 'bullish' | 'bearish' | 'neutral';
  let interpretation: string;

  if (obvTrend > 0) {
    trend = 'bullish';
    interpretation = `OBV at ${obv.toFixed(0)} is trending up. Volume supports price increase.`;
  } else if (obvTrend < 0) {
    trend = 'bearish';
    interpretation = `OBV at ${obv.toFixed(0)} is trending down. Volume supports price decrease.`;
  } else {
    trend = 'neutral';
    interpretation = `OBV at ${obv.toFixed(0)} is flat. No clear volume trend.`;
  }

  return { value: obv, trend, interpretation };
}

/**
 * Calculate Fibonacci Retracement Levels
 */
export function calculateFibonacci(data: OHLCVData[]): FibonacciResult {
  if (data.length < 20) {
    throw new Error(`Insufficient data for Fibonacci calculation.`);
  }

  // Find swing high and low in recent data
  const recentData = data.slice(-50);
  const high = Math.max(...recentData.map(d => d.high));
  const low = Math.min(...recentData.map(d => d.low));
  const diff = high - low;

  const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const levels = fibLevels.map(level => ({
    level,
    price: high - (diff * level),
    label: `${(level * 100).toFixed(1)}%`
  }));

  const currentPrice = data[data.length - 1].close;
  
  // Find closest level
  let closestLevel = levels[0];
  let minDistance = Math.abs(currentPrice - closestLevel.price);
  
  for (const level of levels) {
    const distance = Math.abs(currentPrice - level.price);
    if (distance < minDistance) {
      minDistance = distance;
      closestLevel = level;
    }
  }

  const interpretation = `Current price ${currentPrice.toFixed(2)} is near ${closestLevel.label} Fibonacci level (${closestLevel.price.toFixed(2)}).`;

  return {
    levels,
    currentLevel: closestLevel.label,
    interpretation
  };
}

/**
 * Calculate Ichimoku Cloud
 */
export function calculateIchimoku(data: OHLCVData[]): IchimokuResult {
  if (data.length < 52) {
    throw new Error(`Insufficient data for Ichimoku calculation.`);
  }

  // Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
  const tenkanData = data.slice(-9);
  const tenkanHigh = Math.max(...tenkanData.map(d => d.high));
  const tenkanLow = Math.min(...tenkanData.map(d => d.low));
  const tenkanSen = (tenkanHigh + tenkanLow) / 2;

  // Kijun-sen (Base Line): (26-period high + 26-period low) / 2
  const kijunData = data.slice(-26);
  const kijunHigh = Math.max(...kijunData.map(d => d.high));
  const kijunLow = Math.min(...kijunData.map(d => d.low));
  const kijunSen = (kijunHigh + kijunLow) / 2;

  // Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2
  const senkouSpanA = (tenkanSen + kijunSen) / 2;

  // Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2
  const senkouData = data.slice(-52);
  const senkouHigh = Math.max(...senkouData.map(d => d.high));
  const senkouLow = Math.min(...senkouData.map(d => d.low));
  const senkouSpanB = (senkouHigh + senkouLow) / 2;

  // Chikou Span (Lagging Span): Current close plotted 26 periods back
  const chikouSpan = data[data.length - 1].close;

  const currentPrice = data[data.length - 1].close;

  let signal: 'bullish' | 'bearish' | 'neutral';
  let cloud: 'bullish' | 'bearish';
  let interpretation: string;

  // Determine cloud color
  cloud = senkouSpanA > senkouSpanB ? 'bullish' : 'bearish';

  // Determine signal
  if (currentPrice > senkouSpanA && currentPrice > senkouSpanB && tenkanSen > kijunSen) {
    signal = 'bullish';
    interpretation = `Price above cloud and Tenkan above Kijun. Strong bullish signal.`;
  } else if (currentPrice < senkouSpanA && currentPrice < senkouSpanB && tenkanSen < kijunSen) {
    signal = 'bearish';
    interpretation = `Price below cloud and Tenkan below Kijun. Strong bearish signal.`;
  } else {
    signal = 'neutral';
    interpretation = `Price within cloud or mixed signals. Neutral.`;
  }

  return {
    tenkanSen,
    kijunSen,
    senkouSpanA,
    senkouSpanB,
    chikouSpan,
    signal,
    cloud,
    interpretation
  };
}

/**
 * Calculate Volume Profile
 */
export function calculateVolumeProfile(data: OHLCVData[]): VolumeProfileResult {
  if (data.length < 20) {
    throw new Error(`Insufficient data for Volume Profile calculation.`);
  }

  // Create price bins
  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const binCount = 20;
  const binSize = (maxPrice - minPrice) / binCount;

  const volumeByPrice: Map<number, number> = new Map();

  // Aggregate volume by price level
  for (const candle of data) {
    const bin = Math.floor((candle.close - minPrice) / binSize);
    const priceLevel = minPrice + (bin * binSize);
    volumeByPrice.set(priceLevel, (volumeByPrice.get(priceLevel) || 0) + candle.volume);
  }

  // Find POC (Point of Control) - price level with highest volume
  let maxVolume = 0;
  let poc = 0;
  
  for (const [price, volume] of volumeByPrice.entries()) {
    if (volume > maxVolume) {
      maxVolume = volume;
      poc = price;
    }
  }

  // Calculate Value Area (70% of volume)
  const totalVolume = Array.from(volumeByPrice.values()).reduce((sum, vol) => sum + vol, 0);
  const targetVolume = totalVolume * 0.7;

  const sortedLevels = Array.from(volumeByPrice.entries())
    .sort((a, b) => b[1] - a[1]);

  let accumulatedVolume = 0;
  const valueAreaPrices: number[] = [];

  for (const [price, volume] of sortedLevels) {
    valueAreaPrices.push(price);
    accumulatedVolume += volume;
    if (accumulatedVolume >= targetVolume) break;
  }

  const vah = Math.max(...valueAreaPrices);
  const val = Math.min(...valueAreaPrices);

  const interpretation = `POC at ${poc.toFixed(2)}, Value Area: ${val.toFixed(2)} - ${vah.toFixed(2)}. 70% of volume traded in this range.`;

  return { poc, vah, val, interpretation };
}

/**
 * Helper: Calculate Simple Moving Average
 */
function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  
  return sma;
}

/**
 * Helper: Calculate Exponential Moving Average
 */
function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA
  const sma = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  ema.push(sma);

  // Calculate EMA
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }

  return ema;
}
