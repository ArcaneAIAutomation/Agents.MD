/**
 * Quantum-Superior Intelligence Core (QSIC)
 * 
 * The brain of the Quantum SUPER SPEC system - orchestrates all operations
 * using multi-probability state reasoning with self-correction and guardrails.
 * 
 * Requirements: 9.1, 9.2, 9.4, 9.5, 9.6
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ComprehensiveMarketData {
  price: number;
  volume24h: number;
  marketCap: number;
  priceHistory: PriceHistory;
  onChainData: OnChainData;
  sentimentData: SentimentData;
  timestamp: string;
}

export interface PriceHistory {
  prices: Array<{ timestamp: string; price: number }>;
  timeframe: '1h' | '4h' | '1d' | '1w';
}

export interface OnChainData {
  mempoolSize: number;
  whaleTransactions: number;
  difficulty: number;
  hashRate: number;
}

export interface SentimentData {
  score: number; // 0-100
  socialDominance: number;
  mentions24h: number;
}

export interface QuantumAnalysis {
  wavePatternCollapse: 'CONTINUATION' | 'BREAK' | 'UNCERTAIN';
  timeSymmetricTrajectory: {
    forward: PriceTrajectory;
    reverse: PriceTrajectory;
    alignment: number; // 0-100
  };
  liquidityHarmonics: LiquidityAnalysis;
  mempoolPattern: MempoolAnalysis;
  whaleMovement: WhaleAnalysis;
  macroCyclePhase: CyclePhase;
  confidenceScore: number; // 0-100
  reasoning: string;
  mathematicalJustification: string;
  errors: string[];
  corrections: string[];
}

export interface PriceTrajectory {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  strength: number; // 0-100
  probability: number; // 0-100
  keyLevels: number[];
}

export interface LiquidityAnalysis {
  bidDepth: number;
  askDepth: number;
  imbalance: number; // -100 to 100
  harmonicScore: number; // 0-100
}

export interface MempoolAnalysis {
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  feeEstimate: number;
  transactionCount: number;
  pattern: 'NORMAL' | 'SPIKE' | 'DECLINING';
}

export interface WhaleAnalysis {
  largeTransactions: number;
  netFlow: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
  confidence: number; // 0-100
}

export interface CyclePhase {
  phase: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN';
  confidence: number; // 0-100
  daysInPhase: number;
}

export interface PatternAnalysis {
  patterns: DetectedPattern[];
  dominantPattern: DetectedPattern | null;
  confidence: number; // 0-100
}

export interface DetectedPattern {
  type: 'DOUBLE_TOP' | 'DOUBLE_BOTTOM' | 'HEAD_SHOULDERS' | 'TRIANGLE' | 'WEDGE' | 'FLAG' | 'CHANNEL';
  confidence: number; // 0-100
  timeframe: string;
  priceRange: { min: number; max: number };
}

export interface ConfidenceScore {
  overall: number; // 0-100
  dataQuality: number; // 0-100
  patternStrength: number; // 0-100
  marketConditions: number; // 0-100
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number; // 0-100
}

export interface CorrectedAnalysis {
  original: QuantumAnalysis;
  corrected: QuantumAnalysis;
  corrections: string[];
  improvementScore: number; // 0-100
}

export interface MarketDataSet {
  btcPrice: number;
  volume24h: number;
  marketCap: number;
  onChain: OnChainData;
  sentiment: SentimentData;
  dataQuality: number; // 0-100
}

export interface SystemOperation {
  type: 'TRADE_GENERATION' | 'VALIDATION' | 'DATA_COLLECTION';
  data: any;
  timestamp: string;
}

export interface GuardrailResult {
  passed: boolean;
  violations: string[];
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
  action: 'PROCEED' | 'WARN' | 'BLOCK' | 'SUSPEND';
}

// ============================================================================
// MULTI-PROBABILITY STATE REASONING (Subtask 4.1)
// ============================================================================

/**
 * Multi-Probability State Reasoning Engine
 * 
 * Analyzes markets using quantum-inspired multi-probability states,
 * considering multiple possible outcomes simultaneously.
 * 
 * Requirements: 9.1, 9.2
 */
