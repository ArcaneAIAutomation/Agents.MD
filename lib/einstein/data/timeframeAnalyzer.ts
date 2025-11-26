/**
 * Einstein Multi-Timeframe Analysis Module
 * 
 * Analyzes market trends across multiple timeframes (15m, 1h, 4h, 1d) to determine
 * trend alignment and calculate confidence scores based on timeframe consensus.
 * 
 * Requirements: 7.1, 7.2
 */

import type {
  Timeframe,
  TrendDirection,
  TimeframeAlignment,
  TechnicalIndicators,
  MarketData
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const TIMEFRAMES: Timeframe[] = ['15m', '1h', '4h', '1d'];

// Timeframe weights for alignment calculation (longer timeframes have more weight)
const TIMEFRAME_WEIGHTS: Record<Timeframe, number> = {
  '15m': 1,
  '1h': 2,
  '4h': 3,
  '1d': 4
};

// API timeout for each timeframe fetch
const FETCH_TIMEOUT = 10000; // 10 seconds

// ============================================================================
// Multi-Timeframe Analyzer
// ============================================================================

export class TimeframeAnalyzer {
  private symbol: string;

  constructor(symbol: string) {
    this.symbol = symbol.toUpperCase();
  }

  /**
   * Analyze trends across all timeframes and calculate alignment
   * Requirement 7.1: Analyze 15-minute, 1-hour, 4-hour, and 1-day timeframes
   * Requirement 7.2: Display trend alignment across timeframes
   */
  async analyzeAllTimeframes(): Promise<TimeframeAlignment> {
    console.log(`[Einstein] Starting multi-timeframe analysis for ${this.symbol}...`);
    
    // Fetch data for all timeframes in parallel
    const timeframePromises = TIMEFRAMES.map(tf => 
      this.analyzeTimeframe(tf).catch(error => {
        console.error(`[Einstein] Failed to analyze ${tf} timeframe:`, error);
        return { timeframe: tf, trend: 'NEUTRAL' as TrendDirection };
      })
    );

    const results = await Promise.all(timeframePromises);

    // Build timeframe alignment object
    const alignment: TimeframeAlignment = {
      '15m': results[0].trend,
      '1h': results[1].trend,
      '4h': results[2].trend,
      '1d': results[3].trend,
      alignment: this.calculateAlignmentScore(results)
    };

    console.log(`[Einstein] Multi-timeframe analysis complete. Alignment: ${alignment.alignment}%`);
    console.log(`[Einstein] Trends: 15m=${alignment['15m']}, 1h=${alignment['1h']}, 4h=${alignment['4h']}, 1d=${alignment['1d']}`);

    return alignment;
  }

  /**
   * Analyze a single timeframe and determine trend
   * Requirement 7.1: Calculate indicators for each timeframe
   */
  private async analyzeTimeframe(timeframe: Timeframe): Promise<{ timeframe: Timeframe; trend: TrendDirection }> {
    // Fetch historical data for this timeframe
    const historicalData = await this.fetchTimeframeData(timeframe);
    
    // Calculate technical indicators
    const indicators = await this.calculateTimeframeIndicators(historicalData, timeframe);
    
    // Determine trend based on indicators
    const trend = this.determineTrend(indicators, historicalData);
    
    return { timeframe, trend };
  }

  /**
   * Fetch historical price data for a specific timeframe
   * Requirement 7.1: Implement timeframe data fetching
   */
  private async fetchTimeframeData(timeframe: Timeframe): Promise<number[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      // Determine number of candles needed based on timeframe
      const candleCount = this.getCandleCount(timeframe);
      
      // Fetch from CoinGecko (supports multiple timeframes)
      const coinId = this.getCoinGeckoId(this.symbol);
      const days = this.getTimeframeDays(timeframe);
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${this.getInterval(timeframe)}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract prices from the response
      const prices = data.prices.map((p: [number, number]) => p[1]);
      
      // Return the most recent candles
      return prices.slice(-candleCount);
    } catch (error) {
      console.error(`[Einstein] Failed to fetch ${timeframe} data:`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Calculate technical indicators for a specific timeframe
   * Requirement 7.1: Calculate indicators for each timeframe
   */
  private async calculateTimeframeIndicators(
    prices: number[],
    timeframe: Timeframe
  ): Promise<TechnicalIndicators> {
    if (prices.length < 50) {
      throw new Error(`Insufficient data for ${timeframe} analysis (need at least 50 candles)`);
    }

    return {
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      ema: this.calculateEMAs(prices),
      bollingerBands: this.calculateBollingerBands(prices),
      atr: this.calculateATR(prices),
      stochastic: this.calculateStochastic(prices)
    };
  }

  /**
   * Determine trend direction based on technical indicators
   * Requirement 7.1: Determine trend for each timeframe (BULLISH/BEARISH/NEUTRAL)
   */
  private determineTrend(indicators: TechnicalIndicators, prices: number[]): TrendDirection {
    let bullishSignals = 0;
    let bearishSignals = 0;
    const totalSignals = 6; // Number of indicators we're checking

    // 1. RSI Analysis
    if (indicators.rsi > 50 && indicators.rsi < 70) {
      bullishSignals++;
    } else if (indicators.rsi < 50 && indicators.rsi > 30) {
      bearishSignals++;
    }

    // 2. MACD Analysis
    if (indicators.macd.histogram > 0 && indicators.macd.value > indicators.macd.signal) {
      bullishSignals++;
    } else if (indicators.macd.histogram < 0 && indicators.macd.value < indicators.macd.signal) {
      bearishSignals++;
    }

    // 3. EMA Analysis (trend following)
    const currentPrice = prices[prices.length - 1];
    if (currentPrice > indicators.ema.ema9 && 
        indicators.ema.ema9 > indicators.ema.ema21 && 
        indicators.ema.ema21 > indicators.ema.ema50) {
      bullishSignals++;
    } else if (currentPrice < indicators.ema.ema9 && 
               indicators.ema.ema9 < indicators.ema.ema21 && 
               indicators.ema.ema21 < indicators.ema.ema50) {
      bearishSignals++;
    }

    // 4. Bollinger Bands Analysis
    const bbPosition = (currentPrice - indicators.bollingerBands.lower) / 
                       (indicators.bollingerBands.upper - indicators.bollingerBands.lower);
    if (bbPosition > 0.5 && bbPosition < 0.8) {
      bullishSignals++;
    } else if (bbPosition < 0.5 && bbPosition > 0.2) {
      bearishSignals++;
    }

    // 5. Stochastic Analysis
    if (indicators.stochastic.k > indicators.stochastic.d && indicators.stochastic.k < 80) {
      bullishSignals++;
    } else if (indicators.stochastic.k < indicators.stochastic.d && indicators.stochastic.k > 20) {
      bearishSignals++;
    }

    // 6. Price momentum (simple trend check)
    const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
    if (priceChange > 0.01) { // 1% increase
      bullishSignals++;
    } else if (priceChange < -0.01) { // 1% decrease
      bearishSignals++;
    }

    // Determine overall trend based on signal consensus
    const bullishPercentage = (bullishSignals / totalSignals) * 100;
    const bearishPercentage = (bearishSignals / totalSignals) * 100;

    // Require at least 60% consensus for a clear trend
    if (bullishPercentage >= 60) {
      return 'BULLISH';
    } else if (bearishPercentage >= 60) {
      return 'BEARISH';
    } else {
      return 'NEUTRAL';
    }
  }

  /**
   * Calculate alignment score across all timeframes
   * Requirement 7.2: Calculate timeframe alignment score
   */
  private calculateAlignmentScore(
    results: Array<{ timeframe: Timeframe; trend: TrendDirection }>
  ): number {
    // Count trends
    const trendCounts: Record<TrendDirection, number> = {
      'BULLISH': 0,
      'BEARISH': 0,
      'NEUTRAL': 0
    };

    let totalWeight = 0;
    let alignedWeight = 0;

    // Count weighted trends
    results.forEach(result => {
      const weight = TIMEFRAME_WEIGHTS[result.timeframe];
      totalWeight += weight;
      trendCounts[result.trend] += weight;
    });

    // Find dominant trend (excluding NEUTRAL)
    const dominantTrend = trendCounts.BULLISH > trendCounts.BEARISH ? 'BULLISH' : 'BEARISH';
    alignedWeight = trendCounts[dominantTrend];

    // Calculate alignment percentage
    // If all timeframes are NEUTRAL, alignment is 0%
    if (trendCounts.NEUTRAL === totalWeight) {
      return 0;
    }

    // Calculate alignment as percentage of weighted consensus
    const alignment = (alignedWeight / totalWeight) * 100;

    return Math.round(alignment);
  }

  // ============================================================================
  // Technical Indicator Calculations
  // ============================================================================

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      return 50; // Neutral if insufficient data
    }

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Math.round(rsi * 100) / 100;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    // Calculate signal line (9-period EMA of MACD)
    const macdValues = [];
    for (let i = 26; i < prices.length; i++) {
      const ema12Val = this.calculateEMA(prices.slice(0, i + 1), 12);
      const ema26Val = this.calculateEMA(prices.slice(0, i + 1), 26);
      macdValues.push(ema12Val - ema26Val);
    }
    
    const signalLine = this.calculateEMA(macdValues, 9);
    const histogram = macdLine - signalLine;

    return {
      value: Math.round(macdLine * 100) / 100,
      signal: Math.round(signalLine * 100) / 100,
      histogram: Math.round(histogram * 100) / 100
    };
  }

  /**
   * Calculate multiple EMAs
   */
  private calculateEMAs(prices: number[]): { ema9: number; ema21: number; ema50: number; ema200: number } {
    return {
      ema9: this.calculateEMA(prices, 9),
      ema21: this.calculateEMA(prices, 21),
      ema50: this.calculateEMA(prices, 50),
      ema200: prices.length >= 200 ? this.calculateEMA(prices, 200) : this.calculateEMA(prices, prices.length)
    };
  }

  /**
   * Calculate single EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
      period = prices.length;
    }

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return Math.round(ema * 100) / 100;
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number;
    middle: number;
    lower: number;
  } {
    if (prices.length < period) {
      const currentPrice = prices[prices.length - 1];
      return { upper: currentPrice, middle: currentPrice, lower: currentPrice };
    }

    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((a, b) => a + b, 0) / period;

    const squaredDiffs = recentPrices.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: Math.round((sma + stdDev * standardDeviation) * 100) / 100,
      middle: Math.round(sma * 100) / 100,
      lower: Math.round((sma - stdDev * standardDeviation) * 100) / 100
    };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  private calculateATR(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      return 0;
    }

    const trueRanges = [];
    for (let i = 1; i < prices.length; i++) {
      const high = Math.max(prices[i], prices[i - 1]);
      const low = Math.min(prices[i], prices[i - 1]);
      const tr = high - low;
      trueRanges.push(tr);
    }

    const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
    return Math.round(atr * 100) / 100;
  }

  /**
   * Calculate Stochastic Oscillator
   */
  private calculateStochastic(prices: number[], period: number = 14): { k: number; d: number } {
    if (prices.length < period) {
      return { k: 50, d: 50 };
    }

    const recentPrices = prices.slice(-period);
    const currentPrice = prices[prices.length - 1];
    const lowestLow = Math.min(...recentPrices);
    const highestHigh = Math.max(...recentPrices);

    const k = ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100;

    // Calculate %D (3-period SMA of %K)
    const kValues = [];
    for (let i = period; i <= prices.length; i++) {
      const slice = prices.slice(i - period, i);
      const current = prices[i - 1];
      const low = Math.min(...slice);
      const high = Math.max(...slice);
      kValues.push(((current - low) / (high - low)) * 100);
    }

    const d = kValues.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, kValues.length);

    return {
      k: Math.round(k * 100) / 100,
      d: Math.round(d * 100) / 100
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get number of candles needed for analysis based on timeframe
   */
  private getCandleCount(timeframe: Timeframe): number {
    const counts: Record<Timeframe, number> = {
      '15m': 200, // ~50 hours of data
      '1h': 200,  // ~8 days of data
      '4h': 200,  // ~33 days of data
      '1d': 200   // ~200 days of data
    };
    return counts[timeframe];
  }

  /**
   * Get number of days to fetch based on timeframe
   */
  private getTimeframeDays(timeframe: Timeframe): number {
    const days: Record<Timeframe, number> = {
      '15m': 3,   // 3 days for 15-minute candles
      '1h': 10,   // 10 days for 1-hour candles
      '4h': 35,   // 35 days for 4-hour candles
      '1d': 200   // 200 days for daily candles
    };
    return days[timeframe];
  }

  /**
   * Get CoinGecko interval parameter based on timeframe
   */
  private getInterval(timeframe: Timeframe): string {
    const intervals: Record<Timeframe, string> = {
      '15m': 'minutely',
      '1h': 'hourly',
      '4h': 'hourly',
      '1d': 'daily'
    };
    return intervals[timeframe];
  }

  /**
   * Get CoinGecko coin ID from symbol
   */
  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'DOGE': 'dogecoin',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink'
    };
    return mapping[symbol] || symbol.toLowerCase();
  }
}
