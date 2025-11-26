/**
 * Einstein Trade Engine - Learning Feedback Loop
 * 
 * Compares predicted vs actual outcomes, adjusts confidence scoring based on
 * historical accuracy, and logs learning insights for future improvements.
 * 
 * Requirement 10.5: Learning feedback loop
 */

import {
  getPerformanceByTradeSignalId,
  getTradeSignalById,
  updatePerformanceMetrics,
  getTradeSignalsByUserId,
  type EinsteinPerformance,
  type EinsteinTradeSignal,
} from '../database';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Outcome comparison between predicted and actual results
 */
export interface OutcomeComparison {
  tradeSignalId: string;
  symbol: string;
  positionType: 'LONG' | 'SHORT' | 'NO_TRADE';
  
  // Entry comparison
  entryPricePredicted: number;
  entryPriceActual: number;
  entrySlippage: number;
  
  // Exit comparison
  exitPricePredicted: number;
  exitPriceActual: number;
  exitSlippage: number;
  
  // Profit/Loss comparison
  profitLossPredicted: number;
  profitLossActual: number;
  profitLossAccuracy: number;
  
  // Confidence comparison
  confidencePredicted: number;
  confidenceActual: number; // Based on actual outcome
  confidenceAccuracy: number;
  
  // Duration comparison
  durationPredicted?: number;
  durationActual?: number;
  durationAccuracy?: number;
  
  // Target hit analysis
  targetsHit: {
    tp1: boolean;
    tp2: boolean;
    tp3: boolean;
    stopLoss: boolean;
  };
  
  // Overall assessment
  wasSuccessful: boolean;
  deviationScore: number; // 0-100, lower is better
}

/**
 * Confidence adjustment recommendations
 */
export interface ConfidenceAdjustment {
  component: 'technical' | 'sentiment' | 'onchain' | 'risk' | 'overall';
  currentWeight: number;
  recommendedWeight: number;
  reason: string;
  historicalAccuracy: number;
}

/**
 * Learning insights for system improvement
 */
export interface LearningInsight {
  category: 'confidence' | 'timing' | 'targets' | 'risk' | 'general';
  severity: 'low' | 'medium' | 'high';
  insight: string;
  recommendation: string;
  affectedTrades: number;
  confidenceImpact: number; // -100 to +100
}

/**
 * Historical accuracy metrics
 */
export interface HistoricalAccuracy {
  totalTrades: number;
  completedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // Accuracy by component
  technicalAccuracy: number;
  sentimentAccuracy: number;
  onchainAccuracy: number;
  riskAccuracy: number;
  overallAccuracy: number;
  
  // Accuracy by timeframe
  timeframeAccuracy: {
    '15m': number;
    '1h': number;
    '4h': number;
    '1d': number;
  };
  
  // Accuracy by position type
  longAccuracy: number;
  shortAccuracy: number;
  
  // Average deviations
  avgEntrySlippage: number;
  avgExitSlippage: number;
  avgProfitLossDeviation: number;
  avgDurationDeviation: number;
}

// ============================================================================
// LEARNING FEEDBACK LOOP CLASS
// ============================================================================

/**
 * LearningFeedbackLoop class for continuous system improvement
 * 
 * Requirement 10.5: Compare predicted vs actual outcomes, adjust confidence
 * scoring based on historical accuracy, and log learning insights
 */
