/**
 * Multi-Dimensional Consensus Algorithm
 * 
 * Aggregates signals from technical, fundamental, sentiment, and on-chain analysis
 * to generate a unified consensus score and actionable recommendation.
 */

export interface SignalInput {
  technical: {
    score: number; // 0-100
    signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    confidence: number; // 0-100
    indicators: {
      bullish: number;
      bearish: number;
      neutral: number;
    };
  };
  fundamental: {
    score: number; // 0-100
    confidence: number;
    factors: {
      technology: number;
      team: number;
      partnerships: number;
      marketPosition: number;
    };
  };
  sentiment: {
    score: number; // -100 to +100
    confidence: number;
    sources: {
      social: number;
      news: number;
      influencers: number;
    };
  };
  onChain: {
    score: number; // 0-100
    confidence: number;
    metrics: {
      holderDistribution: number;
      whaleActivity: number;
      exchangeFlows: number;
      smartMoney: number;
    };
  };
}

export interface TimeframeConsensus {
  shortTerm: {
    score: number; // 0-100
    signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    confidence: number;
    timeframe: '1-7d';
  };
  mediumTerm: {
    score: number;
    signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    confidence: number;
    timeframe: '1-4w';
  };
  longTerm: {
    score: number;
    signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    confidence: number;
    timeframe: '1-6m';
  };
}

export interface ConsensusResult {
  overallScore: number; // 0-100
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number; // 0-100
  timeframes: TimeframeConsensus;
  keyFactors: string[];
  conflicts: Array<{
    dimension1: string;
    dimension2: string;
    divergence: string;
    explanation: string;
  }>;
  breakdown: {
    technical: { weight: number; contribution: number };
    fundamental: { weight: number; contribution: number };
    sentiment: { weight: number; contribution: number };
    onChain: { weight: number; contribution: number };
  };
}

/**
 * Signal weights for different timeframes
 */
const TIMEFRAME_WEIGHTS = {
  shortTerm: {
    technical: 0.45,
    sentiment: 0.30,
    onChain: 0.20,
    fundamental: 0.05,
  },
  mediumTerm: {
    technical: 0.35,
    sentiment: 0.20,
    onChain: 0.25,
    fundamental: 0.20,
  },
  longTerm: {
    technical: 0.20,
    sentiment: 0.10,
    onChain: 0.20,
    fundamental: 0.50,
  },
};

/**
 * Convert technical signal to numeric score
 */
function technicalSignalToScore(signal: string): number {
  const mapping: Record<string, number> = {
    strong_buy: 90,
    buy: 70,
    neutral: 50,
    sell: 30,
    strong_sell: 10,
  };
  return mapping[signal] || 50;
}

/**
 * Normalize sentiment score from -100/+100 to 0-100
 */
function normalizeSentimentScore(score: number): number {
  return ((score + 100) / 200) * 100;
}

/**
 * Calculate weighted consensus score for a timeframe
 */
function calculateTimeframeScore(
  signals: SignalInput,
  weights: typeof TIMEFRAME_WEIGHTS.shortTerm
): number {
  const technicalScore = technicalSignalToScore(signals.technical.signal);
  const fundamentalScore = signals.fundamental.score;
  const sentimentScore = normalizeSentimentScore(signals.sentiment.score);
  const onChainScore = signals.onChain.score;

  const weightedScore =
    technicalScore * weights.technical +
    fundamentalScore * weights.fundamental +
    sentimentScore * weights.sentiment +
    onChainScore * weights.onChain;

  return Math.round(weightedScore);
}

/**
 * Convert numeric score to signal recommendation
 */
function scoreToSignal(score: number): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' {
  if (score >= 80) return 'strong_buy';
  if (score >= 60) return 'buy';
  if (score >= 40) return 'hold';
  if (score >= 20) return 'sell';
  return 'strong_sell';
}

/**
 * Calculate confidence based on signal agreement
 */
function calculateConfidence(signals: SignalInput): number {
  const scores = [
    technicalSignalToScore(signals.technical.signal),
    signals.fundamental.score,
    normalizeSentimentScore(signals.sentiment.score),
    signals.onChain.score,
  ];

  // Calculate standard deviation
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Lower standard deviation = higher confidence
  // Map stdDev (0-50) to confidence (100-50)
  const confidence = Math.max(50, 100 - stdDev);

  // Weight by individual signal confidences
  const avgSignalConfidence =
    (signals.technical.confidence +
      signals.fundamental.confidence +
      signals.sentiment.confidence +
      signals.onChain.confidence) /
    4;

  // Combine both factors
  return Math.round((confidence + avgSignalConfidence) / 2);
}

