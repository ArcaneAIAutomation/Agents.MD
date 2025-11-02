/**
 * Historical Pattern Matching for UCIE
 * 
 * Identifies chart patterns and matches them against historical occurrences
 * Calculates similarity scores and predicts outcomes based on historical data
 */

export interface ChartPattern {
  type: 'head_and_shoulders' | 'inverse_head_and_shoulders' | 'double_top' | 'double_bottom' | 
        'ascending_triangle' | 'descending_triangle' | 'symmetrical_triangle' | 
        'bull_flag' | 'bear_flag' | 'rising_wedge' | 'falling_wedge';
  confidence: number; // 0-100
  startIndex: number;
  endIndex: number;
  keyLevels: number[];
  description: string;
  bullish: boolean;
}

export interface HistoricalMatch {
  patternType: string;
  similarity: number; // 0-100
  historicalDate: string;
  priceChange1d: number;
  priceChange7d: number;
  priceChange30d: number;
  outcome: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

export interface PatternMatchingResult {
  currentPattern: ChartPattern | null;
  historicalMatches: HistoricalMatch[];
  probability: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  expectedOutcome: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

/**
 * Normalize price data to 0-100 scale for pattern comparison
 */
function normalizePrices(prices: number[]): number[] {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  
  if (range === 0) return prices.map(() => 50);
  
  return prices.map(price => ((price - min) / range) * 100);
}

/**
 * Calculate similarity between two price sequences using Dynamic Time Warping
 */
function calculateSimilarity(sequence1: number[], sequence2: number[]): number {
  const n = sequence1.length;
  const m = sequence2.length;
  
  // Create DTW matrix
  const dtw: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(Infinity));
  dtw[0][0] = 0;
  
  // Fill DTW matrix
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.abs(sequence1[i - 1] - sequence2[j - 1]);
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j],     // insertion
        dtw[i][j - 1],     // deletion
        dtw[i - 1][j - 1]  // match
      );
    }
  }
  
  // Convert distance to similarity score (0-100)
  const maxDistance = Math.max(n, m) * 100; // Maximum possible distance
  const distance = dtw[n][m];
  const similarity = Math.max(0, 100 - (distance / maxDistance) * 100);
  
  return similarity;
}

/**
 * Detect Head and Shoulders pattern
 */