export class LearningFeedbackLoop {
  /**
   * Compare predicted vs actual outcomes for a completed trade
   * 
   * @param tradeSignalId - Trade signal ID to analyze
   * @returns Outcome comparison
   */
  async compareOutcomes(tradeSignalId: string): Promise<OutcomeComparison> {
    const performance = await getPerformanceByTradeSignalId(tradeSignalId);
    if (!performance) {
      throw new Error(`Performance record not found: ${tradeSignalId}`);
    }

    const tradeSignal = await getTradeSignalById(tradeSignalId);
    if (!tradeSignal) {
      throw new Error(`Trade signal not found: ${tradeSignalId}`);
    }

    // Entry comparison
    const entryPricePredicted = tradeSignal.entry_price;
    const entryPriceActual = performance.entry_price_actual || entryPricePredicted;
    const entrySlippage = performance.entry_slippage || 0;

    // Exit comparison
    const exitPricePredicted = this.calculatePredictedExitPrice(tradeSignal);
    const exitPriceActual = performance.exit_price_actual || 0;
    const exitSlippage = performance.exit_slippage || 0;

    // Profit/Loss comparison
    const profitLossPredicted = performance.profit_loss_predicted || 0;
    const profitLossActual = performance.profit_loss_usd || 0;
    const profitLossAccuracy = this.calculateAccuracy(
      profitLossPredicted,
      profitLossActual
    );

    // Confidence comparison
    const confidencePredicted = tradeSignal.confidence_overall;
    const wasSuccessful = profitLossActual > 0;
    const confidenceActual = wasSuccessful ? 100 : 0;
    const confidenceAccuracy = this.calculateConfidenceAccuracy(
      confidencePredicted,
      wasSuccessful
    );

    // Duration comparison
    const durationPredicted = performance.trade_duration_predicted;
    const durationActual = performance.trade_duration_minutes;
    const durationAccuracy = durationPredicted && durationActual
      ? this.calculateAccuracy(durationPredicted, durationActual)
      : undefined;

    // Target hit analysis
    const targetsHit = {
      tp1: performance.tp1_hit,
      tp2: performance.tp2_hit,
      tp3: performance.tp3_hit,
      stopLoss: performance.stop_loss_hit,
    };

    // Calculate overall deviation score
    const deviationScore = this.calculateDeviationScore({
      entrySlippage,
      exitSlippage,
      profitLossAccuracy,
      confidenceAccuracy,
      durationAccuracy,
    });

    const comparison: OutcomeComparison = {
      tradeSignalId,
      symbol: tradeSignal.symbol,
      positionType: tradeSignal.position_type,
      entryPricePredicted,
      entryPriceActual,
      entrySlippage,
      exitPricePredicted,
      exitPriceActual,
      exitSlippage,
      profitLossPredicted,
      profitLossActual,
      profitLossAccuracy,
      confidencePredicted,
      confidenceActual,
      confidenceAccuracy,
      durationPredicted,
      durationActual,
      durationAccuracy,
      targetsHit,
      wasSuccessful,
      deviationScore,
    };

    // Store comparison results in performance record
    await updatePerformanceMetrics(tradeSignalId, {
      confidence_actual: confidenceActual,
      confidence_accuracy: confidenceAccuracy,
      profit_loss_accuracy: profitLossAccuracy,
    });

    return comparison;
  }

