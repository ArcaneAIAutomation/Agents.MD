/**
 * Multi-Timeframe Technical Analysis
 * Analyzes indicators across multiple timeframes and generates consensus signals
 * Requirements: 7.3
 */

import {
  OHLCVData,
  calculateRSI,
  calculateMACD,
  calculateEMAs,
  calculateStochastic,
  calculateADX
} from './technicalIndicators';

export type Timeframe = '15m' | '1h' | '4h' | '1d' | '1w';
export type Signal = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';

export interface TimeframeAnalysis {
  timeframe: Timeframe;
  signal: Signal;
  confidence: number; // 0-100
  indicators: {
    rsi: number;
    macdSignal: 'bullish' | 'bearish' | 'neutral';
    emaTrend: 'bullish' | 'bearish' | 'neutral';
    stochasticSignal: 'overbought' | 'oversold' | 'neutral';
    adxStrength: 'strong' | 'weak' | 'no_trend';
  };
  reasoning: string;
}

export interface MultiTimeframeConsensus {
  timeframes: {
    '15m': TimeframeAnalysis;
    '1h': TimeframeAnalysis;
    '4h': TimeframeAnalysis;
    '1d': TimeframeAnalysis;
    '1w': TimeframeAnalysis;
  };
  overall: {
    signal: Signal;
    confidence: number;
    agreement: number; // Percentage of timeframes agreeing
    shortTerm: Signal; // 15m, 1h
    mediumTerm: Signal; // 4h, 1d
    longTerm: Signal; // 1w
  };
  summary: string;
}

/**
 * Fetch OHLCV data for a specific timeframe
 */