/**
 * Identify conflicts between different signal dimensions
 */
function identifyConflicts(signals: SignalInput): ConsensusResult['conflicts'] {
  const conflicts: ConsensusResult['conflicts'] = [];

  const technicalScore = technicalSignalToScore(signals.technical.signal);
  const fundamentalScore = signals.fundamental.score;
  const sentimentScore = normalizeSentimentScore(signals.sentiment.score);
  const onChainScore = signals.onChain.score;

  // Check for significant divergences (>30 points)
  const threshold = 30;

  // Technical vs Fundamental
  if (Math.abs(technicalScore - fundamentalScore) > threshold) {
    conflicts.push({
      dimension1: 'Technical Analysis',
      dimension2: 'Fundamental Analysis',
      divergence: technicalScore > fundamentalScore ? 'Technical bullish, Fundamental bearish' : 'Technical bearish, Fundamental bullish',
      explanation:
        technicalScore > fundamentalScore
          ? 'Short-term price action is positive but long-term fundamentals are weak. Consider this a trading opportunity rather than investment.'
          : 'Long-term fundamentals are strong but short-term technicals are weak. This may be a good entry point for long-term holders.',
    });
  }

  // Technical vs Sentiment
  if (Math.abs(technicalScore - sentimentScore) > threshold) {
    conflicts.push({
      dimension1: 'Technical Analysis',
      dimension2: 'Social Sentiment',
      divergence: technicalScore > sentimentScore ? 'Technical bullish, Sentiment bearish' : 'Technical bearish, Sentiment bullish',
      explanation:
        technicalScore > sentimentScore
          ? 'Price is rising despite negative sentiment - possible smart money accumulation or sentiment lagging price.'
          : 'Sentiment is extremely positive but price is falling - possible distribution phase or sentiment-driven bubble.',
    });
  }

  // Sentiment vs On-Chain
  if (Math.abs(sentimentScore - onChainScore) > threshold) {
    conflicts.push({
      dimension1: 'Social Sentiment',
      dimension2: 'On-Chain Activity',
      divergence: sentimentScore > onChainScore ? 'Sentiment bullish, On-chain bearish' : 'Sentiment bearish, On-chain bullish',
      explanation:
        sentimentScore > onChainScore
          ? 'Social media is bullish but on-chain metrics show distribution - retail FOMO vs smart money selling.'
          : 'Social sentiment is negative but on-chain shows accumulation - potential contrarian opportunity.',
    });
  }

  // On-Chain vs Fundamental
  if (Math.abs(onChainScore - fundamentalScore) > threshold) {
    conflicts.push({
      dimension1: 'On-Chain Activity',
      dimension2: 'Fundamental Analysis',
      divergence: onChainScore > fundamentalScore ? 'On-chain bullish, Fundamentals bearish' : 'On-chain bearish, Fundamentals bullish',
      explanation:
        onChainScore > fundamentalScore
          ? 'Strong on-chain activity despite weak fundamentals - speculative interest or short-term catalyst.'
          : 'Weak on-chain activity despite strong fundamentals - market may not have discovered value yet.',
    });
  }

  return conflicts;
}

/**
 * Generate key factors driving the consensus
 */
function generateKeyFactors(signals: SignalInput, overallScore: number): string[] {
  const factors: string[] = [];

  // Technical factors
  const technicalScore = technicalSignalToScore(signals.technical.signal);
  if (technicalScore >= 70) {
    factors.push(`Strong technical setup with ${signals.technical.indicators.bullish} bullish indicators`);
  } else if (technicalScore <= 30) {
    factors.push(`Weak technical setup with ${signals.technical.indicators.bearish} bearish indicators`);
  }

  // Fundamental factors
  if (signals.fundamental.score >= 70) {
    factors.push('Strong fundamentals with solid technology and team');
  } else if (signals.fundamental.score <= 30) {
    factors.push('Weak fundamentals raise concerns about long-term viability');
  }

  // Sentiment factors
  const sentimentScore = normalizeSentimentScore(signals.sentiment.score);
  if (sentimentScore >= 70) {
    factors.push('Extremely positive social sentiment and community engagement');
  } else if (sentimentScore <= 30) {
    factors.push('Negative social sentiment and declining community interest');
  }

  // On-chain factors
  if (signals.onChain.score >= 70) {
    factors.push('Positive on-chain metrics showing accumulation and strong holder base');
  } else if (signals.onChain.score <= 30) {
    factors.push('Concerning on-chain metrics with distribution and weak holder base');
  }

  // Whale activity
  if (signals.onChain.metrics.whaleActivity >= 70) {
    factors.push('Significant whale accumulation detected');
  } else if (signals.onChain.metrics.whaleActivity <= 30) {
    factors.push('Whale distribution pattern observed');
  }

  // Smart money
  if (signals.onChain.metrics.smartMoney >= 70) {
    factors.push('Smart money wallets are accumulating');
  } else if (signals.onChain.metrics.smartMoney <= 30) {
    factors.push('Smart money wallets are distributing');
  }

  // Limit to top 5 factors
  return factors.slice(0, 5);
}