  /**
   * Adjust confidence scoring based on historical accuracy
   * 
   * Analyzes historical performance to recommend confidence weight adjustments
   * 
   * @param userId - User ID to analyze (optional)
   * @returns Confidence adjustment recommendations
   */
  async adjustConfidenceScoring(
    userId?: string
  ): Promise<ConfidenceAdjustment[]> {
    const accuracy = await this.calculateHistoricalAccuracy(userId);
    const adjustments: ConfidenceAdjustment[] = [];

    // Analyze technical confidence
    if (accuracy.technicalAccuracy < 70) {
      adjustments.push({
        component: 'technical',
        currentWeight: 25, // Assumed equal weighting
        recommendedWeight: 20,
        reason: `Technical analysis accuracy is ${accuracy.technicalAccuracy.toFixed(1)}%, below target of 70%`,
        historicalAccuracy: accuracy.technicalAccuracy,
      });
    } else if (accuracy.technicalAccuracy > 85) {
      adjustments.push({
        component: 'technical',
        currentWeight: 25,
        recommendedWeight: 30,
        reason: `Technical analysis accuracy is ${accuracy.technicalAccuracy.toFixed(1)}%, above target - increase weight`,
        historicalAccuracy: accuracy.technicalAccuracy,
      });
    }

    // Analyze sentiment confidence
    if (accuracy.sentimentAccuracy < 70) {
      adjustments.push({
        component: 'sentiment',
        currentWeight: 25,
        recommendedWeight: 20,
        reason: `Sentiment analysis accuracy is ${accuracy.sentimentAccuracy.toFixed(1)}%, below target of 70%`,
        historicalAccuracy: accuracy.sentimentAccuracy,
      });
    } else if (accuracy.sentimentAccuracy > 85) {
      adjustments.push({
        component: 'sentiment',
        currentWeight: 25,
        recommendedWeight: 30,
        reason: `Sentiment analysis accuracy is ${accuracy.sentimentAccuracy.toFixed(1)}%, above target - increase weight`,
        historicalAccuracy: accuracy.sentimentAccuracy,
      });
    }

    // Analyze on-chain confidence
    if (accuracy.onchainAccuracy < 70) {
      adjustments.push({
        component: 'onchain',
        currentWeight: 25,
        recommendedWeight: 20,
        reason: `On-chain analysis accuracy is ${accuracy.onchainAccuracy.toFixed(1)}%, below target of 70%`,
        historicalAccuracy: accuracy.onchainAccuracy,
      });
    } else if (accuracy.onchainAccuracy > 85) {
      adjustments.push({
        component: 'onchain',
        currentWeight: 25,
        recommendedWeight: 30,
        reason: `On-chain analysis accuracy is ${accuracy.onchainAccuracy.toFixed(1)}%, above target - increase weight`,
        historicalAccuracy: accuracy.onchainAccuracy,
      });
    }

    // Analyze risk confidence
    if (accuracy.riskAccuracy < 70) {
      adjustments.push({
        component: 'risk',
        currentWeight: 25,
        recommendedWeight: 20,
        reason: `Risk analysis accuracy is ${accuracy.riskAccuracy.toFixed(1)}%, below target of 70%`,
        historicalAccuracy: accuracy.riskAccuracy,
      });
    } else if (accuracy.riskAccuracy > 85) {
      adjustments.push({
        component: 'risk',
        currentWeight: 25,
        recommendedWeight: 30,
        reason: `Risk analysis accuracy is ${accuracy.riskAccuracy.toFixed(1)}%, above target - increase weight`,
        historicalAccuracy: accuracy.riskAccuracy,
      });
    }

    return adjustments;
  }

  /**
   * Generate learning insights from historical performance
   * 
   * Identifies patterns and generates actionable recommendations
   * 
   * @param userId - User ID to analyze (optional)
   * @returns Learning insights
   */
  async generateLearningInsights(userId?: string): Promise<LearningInsight[]> {
    const accuracy = await this.calculateHistoricalAccuracy(userId);
    const insights: LearningInsight[] = [];

    // Confidence insights
    if (accuracy.overallAccuracy < 65) {
      insights.push({
        category: 'confidence',
        severity: 'high',
        insight: `Overall confidence accuracy is ${accuracy.overallAccuracy.toFixed(1)}%, significantly below target of 70%`,
        recommendation: 'Review and recalibrate all confidence scoring components. Consider reducing overall confidence scores by 10-15% until accuracy improves.',
        affectedTrades: accuracy.completedTrades,
        confidenceImpact: -15,
      });
    }

    // Timing insights
    if (accuracy.avgDurationDeviation > 50) {
      insights.push({
        category: 'timing',
        severity: 'medium',
        insight: `Trade duration predictions deviate by ${accuracy.avgDurationDeviation.toFixed(1)}% on average`,
        recommendation: 'Improve timeframe analysis methodology. Consider market volatility and volume patterns when predicting trade duration.',
        affectedTrades: accuracy.completedTrades,
        confidenceImpact: -5,
      });
    }

    // Target insights
    const targetHitRate = this.calculateTargetHitRate(accuracy);
    if (targetHitRate < 60) {
      insights.push({
        category: 'targets',
        severity: 'high',
        insight: `Take-profit targets are only hit ${targetHitRate.toFixed(1)}% of the time`,
        recommendation: 'Adjust take-profit calculations to be more conservative. Consider using wider Fibonacci levels and stronger resistance zones.',
        affectedTrades: accuracy.completedTrades,
        confidenceImpact: -10,
      });
    }

    // Risk insights
    if (accuracy.avgEntrySlippage > 2 || accuracy.avgExitSlippage > 2) {
      insights.push({
        category: 'risk',
        severity: 'medium',
        insight: `Average slippage is ${Math.max(accuracy.avgEntrySlippage, accuracy.avgExitSlippage).toFixed(2)}%, indicating execution challenges`,
        recommendation: 'Factor in higher slippage expectations for position sizing. Consider market liquidity and order book depth in risk calculations.',
        affectedTrades: accuracy.completedTrades,
        confidenceImpact: -5,
      });
    }

    // Position type insights
    if (Math.abs(accuracy.longAccuracy - accuracy.shortAccuracy) > 20) {
      const betterType = accuracy.longAccuracy > accuracy.shortAccuracy ? 'LONG' : 'SHORT';
      const worseType = betterType === 'LONG' ? 'SHORT' : 'LONG';
      
      insights.push({
        category: 'general',
        severity: 'medium',
        insight: `${betterType} positions perform ${Math.abs(accuracy.longAccuracy - accuracy.shortAccuracy).toFixed(1)}% better than ${worseType} positions`,
        recommendation: `Review ${worseType} position detection logic. Consider increasing confidence threshold for ${worseType} positions or adjusting indicator weights.`,
        affectedTrades: Math.floor(accuracy.completedTrades / 2),
        confidenceImpact: betterType === 'LONG' ? 5 : -5,
      });
    }

    // Timeframe insights
    const bestTimeframe = this.findBestTimeframe(accuracy.timeframeAccuracy);
    const worstTimeframe = this.findWorstTimeframe(accuracy.timeframeAccuracy);
    
    if (accuracy.timeframeAccuracy[worstTimeframe] < 60) {
      insights.push({
        category: 'general',
        severity: 'low',
        insight: `${worstTimeframe} timeframe has lowest accuracy at ${accuracy.timeframeAccuracy[worstTimeframe].toFixed(1)}%`,
        recommendation: `Reduce weight of ${worstTimeframe} timeframe in multi-timeframe analysis. Focus more on ${bestTimeframe} timeframe which has ${accuracy.timeframeAccuracy[bestTimeframe].toFixed(1)}% accuracy.`,
        affectedTrades: Math.floor(accuracy.completedTrades / 4),
        confidenceImpact: -3,
      });
    }

    // Positive insights
    if (accuracy.winRate > 70) {
      insights.push({
        category: 'general',
        severity: 'low',
        insight: `Excellent win rate of ${accuracy.winRate.toFixed(1)}% exceeds industry standards`,
        recommendation: 'Current strategy is performing well. Continue monitoring and maintain current confidence scoring methodology.',
        affectedTrades: accuracy.completedTrades,
        confidenceImpact: 5,
      });
    }

    return insights;
  }