export async function fetchOHLCVData(
  symbol: string,
  timeframe: Timeframe,
  limit: number = 200
): Promise<OHLCVData[]> {
  try {
    // Determine interval parameter for API
    const intervalMap: Record<Timeframe, string> = {
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w'
    };

    const interval = intervalMap[timeframe];

    // Try CoinGecko first
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/ohlc?vs_currency=usd&days=${getDaysForTimeframe(timeframe)}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return convertCoinGeckoToOHLCV(data);
      }
    } catch (error) {
      console.warn('CoinGecko OHLCV fetch failed, trying Binance:', error);
    }

    // Fallback to Binance
    const binanceSymbol = `${symbol.toUpperCase()}USDT`;
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch OHLCV data: ${response.status}`);
    }

    const data = await response.json();
    return convertBinanceToOHLCV(data);
  } catch (error) {
    console.error(`Error fetching OHLCV data for ${symbol} ${timeframe}:`, error);
    throw error;
  }
}

/**
 * Analyze a single timeframe
 */
export function analyzeTimeframe(
  data: OHLCVData[],
  timeframe: Timeframe
): TimeframeAnalysis {
  // Calculate indicators
  const rsi = calculateRSI(data);
  const macd = calculateMACD(data);
  const ema = calculateEMAs(data);
  const stochastic = calculateStochastic(data);
  const adx = calculateADX(data);

  // Score each indicator
  let bullishScore = 0;
  let bearishScore = 0;
  const reasons: string[] = [];

  // RSI scoring
  if (rsi.value < 30) {
    bullishScore += 2;
    reasons.push('RSI oversold');
  } else if (rsi.value > 70) {
    bearishScore += 2;
    reasons.push('RSI overbought');
  } else if (rsi.value > 50) {
    bullishScore += 0.5;
  } else {
    bearishScore += 0.5;
  }

  // MACD scoring
  if (macd.signalType === 'bullish') {
    bullishScore += 2;
    reasons.push('MACD bullish');
  } else if (macd.signalType === 'bearish') {
    bearishScore += 2;
    reasons.push('MACD bearish');
  }

  // EMA scoring
  if (ema.trend === 'bullish') {
    bullishScore += 3;
    reasons.push('EMAs bullish');
  } else if (ema.trend === 'bearish') {
    bearishScore += 3;
    reasons.push('EMAs bearish');
  }

  // Stochastic scoring
  if (stochastic.signal === 'oversold') {
    bullishScore += 1;
    reasons.push('Stochastic oversold');
  } else if (stochastic.signal === 'overbought') {
    bearishScore += 1;
    reasons.push('Stochastic overbought');
  }

  // ADX amplification (if strong trend, amplify signals)
  if (adx.trend === 'strong') {
    if (bullishScore > bearishScore) {
      bullishScore += 1;
      reasons.push('Strong trend (ADX)');
    } else if (bearishScore > bullishScore) {
      bearishScore += 1;
      reasons.push('Strong trend (ADX)');
    }
  }

  // Determine signal
  const netScore = bullishScore - bearishScore;
  const totalScore = bullishScore + bearishScore;
  const confidence = totalScore > 0 ? (Math.abs(netScore) / totalScore) * 100 : 50;

  let signal: Signal;
  if (netScore >= 4) {
    signal = 'strong_buy';
  } else if (netScore >= 1.5) {
    signal = 'buy';
  } else if (netScore <= -4) {
    signal = 'strong_sell';
  } else if (netScore <= -1.5) {
    signal = 'sell';
  } else {
    signal = 'neutral';
  }

  return {
    timeframe,
    signal,
    confidence: Math.round(confidence),
    indicators: {
      rsi: rsi.value,
      macdSignal: macd.signalType,
      emaTrend: ema.trend,
      stochasticSignal: stochastic.signal,
      adxStrength: adx.trend
    },
    reasoning: reasons.join(', ')
  };
}

/**
 * Perform multi-timeframe analysis
 */
export async function performMultiTimeframeAnalysis(
  symbol: string
): Promise<MultiTimeframeConsensus> {
  const timeframes: Timeframe[] = ['15m', '1h', '4h', '1d', '1w'];
  const analyses: Record<Timeframe, TimeframeAnalysis> = {} as any;

  // Fetch and analyze each timeframe
  for (const timeframe of timeframes) {
    try {
      const data = await fetchOHLCVData(symbol, timeframe);
      analyses[timeframe] = analyzeTimeframe(data, timeframe);
    } catch (error) {
      console.error(`Failed to analyze ${timeframe}:`, error);
      // Create neutral analysis as fallback
      analyses[timeframe] = {
        timeframe,
        signal: 'neutral',
        confidence: 0,
        indicators: {
          rsi: 50,
          macdSignal: 'neutral',
          emaTrend: 'neutral',
          stochasticSignal: 'neutral',
          adxStrength: 'no_trend'
        },
        reasoning: 'Data unavailable'
      };
    }
  }

  // Calculate consensus
  const overall = calculateConsensus(analyses);

  // Generate summary
  const summary = generateConsensusSummary(analyses, overall);

  return {
    timeframes: analyses,
    overall,
    summary
  };
}

/**
 * Calculate overall consensus from timeframe analyses
 */
function calculateConsensus(
  analyses: Record<Timeframe, TimeframeAnalysis>
): MultiTimeframeConsensus['overall'] {
  const timeframes: Timeframe[] = ['15m', '1h', '4h', '1d', '1w'];
  
  // Convert signals to numeric scores
  const signalScores: Record<Signal, number> = {
    'strong_buy': 2,
    'buy': 1,
    'neutral': 0,
    'sell': -1,
    'strong_sell': -2
  };

  // Calculate weighted average (longer timeframes have more weight)
  const weights: Record<Timeframe, number> = {
    '15m': 1,
    '1h': 1.5,
    '4h': 2,
    '1d': 2.5,
    '1w': 3
  };

  let weightedSum = 0;
  let totalWeight = 0;
  let confidenceSum = 0;

  for (const tf of timeframes) {
    const analysis = analyses[tf];
    const score = signalScores[analysis.signal];
    const weight = weights[tf];
    
    weightedSum += score * weight * (analysis.confidence / 100);
    totalWeight += weight;
    confidenceSum += analysis.confidence;
  }

  const avgScore = weightedSum / totalWeight;
  const avgConfidence = confidenceSum / timeframes.length;

  // Determine overall signal
  let overallSignal: Signal;
  if (avgScore >= 1.5) {
    overallSignal = 'strong_buy';
  } else if (avgScore >= 0.5) {
    overallSignal = 'buy';
  } else if (avgScore <= -1.5) {
    overallSignal = 'strong_sell';
  } else if (avgScore <= -0.5) {
    overallSignal = 'sell';
  } else {
    overallSignal = 'neutral';
  }

  // Calculate agreement percentage
  const signalCounts: Record<Signal, number> = {
    'strong_buy': 0,
    'buy': 0,
    'neutral': 0,
    'sell': 0,
    'strong_sell': 0
  };

  for (const tf of timeframes) {
    signalCounts[analyses[tf].signal]++;
  }

  const maxCount = Math.max(...Object.values(signalCounts));
  const agreement = (maxCount / timeframes.length) * 100;

  // Calculate term-specific signals
  const shortTerm = calculateTermSignal([analyses['15m'], analyses['1h']]);
  const mediumTerm = calculateTermSignal([analyses['4h'], analyses['1d']]);
  const longTerm = analyses['1w'].signal;

  return {
    signal: overallSignal,
    confidence: Math.round(avgConfidence),
    agreement: Math.round(agreement),
    shortTerm,
    mediumTerm,
    longTerm
  };
}

/**
 * Calculate signal for a specific term (short/medium)
 */
function calculateTermSignal(analyses: TimeframeAnalysis[]): Signal {
  const signalScores: Record<Signal, number> = {
    'strong_buy': 2,
    'buy': 1,
    'neutral': 0,
    'sell': -1,
    'strong_sell': -2
  };

  const avgScore = analyses.reduce((sum, a) => sum + signalScores[a.signal], 0) / analyses.length;

  if (avgScore >= 1.5) return 'strong_buy';
  if (avgScore >= 0.5) return 'buy';
  if (avgScore <= -1.5) return 'strong_sell';
  if (avgScore <= -0.5) return 'sell';
  return 'neutral';
}

/**
 * Generate human-readable consensus summary
 */
function generateConsensusSummary(
  analyses: Record<Timeframe, TimeframeAnalysis>,
  overall: MultiTimeframeConsensus['overall']
): string {
  const signalLabels: Record<Signal, string> = {
    'strong_buy': 'Strong Buy',
    'buy': 'Buy',
    'neutral': 'Neutral',
    'sell': 'Sell',
    'strong_sell': 'Strong Sell'
  };

  let summary = `Multi-timeframe analysis shows ${signalLabels[overall.signal]} signal with ${overall.confidence}% confidence. `;
  summary += `${overall.agreement}% of timeframes agree. `;

  // Add term-specific insights
  if (overall.shortTerm !== overall.longTerm) {
    summary += `Short-term (${signalLabels[overall.shortTerm]}) diverges from long-term (${signalLabels[overall.longTerm]}). `;
  } else {
    summary += `All timeframes aligned ${signalLabels[overall.shortTerm]}. `;
  }

  // Highlight strongest timeframe
  const timeframes: Timeframe[] = ['15m', '1h', '4h', '1d', '1w'];
  let strongestTF = timeframes[0];
  let highestConfidence = analyses[timeframes[0]].confidence;

  for (const tf of timeframes) {
    if (analyses[tf].confidence > highestConfidence) {
      highestConfidence = analyses[tf].confidence;
      strongestTF = tf;
    }
  }

  summary += `Strongest signal on ${strongestTF} timeframe (${highestConfidence}% confidence).`;

  return summary;
}

/**
 * Helper: Get number of days for CoinGecko API based on timeframe
 */
function getDaysForTimeframe(timeframe: Timeframe): number {
  const daysMap: Record<Timeframe, number> = {
    '15m': 1,
    '1h': 2,
    '4h': 7,
    '1d': 90,
    '1w': 365
  };
  return daysMap[timeframe];
}

/**
 * Helper: Convert CoinGecko OHLC data to standard format
 */
function convertCoinGeckoToOHLCV(data: any[]): OHLCVData[] {
  return data.map(candle => ({
    timestamp: candle[0],
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: 0 // CoinGecko OHLC doesn't include volume
  }));
}

/**
 * Helper: Convert Binance klines to standard format
 */
function convertBinanceToOHLCV(data: any[]): OHLCVData[] {
  return data.map(candle => ({
    timestamp: candle[0],
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5])
  }));
}