function detectHeadAndShoulders(prices: number[]): ChartPattern | null {
  if (prices.length < 20) return null;
  
  const normalized = normalizePrices(prices);
  const n = normalized.length;
  
  // Look for pattern in last 20-50 candles
  for (let i = Math.max(0, n - 50); i < n - 20; i++) {
    const window = normalized.slice(i, i + 20);
    
    // Find peaks and troughs
    const peaks: number[] = [];
    const troughs: number[] = [];
    
    for (let j = 1; j < window.length - 1; j++) {
      if (window[j] > window[j - 1] && window[j] > window[j + 1]) {
        peaks.push(j);
      }
      if (window[j] < window[j - 1] && window[j] < window[j + 1]) {
        troughs.push(j);
      }
    }
    
    // Head and shoulders needs 3 peaks and 2 troughs
    if (peaks.length >= 3 && troughs.length >= 2) {
      const [leftShoulder, head, rightShoulder] = peaks.slice(0, 3);
      
      // Validate pattern structure
      const headHeight = window[head];
      const leftShoulderHeight = window[leftShoulder];
      const rightShoulderHeight = window[rightShoulder];
      
      // Head should be higher than shoulders
      if (headHeight > leftShoulderHeight && headHeight > rightShoulderHeight) {
        // Shoulders should be roughly equal
        const shoulderDiff = Math.abs(leftShoulderHeight - rightShoulderHeight);
        
        if (shoulderDiff < 15) { // Within 15% tolerance
          const confidence = Math.max(60, 100 - shoulderDiff * 2);
          
          return {
            type: 'head_and_shoulders',
            confidence: Math.round(confidence),
            startIndex: i,
            endIndex: i + 20,
            keyLevels: [
              prices[i + leftShoulder],
              prices[i + head],
              prices[i + rightShoulder]
            ],
            description: 'Head and Shoulders pattern detected - typically bearish reversal',
            bullish: false
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Detect Double Top pattern
 */
function detectDoubleTop(prices: number[]): ChartPattern | null {
  if (prices.length < 15) return null;
  
  const normalized = normalizePrices(prices);
  const n = normalized.length;
  
  // Look for pattern in last 15-40 candles
  for (let i = Math.max(0, n - 40); i < n - 15; i++) {
    const window = normalized.slice(i, i + 15);
    
    // Find peaks
    const peaks: number[] = [];
    for (let j = 1; j < window.length - 1; j++) {
      if (window[j] > window[j - 1] && window[j] > window[j + 1]) {
        peaks.push(j);
      }
    }
    
    // Double top needs 2 peaks
    if (peaks.length >= 2) {
      const [peak1, peak2] = peaks.slice(0, 2);
      const peak1Height = window[peak1];
      const peak2Height = window[peak2];
      
      // Peaks should be roughly equal
      const peakDiff = Math.abs(peak1Height - peak2Height);
      
      if (peakDiff < 10) { // Within 10% tolerance
        const confidence = Math.max(65, 100 - peakDiff * 3);
        
        return {
          type: 'double_top',
          confidence: Math.round(confidence),
          startIndex: i,
          endIndex: i + 15,
          keyLevels: [prices[i + peak1], prices[i + peak2]],
          description: 'Double Top pattern detected - typically bearish reversal',
          bullish: false
        };
      }
    }
  }
  
  return null;
}

/**
 * Detect Triangle patterns (ascending, descending, symmetrical)
 */
function detectTriangle(prices: number[]): ChartPattern | null {
  if (prices.length < 20) return null;
  
  const normalized = normalizePrices(prices);
  const n = normalized.length;
  
  // Analyze last 20-30 candles
  const window = normalized.slice(Math.max(0, n - 30));
  
  // Find highs and lows
  const highs: number[] = [];
  const lows: number[] = [];
  
  for (let i = 1; i < window.length - 1; i++) {
    if (window[i] > window[i - 1] && window[i] > window[i + 1]) {
      highs.push(window[i]);
    }
    if (window[i] < window[i - 1] && window[i] < window[i + 1]) {
      lows.push(window[i]);
    }
  }
  
  if (highs.length < 2 || lows.length < 2) return null;
  
  // Calculate trend lines
  const highTrend = (highs[highs.length - 1] - highs[0]) / highs.length;
  const lowTrend = (lows[lows.length - 1] - lows[0]) / lows.length;
  
  // Ascending triangle: flat top, rising bottom
  if (Math.abs(highTrend) < 2 && lowTrend > 1) {
    return {
      type: 'ascending_triangle',
      confidence: 75,
      startIndex: n - 30,
      endIndex: n,
      keyLevels: [Math.max(...highs), Math.min(...lows)],
      description: 'Ascending Triangle pattern - typically bullish continuation',
      bullish: true
    };
  }
  
  // Descending triangle: falling top, flat bottom
  if (highTrend < -1 && Math.abs(lowTrend) < 2) {
    return {
      type: 'descending_triangle',
      confidence: 75,
      startIndex: n - 30,
      endIndex: n,
      keyLevels: [Math.max(...highs), Math.min(...lows)],
      description: 'Descending Triangle pattern - typically bearish continuation',
      bullish: false
    };
  }
  
  // Symmetrical triangle: converging trend lines
  if (highTrend < -1 && lowTrend > 1) {
    return {
      type: 'symmetrical_triangle',
      confidence: 70,
      startIndex: n - 30,
      endIndex: n,
      keyLevels: [Math.max(...highs), Math.min(...lows)],
      description: 'Symmetrical Triangle pattern - breakout direction uncertain',
      bullish: false // Neutral, but default to false
    };
  }
  
  return null;
}

/**
 * Detect all patterns in price data
 */
export function detectPatterns(prices: number[]): ChartPattern[] {
  const patterns: ChartPattern[] = [];
  
  // Try to detect each pattern type
  const headAndShoulders = detectHeadAndShoulders(prices);
  if (headAndShoulders) patterns.push(headAndShoulders);
  
  const doubleTop = detectDoubleTop(prices);
  if (doubleTop) patterns.push(doubleTop);
  
  const triangle = detectTriangle(prices);
  if (triangle) patterns.push(triangle);
  
  // Sort by confidence
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Match current pattern against historical patterns
 */
export async function matchHistoricalPatterns(
  currentPrices: number[],
  currentPattern: ChartPattern | null
): Promise<PatternMatchingResult> {
  // If no pattern detected, return neutral result
  if (!currentPattern) {
    return {
      currentPattern: null,
      historicalMatches: [],
      probability: { bullish: 33, bearish: 33, neutral: 34 },
      expectedOutcome: 'neutral',
      confidence: 0
    };
  }
  
  // Normalize current price sequence
  const normalizedCurrent = normalizePrices(
    currentPrices.slice(currentPattern.startIndex, currentPattern.endIndex)
  );
  
  // TODO: Fetch historical patterns from database
  // For now, generate simulated historical matches
  const historicalMatches: HistoricalMatch[] = generateSimulatedMatches(
    currentPattern,
    normalizedCurrent
  );
  
  // Calculate probability based on historical outcomes
  const outcomes = historicalMatches.map(m => m.outcome);
  const bullishCount = outcomes.filter(o => o === 'bullish').length;
  const bearishCount = outcomes.filter(o => o === 'bearish').length;
  const neutralCount = outcomes.filter(o => o === 'neutral').length;
  const total = outcomes.length || 1;
  
  const probability = {
    bullish: Math.round((bullishCount / total) * 100),
    bearish: Math.round((bearishCount / total) * 100),
    neutral: Math.round((neutralCount / total) * 100)
  };
  
  // Determine expected outcome
  let expectedOutcome: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (probability.bullish > probability.bearish && probability.bullish > probability.neutral) {
    expectedOutcome = 'bullish';
  } else if (probability.bearish > probability.bullish && probability.bearish > probability.neutral) {
    expectedOutcome = 'bearish';
  }
  
  // Calculate overall confidence
  const maxProbability = Math.max(probability.bullish, probability.bearish, probability.neutral);
  const avgSimilarity = historicalMatches.reduce((sum, m) => sum + m.similarity, 0) / (historicalMatches.length || 1);
  const confidence = Math.round((maxProbability + avgSimilarity) / 2);
  
  return {
    currentPattern,
    historicalMatches: historicalMatches.slice(0, 5), // Top 5 matches
    probability,
    expectedOutcome,
    confidence
  };
}

/**
 * Generate simulated historical matches (placeholder until database is implemented)
 */
function generateSimulatedMatches(
  pattern: ChartPattern,
  normalizedPrices: number[]
): HistoricalMatch[] {
  const matches: HistoricalMatch[] = [];
  const baseOutcome = pattern.bullish ? 'bullish' : 'bearish';
  
  // Generate 5-10 simulated matches
  const numMatches = 5 + Math.floor(Math.random() * 6);
  
  for (let i = 0; i < numMatches; i++) {
    const similarity = 85 + Math.random() * 15; // 85-100% similarity
    const daysAgo = Math.floor(Math.random() * 365) + 30;
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Outcome should mostly match pattern direction, but not always
    let outcome: 'bullish' | 'bearish' | 'neutral' = baseOutcome;
    const rand = Math.random();
    if (rand < 0.15) outcome = 'neutral';
    else if (rand < 0.25) outcome = baseOutcome === 'bullish' ? 'bearish' : 'bullish';
    
    // Generate price changes based on outcome
    let priceChange1d, priceChange7d, priceChange30d;
    if (outcome === 'bullish') {
      priceChange1d = 1 + Math.random() * 4;
      priceChange7d = 3 + Math.random() * 12;
      priceChange30d = 5 + Math.random() * 25;
    } else if (outcome === 'bearish') {
      priceChange1d = -(1 + Math.random() * 4);
      priceChange7d = -(3 + Math.random() * 12);
      priceChange30d = -(5 + Math.random() * 25);
    } else {
      priceChange1d = -2 + Math.random() * 4;
      priceChange7d = -5 + Math.random() * 10;
      priceChange30d = -8 + Math.random() * 16;
    }
    
    matches.push({
      patternType: pattern.type,
      similarity: Math.round(similarity),
      historicalDate: date.toISOString().split('T')[0],
      priceChange1d: Math.round(priceChange1d * 100) / 100,
      priceChange7d: Math.round(priceChange7d * 100) / 100,
      priceChange30d: Math.round(priceChange30d * 100) / 100,
      outcome,
      confidence: Math.round(similarity * 0.9)
    });
  }
  
  // Sort by similarity
  return matches.sort((a, b) => b.similarity - a.similarity);
}