  /**
   * Calculate historical accuracy metrics
   * 
   * @param userId - User ID to analyze (optional)
   * @returns Historical accuracy metrics
   */
  async calculateHistoricalAccuracy(userId?: string): Promise<HistoricalAccuracy> {
    // TODO: Implement database queries to get all completed trades
    // For now, return placeholder data structure
    
    // This would query:
    // 1. All completed trades for the user
    // 2. Performance records for those trades
    // 3. Calculate accuracy metrics across all dimensions
    
    const accuracy: HistoricalAccuracy = {
      totalTrades: 0,
      completedTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      technicalAccuracy: 0,
      sentimentAccuracy: 0,
      onchainAccuracy: 0,
      riskAccuracy: 0,
      overallAccuracy: 0,
      timeframeAccuracy: {
        '15m': 0,
        '1h': 0,
        '4h': 0,
        '1d': 0,
      },
      longAccuracy: 0,
      shortAccuracy: 0,
      avgEntrySlippage: 0,
      avgExitSlippage: 0,
      avgProfitLossDeviation: 0,
      avgDurationDeviation: 0,
    };

    // TODO: Implement actual calculations when database queries are available
    
    return accuracy;
  }

  /**
   * Log learning insights to database
   * 
   * Stores insights for future reference and trend analysis
   * 
   * @param tradeSignalId - Trade signal ID
   * @param insights - Learning insights to log
   */
  async logLearningInsights(
    tradeSignalId: string,
    insights: LearningInsight[]
  ): Promise<void> {
    // Store insights in performance record
    await updatePerformanceMetrics(tradeSignalId, {
      learning_insights: insights,
    });
  }