export class MultiProbabilityReasoning {
  /**
   * Analyze market using multi-probability state reasoning
   * 
   * This method considers multiple possible market states simultaneously
   * and calculates probabilities for each state.
   */
  async analyzeMarket(data: ComprehensiveMarketData): Promise<QuantumAnalysis> {
    // Step 1: Detect patterns across multiple probability states
    const patterns = await this.detectPatterns(data.priceHistory);
    
    // Step 2: Calculate wave-pattern collapse probability
    const wavePattern = this.calculateWavePatternCollapse(data.priceHistory, patterns);
    
    // Step 3: Analyze time-symmetric trajectories
    const trajectory = this.analyzeTimeSymmetricTrajectory(data.priceHistory);
    
    // Step 4: Analyze liquidity harmonics
    const liquidity = this.analyzeLiquidityHarmonics(data);
    
    // Step 5: Analyze mempool patterns
    const mempool = this.analyzeMempoolPattern(data.onChainData);
    
    // Step 6: Analyze whale movements
    const whales = this.analyzeWhaleMovement(data.onChainData);
    
    // Step 7: Determine macro cycle phase
    const cycle = this.determineMacroCyclePhase(data.priceHistory);
    
    // Step 8: Calculate overall confidence
    const confidence = this.calculateConfidence({
      patterns,
      wavePattern,
      trajectory,
      liquidity,
      mempool,
      whales,
      cycle
    });
    
    // Step 9: Generate reasoning and justification
    const reasoning = this.generateReasoning({
      wavePattern,
      trajectory,
      patterns,
      confidence
    });
    
    const mathematicalJustification = this.generateMathematicalJustification({
      trajectory,
      liquidity,
      confidence
    });
    
    return {
      wavePatternCollapse: wavePattern,
      timeSymmetricTrajectory: trajectory,
      liquidityHarmonics: liquidity,
      mempoolPattern: mempool,
      whaleMovement: whales,
      macroCyclePhase: cycle,
      confidenceScore: confidence,
      reasoning,
      mathematicalJustification,
      errors: [],
      corrections: []
    };
  }

  /**
   * Detect patterns using multi-dimensional analysis
   * 
   * Analyzes price history across multiple dimensions to detect
   * hidden patterns that may not be visible in single-dimension analysis.
   */
  async detectPatterns(priceHistory: PriceHistory): Promise<PatternAnalysis> {
    const patterns: DetectedPattern[] = [];
    
    // Detect various pattern types
    const doubleTop = this.detectDoubleTop(priceHistory);
    const doubleBottom = this.detectDoubleBottom(priceHistory);
    const headShoulders = this.detectHeadShoulders(priceHistory);
    const triangle = this.detectTriangle(priceHistory);
    
    if (doubleTop) patterns.push(doubleTop);
    if (doubleBottom) patterns.push(doubleBottom);
    if (headShoulders) patterns.push(headShoulders);
    if (triangle) patterns.push(triangle);
    
    // Find dominant pattern (highest confidence)
    const dominantPattern = patterns.length > 0
      ? patterns.reduce((max, p) => p.confidence > max.confidence ? p : max)
      : null;
    
    // Calculate overall pattern confidence
    const confidence = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0;
    
    return {
      patterns,
      dominantPattern,
      confidence
    };
  }
  
  private detectDoubleTop(priceHistory: PriceHistory): DetectedPattern | null {
    // Simplified double top detection
    const prices = priceHistory.prices.map(p => p.price);
    if (prices.length < 10) return null;
    
    // Look for two peaks at similar levels
    const peaks = this.findPeaks(prices);
    if (peaks.length < 2) return null;
    
    const lastTwoPeaks = peaks.slice(-2);
    const priceDiff = Math.abs(lastTwoPeaks[0].price - lastTwoPeaks[1].price);
    const avgPrice = (lastTwoPeaks[0].price + lastTwoPeaks[1].price) / 2;
    const diffPercent = (priceDiff / avgPrice) * 100;
    
    if (diffPercent < 2) { // Peaks within 2% of each other
      return {
        type: 'DOUBLE_TOP',
        confidence: Math.max(0, 100 - diffPercent * 10),
        timeframe: priceHistory.timeframe,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        }
      };
    }
    