/**
 * Main consensus calculation function
 */
export function calculateConsensus(signals: SignalInput): ConsensusResult {
  // Calculate scores for each timeframe
  const shortTermScore = calculateTimeframeScore(signals, TIMEFRAME_WEIGHTS.shortTerm);
  const mediumTermScore = calculateTimeframeScore(signals, TIMEFRAME_WEIGHTS.mediumTerm);
  const longTermScore = calculateTimeframeScore(signals, TIMEFRAME_WEIGHTS.longTerm);

  // Overall score is weighted average of timeframes
  const overallScore = Math.round(
    shortTermScore * 0.3 + mediumTermScore * 0.4 + longTermScore * 0.3
  );

  // Calculate confidence
  const confidence = calculateConfidence(signals);

  // Identify conflicts
  const conflicts = identifyConflicts(signals);

  // Generate key factors
  const keyFactors = generateKeyFactors(signals, overallScore);

  // Calculate breakdown
  const technicalScore = technicalSignalToScore(signals.technical.signal);
  const fundamentalScore = signals.fundamental.score;
  const sentimentScore = normalizeSentimentScore(signals.sentiment.score);
  const onChainScore = signals.onChain.score;

  // Use medium-term weights for overall breakdown
  const weights = TIMEFRAME_WEIGHTS.mediumTerm;

  return {
    overallScore,
    recommendation: scoreToSignal(overallScore),
    confidence,
    timeframes: {
      shortTerm: {
        score: shortTermScore,
        signal: scoreToSignal(shortTermScore),
        confidence: Math.round(confidence * 0.9), // Slightly lower for short-term
        timeframe: '1-7d',
      },
      mediumTerm: {
        score: mediumTermScore,
        signal: scoreToSignal(mediumTermScore),
        confidence,
        timeframe: '1-4w',
      },
      longTerm: {
        score: longTermScore,
        signal: scoreToSignal(longTermScore),
        confidence: Math.round(confidence * 0.95), // Slightly lower for long-term
        timeframe: '1-6m',
      },
    },
    keyFactors,
    conflicts,
    breakdown: {
      technical: {
        weight: weights.technical,
        contribution: Math.round(technicalScore * weights.technical),
      },
      fundamental: {
        weight: weights.fundamental,
        contribution: Math.round(fundamentalScore * weights.fundamental),
      },
      sentiment: {
        weight: weights.sentiment,
        contribution: Math.round(sentimentScore * weights.sentiment),
      },
      onChain: {
        weight: weights.onChain,
        contribution: Math.round(onChainScore * weights.onChain),
      },
    },
  };
}

/**
 * Format recommendation for display
 */
export function formatRecommendation(recommendation: string): string {
  const mapping: Record<string, string> = {
    strong_buy: 'STRONG BUY',
    buy: 'BUY',
    hold: 'HOLD',
    sell: 'SELL',
    strong_sell: 'STRONG SELL',
  };
  return mapping[recommendation] || 'HOLD';
}

/**
 * Get color for recommendation (Bitcoin Sovereign colors)
 */
export function getRecommendationColor(recommendation: string): string {
  const mapping: Record<string, string> = {
    strong_buy: '#F7931A', // Bitcoin Orange
    buy: '#F7931A',
    hold: 'rgba(255, 255, 255, 0.8)', // White 80%
    sell: 'rgba(255, 255, 255, 0.6)', // White 60%
    strong_sell: 'rgba(255, 255, 255, 0.6)',
  };
  return mapping[recommendation] || 'rgba(255, 255, 255, 0.8)';
}