  /**
   * Log confidence adjustments to database
   * 
   * Stores adjustment recommendations for future reference
   * 
   * @param tradeSignalId - Trade signal ID
   * @param adjustments - Confidence adjustments to log
   */
  async logConfidenceAdjustments(
    tradeSignalId: string,
    adjustments: ConfidenceAdjustment[]
  ): Promise<void> {
    // Store adjustments in performance record
    await updatePerformanceMetrics(tradeSignalId, {
      adjustment_recommendations: adjustments,
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate predicted exit price based on take profit targets
   */
  private calculatePredictedExitPrice(tradeSignal: EinsteinTradeSignal): number {
    const tp1Weight = tradeSignal.tp1_allocation / 100;
    const tp2Weight = tradeSignal.tp2_allocation / 100;
    const tp3Weight = tradeSignal.tp3_allocation / 100;

    return (
      tradeSignal.tp1_price * tp1Weight +
      tradeSignal.tp2_price * tp2Weight +
      tradeSignal.tp3_price * tp3Weight
    );
  }

  /**
   * Calculate accuracy percentage between predicted and actual values
   */
  private calculateAccuracy(predicted: number, actual: number): number {
    if (predicted === 0) return 0;
    
    const difference = Math.abs(actual - predicted);
    const accuracy = Math.max(0, 100 - (difference / Math.abs(predicted)) * 100);
    
    return accuracy;
  }

  /**
   * Calculate confidence accuracy based on outcome
   */
  private calculateConfidenceAccuracy(
    predictedConfidence: number,
    wasSuccessful: boolean
  ): number {
    // If high confidence and won, or low confidence and lost, accuracy is high
    if (wasSuccessful) {
      return predictedConfidence;
    } else {
      return 100 - predictedConfidence;
    }
  }

  /**
   * Calculate overall deviation score
   */
  private calculateDeviationScore(metrics: {
    entrySlippage: number;
    exitSlippage: number;
    profitLossAccuracy: number;
    confidenceAccuracy: number;
    durationAccuracy?: number;
  }): number {
    const weights = {
      entrySlippage: 0.15,
      exitSlippage: 0.15,
      profitLossAccuracy: 0.35,
      confidenceAccuracy: 0.25,
      durationAccuracy: 0.10,
    };

    let score = 0;
    
    // Lower slippage is better (invert)
    score += (100 - Math.abs(metrics.entrySlippage)) * weights.entrySlippage;
    score += (100 - Math.abs(metrics.exitSlippage)) * weights.exitSlippage;
    
    // Higher accuracy is better
    score += metrics.profitLossAccuracy * weights.profitLossAccuracy;
    score += metrics.confidenceAccuracy * weights.confidenceAccuracy;
    
    if (metrics.durationAccuracy !== undefined) {
      score += metrics.durationAccuracy * weights.durationAccuracy;
    }

    // Invert so lower score means better performance
    return 100 - score;
  }

  /**
   * Calculate target hit rate from accuracy metrics
   */
  private calculateTargetHitRate(accuracy: HistoricalAccuracy): number {
    // Placeholder - would calculate from actual target hit data
    return 65; // Default assumption
  }

  /**
   * Find best performing timeframe
   */
  private findBestTimeframe(
    timeframeAccuracy: HistoricalAccuracy['timeframeAccuracy']
  ): '15m' | '1h' | '4h' | '1d' {
    let best: '15m' | '1h' | '4h' | '1d' = '15m';
    let bestAccuracy = 0;

    for (const [timeframe, accuracy] of Object.entries(timeframeAccuracy)) {
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        best = timeframe as '15m' | '1h' | '4h' | '1d';
      }
    }

    return best;
  }

  /**
   * Find worst performing timeframe
   */
  private findWorstTimeframe(
    timeframeAccuracy: HistoricalAccuracy['timeframeAccuracy']
  ): '15m' | '1h' | '4h' | '1d' {
    let worst: '15m' | '1h' | '4h' | '1d' = '15m';
    let worstAccuracy = 100;

    for (const [timeframe, accuracy] of Object.entries(timeframeAccuracy)) {
      if (accuracy < worstAccuracy) {
        worstAccuracy = accuracy;
        worst = timeframe as '15m' | '1h' | '4h' | '1d';
      }
    }

    return worst;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance of LearningFeedbackLoop
 */
export const learningFeedbackLoop = new LearningFeedbackLoop();

/**
 * Default export
 */
export default LearningFeedbackLoop;