    return null;
  }

  private detectDoubleBottom(priceHistory: PriceHistory): DetectedPattern | null {
    const prices = priceHistory.prices.map(p => p.price);
    if (prices.length < 10) return null;
    
    // Look for two troughs at similar levels
    const troughs = this.findTroughs(prices);
    if (troughs.length < 2) return null;
    
    const lastTwoTroughs = troughs.slice(-2);
    const priceDiff = Math.abs(lastTwoTroughs[0].price - lastTwoTroughs[1].price);
    const avgPrice = (lastTwoTroughs[0].price + lastTwoTroughs[1].price) / 2;
    const diffPercent = (priceDiff / avgPrice) * 100;
    
    if (diffPercent < 2) {
      return {
        type: 'DOUBLE_BOTTOM',
        confidence: Math.max(0, 100 - diffPercent * 10),
        timeframe: priceHistory.timeframe,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        }
      };
    }
    
    return null;
  }
  
  private detectHeadShoulders(priceHistory: PriceHistory): DetectedPattern | null {
    // Simplified head and shoulders detection
    const prices = priceHistory.prices.map(p => p.price);
    if (prices.length < 15) return null;
    
    const peaks = this.findPeaks(prices);
    if (peaks.length < 3) return null;
    
    // Look for pattern: shoulder - head - shoulder
    const lastThreePeaks = peaks.slice(-3);
    const [leftShoulder, head, rightShoulder] = lastThreePeaks;
    
    // Head should be higher than shoulders
    if (head.price > leftShoulder.price && head.price > rightShoulder.price) {
      // Shoulders should be at similar levels
      const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price);
      const avgShoulder = (leftShoulder.price + rightShoulder.price) / 2;
      const diffPercent = (shoulderDiff / avgShoulder) * 100;
      
      if (diffPercent < 3) {
        return {
          type: 'HEAD_SHOULDERS',
          confidence: Math.max(0, 100 - diffPercent * 5),
          timeframe: priceHistory.timeframe,
          priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices)
          }
        };
      }
    }
    
    return null;
  }

  private detectTriangle(priceHistory: PriceHistory): DetectedPattern | null {
    const prices = priceHistory.prices.map(p => p.price);
    if (prices.length < 20) return null;
    
    // Calculate highs and lows trend
    const highs = this.findPeaks(prices);
    const lows = this.findTroughs(prices);
    
    if (highs.length < 3 || lows.length < 3) return null;
    
    // Check if highs are descending and lows are ascending (symmetrical triangle)
    const highsDescending = this.isTrendDescending(highs.map(h => h.price));
    const lowsAscending = this.isTrendAscending(lows.map(l => l.price));
    
    if (highsDescending && lowsAscending) {
      return {
        type: 'TRIANGLE',
        confidence: 75,
        timeframe: priceHistory.timeframe,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        }
      };
    }
    
    return null;
  }
  
  private findPeaks(prices: number[]): Array<{ index: number; price: number }> {
    const peaks: Array<{ index: number; price: number }> = [];
    
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
        peaks.push({ index: i, price: prices[i] });
      }
    }
    
    return peaks;
  }
  
  private findTroughs(prices: number[]): Array<{ index: number; price: number }> {
    const troughs: Array<{ index: number; price: number }> = [];
    
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
        troughs.push({ index: i, price: prices[i] });
      }
    }
    
    return troughs;
  }
  
  private isTrendDescending(values: number[]): boolean {
    if (values.length < 2) return false;
    let descendingCount = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) descendingCount++;
    }
    return descendingCount / (values.length - 1) > 0.6;
  }
  
  private isTrendAscending(values: number[]): boolean {
    if (values.length < 2) return false;
    let ascendingCount = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) ascendingCount++;
    }
    return ascendingCount / (values.length - 1) > 0.6;
  }

  // ============================================================================
  // WAVE-PATTERN COLLAPSE LOGIC (Subtask 4.2)
  // ============================================================================
  
  /**
   * Calculate wave-pattern collapse probability
   * 
   * Determines whether the current market pattern will continue or break,
   * using quantum-inspired collapse logic.
   * 
   * Requirements: 1.3
   */
  private calculateWavePatternCollapse(
    priceHistory: PriceHistory,
    patterns: PatternAnalysis
  ): 'CONTINUATION' | 'BREAK' | 'UNCERTAIN' {
    const prices = priceHistory.prices.map(p => p.price);
    if (prices.length < 5) return 'UNCERTAIN';
    
    // Calculate trend strength
    const trendStrength = this.calculateTrendStrength(prices);
    
    // Calculate momentum
    const momentum = this.calculateMomentum(prices);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(prices);
    
    // Analyze pattern strength
    const patternStrength = patterns.confidence;
    
    // Calculate collapse probability
    const collapseScore = this.calculateCollapseScore({
      trendStrength,
      momentum,
      volatility,
      patternStrength
    });
    
    // Determine collapse state
    if (collapseScore > 70) {
      return 'CONTINUATION'; // Strong trend likely to continue
    } else if (collapseScore < 30) {
      return 'BREAK'; // Trend likely to break/reverse
    } else {
      return 'UNCERTAIN'; // Unclear direction
    }
  }
  
  private calculateTrendStrength(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    // Calculate linear regression slope
    const n = prices.length;
    const xMean = (n - 1) / 2;
    const yMean = prices.reduce((sum, p) => sum + p, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (prices[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }
    
    const slope = numerator / denominator;
    const avgPrice = yMean;
    const slopePercent = (slope / avgPrice) * 100;
    
    // Normalize to 0-100 scale
    return Math.min(100, Math.abs(slopePercent) * 10);
  }

  private calculateMomentum(prices: number[]): number {
    if (prices.length < 10) return 50;
    
    // Calculate rate of change over last 10 periods
    const current = prices[prices.length - 1];
    const past = prices[prices.length - 10];
    const roc = ((current - past) / past) * 100;
    
    // Normalize to 0-100 scale (positive momentum = higher score)
    return Math.min(100, Math.max(0, 50 + roc * 5));
  }
  
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    // Calculate standard deviation
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize to 0-100 scale
    const volatilityPercent = (stdDev / mean) * 100;
    return Math.min(100, volatilityPercent * 10);
  }
  
  private calculateCollapseScore(factors: {
    trendStrength: number;
    momentum: number;
    volatility: number;
    patternStrength: number;
  }): number {
    // Weighted average of factors
    const weights = {
      trendStrength: 0.3,
      momentum: 0.3,
      volatility: -0.2, // High volatility reduces continuation probability
      patternStrength: 0.2
    };
    
    const score = 
      factors.trendStrength * weights.trendStrength +
      factors.momentum * weights.momentum +
      (100 - factors.volatility) * Math.abs(weights.volatility) +
      factors.patternStrength * weights.patternStrength;
    
    return Math.min(100, Math.max(0, score));
  }

  // ============================================================================
  // TIME-SYMMETRIC TRAJECTORY ANALYSIS (Subtask 4.3)
  // ============================================================================
  
  /**
   * Analyze time-symmetric trajectories
   * 
   * Maps both forward and reverse price trajectories to detect
   * alignment and predict future movement.
   * 
   * Requirements: 1.4
   */
  private analyzeTimeSymmetricTrajectory(priceHistory: PriceHistory): {
    forward: PriceTrajectory;
    reverse: PriceTrajectory;
    alignment: number;
  } {
    const prices = priceHistory.prices.map(p => p.price);
    
    // Forward trajectory (recent → future)
    const forward = this.mapForwardTrajectory(prices);
    
    // Reverse trajectory (recent → past)
    const reverse = this.mapReverseTrajectory(prices);
    
    // Calculate alignment score
    const alignment = this.calculateTrajectoryAlignment(forward, reverse);
    
    return {
      forward,
      reverse,
      alignment
    };
  }
  
  /**
   * Map forward trajectory (predict future movement)
   */
  private mapForwardTrajectory(prices: number[]): PriceTrajectory {
    if (prices.length < 5) {
      return {
        direction: 'SIDEWAYS',
        strength: 0,
        probability: 0,
        keyLevels: []
      };
    }
    
    // Analyze recent trend
    const recentPrices = prices.slice(-10);
    const trendStrength = this.calculateTrendStrength(recentPrices);
    const momentum = this.calculateMomentum(prices);
    
    // Determine direction
    const lastPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2];
    const direction = lastPrice > prevPrice ? 'UP' : lastPrice < prevPrice ? 'DOWN' : 'SIDEWAYS';
    
    // Calculate probability based on trend consistency
    const probability = this.calculateDirectionProbability(recentPrices, direction);
    
    // Identify key levels (support/resistance)
    const keyLevels = this.identifyKeyLevels(prices);
    
    return {
      direction,
      strength: trendStrength,
      probability,
      keyLevels
    };
  }

  /**
   * Map reverse trajectory (analyze past movement)
   */
  private mapReverseTrajectory(prices: number[]): PriceTrajectory {
    if (prices.length < 5) {
      return {
        direction: 'SIDEWAYS',
        strength: 0,
        probability: 0,
        keyLevels: []
      };
    }
    
    // Reverse the price array to analyze backward
    const reversedPrices = [...prices].reverse();
    
    // Analyze trend in reverse
    const recentReversed = reversedPrices.slice(0, 10);
    const trendStrength = this.calculateTrendStrength(recentReversed);
    
    // Determine direction (in reverse time)
    const lastPrice = reversedPrices[0];
    const prevPrice = reversedPrices[1];
    const direction = lastPrice > prevPrice ? 'UP' : lastPrice < prevPrice ? 'DOWN' : 'SIDEWAYS';
    
    // Calculate probability
    const probability = this.calculateDirectionProbability(recentReversed, direction);
    
    // Identify key levels
    const keyLevels = this.identifyKeyLevels(reversedPrices);
    
    return {
      direction,
      strength: trendStrength,
      probability,
      keyLevels
    };
  }
  
  /**
   * Calculate alignment between forward and reverse trajectories
   */
  private calculateTrajectoryAlignment(
    forward: PriceTrajectory,
    reverse: PriceTrajectory
  ): number {
    // Check if directions align
    const directionMatch = forward.direction === reverse.direction ? 1 : 0;
    
    // Compare strengths
    const strengthDiff = Math.abs(forward.strength - reverse.strength);
    const strengthAlignment = Math.max(0, 100 - strengthDiff);
    
    // Compare probabilities
    const probabilityDiff = Math.abs(forward.probability - reverse.probability);
    const probabilityAlignment = Math.max(0, 100 - probabilityDiff);
    
    // Weighted average
    const alignment = 
      directionMatch * 40 +
      strengthAlignment * 0.3 +
      probabilityAlignment * 0.3;
    
    return Math.min(100, Math.max(0, alignment));
  }

  private calculateDirectionProbability(prices: number[], direction: string): number {
    if (prices.length < 2) return 50;
    
    let consistentMoves = 0;
    for (let i = 1; i < prices.length; i++) {
      const move = prices[i] > prices[i - 1] ? 'UP' : prices[i] < prices[i - 1] ? 'DOWN' : 'SIDEWAYS';
      if (move === direction) consistentMoves++;
    }
    
    return (consistentMoves / (prices.length - 1)) * 100;
  }
  
  private identifyKeyLevels(prices: number[]): number[] {
    if (prices.length < 10) return [];
    
    const peaks = this.findPeaks(prices);
    const troughs = this.findTroughs(prices);
    
    // Combine and sort unique levels
    const levels = [
      ...peaks.map(p => p.price),
      ...troughs.map(t => t.price)
    ];
    
    // Remove duplicates and sort
    const uniqueLevels = [...new Set(levels)].sort((a, b) => b - a);
    
    // Return top 5 most significant levels
    return uniqueLevels.slice(0, 5);
  }

  // ============================================================================
  // SELF-CORRECTION ENGINE (Subtask 4.4)
  // ============================================================================
  
  /**
   * Validate reasoning before output
   * 
   * Checks the analysis for logical consistency, data quality,
   * and potential errors before delivering to user.
   * 
   * Requirements: 9.4
   */
  validateReasoning(analysis: QuantumAnalysis): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check confidence score validity
    if (analysis.confidenceScore < 0 || analysis.confidenceScore > 100) {
      errors.push('Confidence score out of valid range (0-100)');
    }
    
    // Check trajectory alignment
    if (analysis.timeSymmetricTrajectory.alignment < 30) {
      warnings.push('Low trajectory alignment detected - prediction may be uncertain');
    }
    
    // Check for contradictions
    if (analysis.wavePatternCollapse === 'CONTINUATION' && 
        analysis.timeSymmetricTrajectory.forward.direction === 'DOWN' &&
        analysis.timeSymmetricTrajectory.reverse.direction === 'UP') {
      errors.push('Contradiction: Wave pattern suggests continuation but trajectories diverge');
    }
    
    // Check liquidity harmonics
    if (Math.abs(analysis.liquidityHarmonics.imbalance) > 80) {
      warnings.push('Extreme liquidity imbalance detected - market may be unstable');
    }
    
    // Check mempool pattern
    if (analysis.mempoolPattern.congestionLevel === 'HIGH' && 
        analysis.confidenceScore > 80) {
      warnings.push('High mempool congestion may affect prediction accuracy');
    }
    
    // Check whale movement
    if (analysis.whaleMovement.netFlow === 'DISTRIBUTION' && 
        analysis.wavePatternCollapse === 'CONTINUATION') {
      warnings.push('Whale distribution conflicts with continuation pattern');
    }
    
    // Calculate overall validation confidence
    const confidence = errors.length === 0 ? 
      Math.max(0, 100 - warnings.length * 10) : 0;
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence
    };
  }

  /**
   * Detect and correct errors in analysis
   * 
   * Automatically corrects detected errors and inconsistencies
   * in the quantum analysis.
   * 
   * Requirements: 9.4
   */
  correctErrors(analysis: QuantumAnalysis): CorrectedAnalysis {
    const corrections: string[] = [];
    const corrected = { ...analysis };
    
    // Correct confidence score if out of range
    if (corrected.confidenceScore < 0) {
      corrected.confidenceScore = 0;
      corrections.push('Corrected negative confidence score to 0');
    }
    if (corrected.confidenceScore > 100) {
      corrected.confidenceScore = 100;
      corrections.push('Corrected confidence score exceeding 100 to 100');
    }
    
    // Correct trajectory alignment if invalid
    if (corrected.timeSymmetricTrajectory.alignment < 0) {
      corrected.timeSymmetricTrajectory.alignment = 0;
      corrections.push('Corrected negative trajectory alignment to 0');
    }
    if (corrected.timeSymmetricTrajectory.alignment > 100) {
      corrected.timeSymmetricTrajectory.alignment = 100;
      corrections.push('Corrected trajectory alignment exceeding 100 to 100');
    }
    
    // Correct liquidity imbalance if out of range
    if (corrected.liquidityHarmonics.imbalance < -100) {
      corrected.liquidityHarmonics.imbalance = -100;
      corrections.push('Corrected liquidity imbalance below -100 to -100');
    }
    if (corrected.liquidityHarmonics.imbalance > 100) {
      corrected.liquidityHarmonics.imbalance = 100;
      corrections.push('Corrected liquidity imbalance above 100 to 100');
    }
    
    // Resolve contradictions
    if (corrected.wavePatternCollapse === 'CONTINUATION' && 
        corrected.timeSymmetricTrajectory.alignment < 40) {
      corrected.wavePatternCollapse = 'UNCERTAIN';
      corrections.push('Changed wave pattern from CONTINUATION to UNCERTAIN due to low trajectory alignment');
    }
    
    // Calculate improvement score
    const improvementScore = corrections.length > 0 ? 
      Math.min(100, corrections.length * 15) : 0;
    
    // Store corrections in the corrected analysis
    corrected.corrections = corrections;
    
    return {
      original: analysis,
      corrected,
      corrections,
      improvementScore
    };
  }

  // ============================================================================
  // GUARDRAIL ENFORCEMENT (Subtask 4.5)
  // ============================================================================
  
  /**
   * Enforce guardrails on system operations
   * 
   * Validates operations against zero-hallucination constraints,
   * data quality requirements, and anomaly detection.
   * 
   * Requirements: 9.5, 9.6
   */
  enforceGuardrails(operation: SystemOperation): GuardrailResult {
    const violations: string[] = [];
    let severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL' = 'INFO';
    let action: 'PROCEED' | 'WARN' | 'BLOCK' | 'SUSPEND' = 'PROCEED';
    
    // Guardrail 1: Zero-hallucination check
    const hallucinationCheck = this.checkZeroHallucination(operation);
    if (!hallucinationCheck.passed) {
      violations.push(...hallucinationCheck.violations);
      severity = 'FATAL';
      action = 'SUSPEND';
    }
    
    // Guardrail 2: Data quality validation
    const dataQualityCheck = this.validateDataQuality(operation);
    if (!dataQualityCheck.passed) {
      violations.push(...dataQualityCheck.violations);
      if (severity !== 'FATAL') {
        severity = dataQualityCheck.severity;
        action = dataQualityCheck.severity === 'ERROR' ? 'BLOCK' : 'WARN';
      }
    }
    
    // Guardrail 3: Anomaly detection
    const anomalyCheck = this.detectAnomalies(operation);
    if (!anomalyCheck.passed) {
      violations.push(...anomalyCheck.violations);
      if (severity !== 'FATAL' && anomalyCheck.severity === 'ERROR') {
        severity = 'ERROR';
        action = 'BLOCK';
      }
    }
    
    return {
      passed: violations.length === 0,
      violations,
      severity,
      action
    };
  }

  /**
   * Check for zero-hallucination violations
   * 
   * Ensures all data comes from approved sources and is not invented.
   */
  private checkZeroHallucination(operation: SystemOperation): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    
    if (operation.type === 'TRADE_GENERATION') {
      const data = operation.data;
      
      // Check if data has required source attribution
      if (!data.sources || data.sources.length === 0) {
        violations.push('ZERO-HALLUCINATION VIOLATION: No data sources provided');
      }
      
      // Check if all sources are approved
      const approvedSources = ['CMC', 'CoinGecko', 'Kraken', 'Blockchain.com', 'LunarCrush', 'GPT-5.1', 'Gemini'];
      if (data.sources) {
        for (const source of data.sources) {
          if (!approvedSources.includes(source)) {
            violations.push(`ZERO-HALLUCINATION VIOLATION: Unapproved source detected: ${source}`);
          }
        }
      }
      
      // Check for estimated or calculated data presented as real
      if (data.isEstimated === true) {
        violations.push('ZERO-HALLUCINATION VIOLATION: Estimated data presented as real');
      }
      
      // Check for placeholder values
      if (data.price === 0 || data.price === null || data.price === undefined) {
        violations.push('ZERO-HALLUCINATION VIOLATION: Invalid or placeholder price data');
      }
    }
    
    return {
      passed: violations.length === 0,
      violations
    };
  }
  
  /**
   * Validate data quality
   * 
   * Ensures data meets minimum quality standards (70% threshold).
   */
  private validateDataQuality(operation: SystemOperation): {
    passed: boolean;
    violations: string[];
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
  } {
    const violations: string[] = [];
    let severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL' = 'INFO';
    
    if (operation.type === 'TRADE_GENERATION') {
      const data = operation.data;
      
      // Check data quality score
      if (data.dataQualityScore !== undefined) {
        if (data.dataQualityScore < 70) {
          violations.push(`DATA QUALITY VIOLATION: Quality score ${data.dataQualityScore}% below minimum 70%`);
          severity = 'ERROR';
        } else if (data.dataQualityScore < 80) {
          violations.push(`DATA QUALITY WARNING: Quality score ${data.dataQualityScore}% below recommended 80%`);
          severity = 'WARNING';
        }
      }
      
      // Check for stale data
      if (data.timestamp) {
        const age = Date.now() - new Date(data.timestamp).getTime();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        if (age > maxAge) {
          violations.push(`DATA QUALITY VIOLATION: Data is stale (${Math.round(age / 1000)}s old)`);
          severity = 'ERROR';
        }
      }
    }
    
    return {
      passed: violations.length === 0,
      violations,
      severity
    };
  }

  /**
   * Detect anomalies in operation data
   * 
   * Identifies unusual patterns or data that may indicate errors.
   */
  private detectAnomalies(operation: SystemOperation): {
    passed: boolean;
    violations: string[];
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
  } {
    const violations: string[] = [];
    let severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL' = 'INFO';
    
    if (operation.type === 'TRADE_GENERATION') {
      const data = operation.data;
      
      // Check for price anomalies
      if (data.price !== undefined) {
        if (data.price < 1000 || data.price > 1000000) {
          violations.push(`ANOMALY DETECTED: BTC price ${data.price} outside expected range`);
          severity = 'ERROR';
        }
      }
      
      // Check for volume anomalies
      if (data.volume24h !== undefined) {
        if (data.volume24h < 0) {
          violations.push('ANOMALY DETECTED: Negative 24h volume');
          severity = 'ERROR';
        }
      }
      
      // Check for mempool anomalies
      if (data.mempoolSize !== undefined) {
        if (data.mempoolSize === 0) {
          violations.push('ANOMALY DETECTED: Mempool size is zero');
          severity = 'WARNING';
        }
      }
      
      // Check for whale transaction anomalies
      if (data.whaleTransactions !== undefined) {
        if (data.whaleTransactions < 0) {
          violations.push('ANOMALY DETECTED: Negative whale transaction count');
          severity = 'ERROR';
        }
      }
    }
    
    return {
      passed: violations.length === 0,
      violations,
      severity
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private analyzeLiquidityHarmonics(data: ComprehensiveMarketData): LiquidityAnalysis {
    // Simplified liquidity analysis
    // In production, this would query Kraken orderbook data
    const volume = data.volume24h;
    const marketCap = data.marketCap;
    
    // Estimate bid/ask depth based on volume
    const bidDepth = volume * 0.4;
    const askDepth = volume * 0.6;
    
    // Calculate imbalance (-100 to 100)
    const imbalance = ((askDepth - bidDepth) / (askDepth + bidDepth)) * 100;
    
    // Calculate harmonic score (0-100)
    const harmonicScore = Math.max(0, 100 - Math.abs(imbalance));
    
    return {
      bidDepth,
      askDepth,
      imbalance,
      harmonicScore
    };
  }
  
  private analyzeMempoolPattern(onChainData: OnChainData): MempoolAnalysis {
    const size = onChainData.mempoolSize;
    
    // Determine congestion level
    let congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (size < 10000) {
      congestionLevel = 'LOW';
    } else if (size < 50000) {
      congestionLevel = 'MEDIUM';
    } else {
      congestionLevel = 'HIGH';
    }
    
    // Estimate fee (simplified)
    const feeEstimate = congestionLevel === 'LOW' ? 1 : 
                       congestionLevel === 'MEDIUM' ? 5 : 20;
    
    return {
      congestionLevel,
      feeEstimate,
      transactionCount: size,
      pattern: 'NORMAL' // Would need historical data to detect spikes
    };
  }
  
  private analyzeWhaleMovement(onChainData: OnChainData): WhaleAnalysis {
    const whaleCount = onChainData.whaleTransactions;
    
    // Determine net flow (simplified - would need transaction direction data)
    let netFlow: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
    if (whaleCount > 20) {
      netFlow = 'DISTRIBUTION';
    } else if (whaleCount < 5) {
      netFlow = 'ACCUMULATION';
    } else {
      netFlow = 'NEUTRAL';
    }
    
    // Calculate confidence based on whale count
    const confidence = Math.min(100, whaleCount * 5);
    
    return {
      largeTransactions: whaleCount,
      netFlow,
      confidence
    };
  }

  private determineMacroCyclePhase(priceHistory: PriceHistory): CyclePhase {
    const prices = priceHistory.prices.map(p => p.price);
    
    if (prices.length < 30) {
      return {
        phase: 'ACCUMULATION',
        confidence: 50,
        daysInPhase: 0
      };
    }
    
    // Calculate trend over longer period
    const longTermTrend = this.calculateTrendStrength(prices);
    const volatility = this.calculateVolatility(prices);
    
    // Determine phase based on trend and volatility
    let phase: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN';
    let confidence: number;
    
    if (longTermTrend > 60 && volatility < 40) {
      phase = 'MARKUP';
      confidence = 80;
    } else if (longTermTrend < 40 && volatility < 40) {
      phase = 'MARKDOWN';
      confidence = 80;
    } else if (longTermTrend > 50 && volatility > 60) {
      phase = 'DISTRIBUTION';
      confidence = 70;
    } else {
      phase = 'ACCUMULATION';
      confidence = 60;
    }
    
    return {
      phase,
      confidence,
      daysInPhase: Math.floor(prices.length / 24) // Assuming hourly data
    };
  }
  
  private calculateConfidence(factors: any): number {
    // Weighted average of all confidence factors
    const weights = {
      patterns: 0.2,
      trajectory: 0.25,
      liquidity: 0.15,
      mempool: 0.1,
      whales: 0.15,
      cycle: 0.15
    };
    
    const patternConfidence = factors.patterns?.confidence || 0;
    const trajectoryConfidence = factors.trajectory?.alignment || 0;
    const liquidityConfidence = factors.liquidity?.harmonicScore || 0;
    const mempoolConfidence = factors.mempool?.congestionLevel === 'LOW' ? 80 : 50;
    const whaleConfidence = factors.whales?.confidence || 0;
    const cycleConfidence = factors.cycle?.confidence || 0;
    
    const overall = 
      patternConfidence * weights.patterns +
      trajectoryConfidence * weights.trajectory +
      liquidityConfidence * weights.liquidity +
      mempoolConfidence * weights.mempool +
      whaleConfidence * weights.whales +
      cycleConfidence * weights.cycle;
    
    return Math.min(100, Math.max(0, overall));
  }

  private generateReasoning(factors: any): string {
    const { wavePattern, trajectory, patterns, confidence } = factors;
    
    let reasoning = `Quantum Analysis Summary:\n\n`;
    
    // Wave pattern
    reasoning += `Wave Pattern: ${wavePattern}\n`;
    reasoning += `The market shows ${wavePattern === 'CONTINUATION' ? 'strong continuation signals' : 
                                     wavePattern === 'BREAK' ? 'potential reversal signals' : 
                                     'uncertain directional signals'}.\n\n`;
    
    // Trajectory
    reasoning += `Time-Symmetric Analysis:\n`;
    reasoning += `Forward trajectory: ${trajectory.forward.direction} with ${trajectory.forward.strength.toFixed(0)}% strength\n`;
    reasoning += `Reverse trajectory: ${trajectory.reverse.direction} with ${trajectory.reverse.strength.toFixed(0)}% strength\n`;
    reasoning += `Alignment score: ${trajectory.alignment.toFixed(0)}%\n\n`;
    
    // Patterns
    if (patterns.dominantPattern) {
      reasoning += `Dominant Pattern: ${patterns.dominantPattern.type} (${patterns.dominantPattern.confidence.toFixed(0)}% confidence)\n\n`;
    }
    
    // Overall confidence
    reasoning += `Overall Confidence: ${confidence.toFixed(0)}%\n`;
    reasoning += `This analysis is based on multi-probability state reasoning across multiple market dimensions.`;
    
    return reasoning;
  }
  
  private generateMathematicalJustification(factors: any): string {
    const { trajectory, liquidity, confidence } = factors;
    
    let justification = `Mathematical Justification:\n\n`;
    
    // Trajectory math
    justification += `1. Trajectory Alignment Score:\n`;
    justification += `   Alignment = (Direction_Match × 40) + (Strength_Alignment × 0.3) + (Probability_Alignment × 0.3)\n`;
    justification += `   Result: ${trajectory.alignment.toFixed(2)}%\n\n`;
    
    // Liquidity math
    justification += `2. Liquidity Imbalance:\n`;
    justification += `   Imbalance = ((Ask_Depth - Bid_Depth) / (Ask_Depth + Bid_Depth)) × 100\n`;
    justification += `   Result: ${liquidity.imbalance.toFixed(2)}%\n\n`;
    
    // Confidence math
    justification += `3. Overall Confidence:\n`;
    justification += `   Confidence = Σ(Factor_i × Weight_i)\n`;
    justification += `   Result: ${confidence.toFixed(2)}%\n\n`;
    
    justification += `All calculations use quantum-inspired multi-probability state reasoning.`;
    
    return justification;
  }
  
  /**
   * Coordinate data collection from all sources
   */
  async coordinateDataCollection(): Promise<MarketDataSet> {
    // This would be implemented to fetch from actual APIs
    // For now, return a placeholder structure
    throw new Error('coordinateDataCollection not yet implemented - requires API integration');
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const qsic = new MultiProbabilityReasoning();
