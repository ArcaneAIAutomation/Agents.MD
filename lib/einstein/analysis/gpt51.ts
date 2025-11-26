/**
 * Einstein 100000x Trade Generation Engine - GPT-5.1 Analysis Engine
 * 
 * This module implements the core AI analysis engine using OpenAI GPT-5.1
 * with "high" reasoning effort for maximum intelligence and comprehensive
 * trade signal generation.
 * 
 * Features:
 * - Einstein-level analysis with GPT-5.1 high reasoning mode
 * - Multi-dimensional market analysis (technical, sentiment, on-chain, risk)
 * - Automatic position type detection (LONG/SHORT/NO_TRADE)
 * - Confidence scoring across all analysis dimensions
 * - Detailed reasoning generation for transparency
 * 
 * Requirements: 1.1 (Einstein-Level AI Analysis), 1.2 (Detailed Reasoning), 1.3 (Confidence Scores)
 */

import { openai, OPENAI_MODEL, extractResponseText, validateResponseText } from '../../openai';
import type {
  AIAnalysis,
  ComprehensiveData,
  PositionType,
  ConfidenceScore,
  AIReasoning,
  TakeProfitTargets,
  TimeframeAlignment,
  EinsteinConfig,
  DataQualityScore
} from '../types';

/**
 * GPT-5.1 Analysis Engine
 * 
 * Provides Einstein-level market analysis using GPT-5.1 with high reasoning effort.
 * This is the core intelligence component of the Einstein Trade Generation Engine.
 */
export class GPT51AnalysisEngine {
  private config: EinsteinConfig;
  
  constructor(config: EinsteinConfig) {
    this.config = config;
  }
  
  /**
   * Analyze market data and generate comprehensive trade signal
   * 
   * This is the main entry point for AI analysis. It takes comprehensive
   * market data and returns a complete AI analysis with position type,
   * confidence scores, entry/exit points, and detailed reasoning.
   * 
   * @param data - Comprehensive market data from all sources
   * @returns Complete AI analysis with trade signal
   */
  async analyzeMarket(data: ComprehensiveData): Promise<AIAnalysis> {
    console.log('[GPT51AnalysisEngine] Starting Einstein-level analysis...');
    console.log(`[GPT51AnalysisEngine] Symbol: ${this.config.symbol}, Timeframe: ${this.config.timeframe}`);
    
    try {
      // Build comprehensive analysis prompt
      const prompt = this.buildAnalysisPrompt(data);
      
      // Call GPT-5.1 with HIGH reasoning effort for maximum intelligence
      console.log('[GPT51AnalysisEngine] Calling GPT-5.1 with HIGH reasoning effort...');
      const completion = await openai.responses.create({
        model: OPENAI_MODEL,
        input: prompt,
        reasoning: {
          effort: 'high' // Maximum intelligence for Einstein-level analysis
        },
        text: {
          verbosity: 'high' // Detailed analysis
        },
        max_output_tokens: 16000 // Large output for comprehensive analysis
      });
      
      // Extract response using bulletproof utility
      const responseText = extractResponseText(completion, true);
      validateResponseText(responseText, OPENAI_MODEL, completion);
      
      console.log('[GPT51AnalysisEngine] GPT-5.1 analysis complete');
      
      // Parse JSON response
      const analysisData = JSON.parse(responseText);
      
      // Construct complete AI analysis
      const analysis: AIAnalysis = {
        positionType: analysisData.positionType as PositionType,
        confidence: analysisData.confidence as ConfidenceScore,
        reasoning: analysisData.reasoning as AIReasoning,
        entry: analysisData.entry,
        stopLoss: analysisData.stopLoss,
        takeProfits: analysisData.takeProfits as TakeProfitTargets,
        timeframeAlignment: analysisData.timeframeAlignment as TimeframeAlignment,
        riskReward: analysisData.riskReward
      };
      
      console.log(`[GPT51AnalysisEngine] Position: ${analysis.positionType}, Confidence: ${analysis.confidence.overall}%`);
      
      return analysis;
    } catch (error: any) {
      console.error('[GPT51AnalysisEngine] Analysis failed:', error.message);
      throw new Error(`GPT-5.1 analysis failed: ${error.message}`);
    }
  }
  
  /**
   * Determine position type from analysis
   * 
   * Analyzes all indicators and data to determine whether to go LONG, SHORT,
   * or NO_TRADE. Uses weighted scoring across technical, sentiment, on-chain,
   * and risk factors.
   * 
   * @param analysis - Complete AI analysis
   * @returns Position type (LONG/SHORT/NO_TRADE)
   */
  determinePositionType(analysis: AIAnalysis): PositionType {
    // Position type is already determined by GPT-5.1 analysis
    // This method validates and returns it
    
    const { positionType, confidence } = analysis;
    
    // Validate confidence threshold (minimum 60%)
    if (confidence.overall < this.config.minConfidence) {
      console.log(`[GPT51AnalysisEngine] Confidence ${confidence.overall}% below threshold ${this.config.minConfidence}%`);
      return 'NO_TRADE';
    }
    
    console.log(`[GPT51AnalysisEngine] Position type: ${positionType} (confidence: ${confidence.overall}%)`);
    return positionType;
  }
  
  /**
   * Calculate confidence scores across all dimensions
   * 
   * Computes confidence scores for technical, sentiment, on-chain, and risk
   * analysis, then calculates an overall weighted confidence score.
   * 
   * This method can work in two modes:
   * 1. Validation mode: If analysis already has confidence scores from GPT-5.1, validate them
   * 2. Calculation mode: If no confidence scores, calculate them from data quality and analysis
   * 
   * Task 16: Implement confidence scoring
   * Requirements: 1.3 (Confidence scores)
   * 
   * @param analysis - Complete AI analysis
   * @param dataQuality - Optional data quality scores for weighting
   * @returns Confidence scores
   */
  calculateConfidence(analysis: AIAnalysis, dataQuality?: DataQualityScore): ConfidenceScore {
    // If analysis already has confidence scores (from GPT-5.1), validate and return them
    if (analysis.confidence && this.isValidConfidenceScore(analysis.confidence)) {
      console.log('[GPT51AnalysisEngine] Using GPT-5.1 confidence scores');
      return this.validateConfidenceScores(analysis.confidence);
    }
    
    // Otherwise, calculate confidence scores from analysis components and data quality
    console.log('[GPT51AnalysisEngine] Calculating confidence scores from analysis');
    return this.computeConfidenceScores(analysis, dataQuality);
  }
  
  /**
   * Check if confidence score object is valid
   */
  private isValidConfidenceScore(confidence: ConfidenceScore): boolean {
    return (
      typeof confidence.overall === 'number' &&
      typeof confidence.technical === 'number' &&
      typeof confidence.sentiment === 'number' &&
      typeof confidence.onChain === 'number' &&
      typeof confidence.risk === 'number'
    );
  }
  
  /**
   * Validate confidence scores are in valid range
   */
  private validateConfidenceScores(confidence: ConfidenceScore): ConfidenceScore {
    const scores = [
      confidence.overall,
      confidence.technical,
      confidence.sentiment,
      confidence.onChain,
      confidence.risk
    ];
    
    for (const score of scores) {
      if (score < 0 || score > 100) {
        throw new Error(`Invalid confidence score: ${score} (must be 0-100)`);
      }
    }
    
    console.log('[GPT51AnalysisEngine] Confidence scores validated');
    console.log(`  Overall: ${confidence.overall}%`);
    console.log(`  Technical: ${confidence.technical}%`);
    console.log(`  Sentiment: ${confidence.sentiment}%`);
    console.log(`  On-Chain: ${confidence.onChain}%`);
    console.log(`  Risk: ${confidence.risk}%`);
    
    return confidence;
  }
  
  /**
   * Compute confidence scores from analysis components and data quality
   * 
   * This is the core confidence calculation algorithm that:
   * 1. Calculates confidence for each dimension (technical, sentiment, on-chain, risk)
   * 2. Weights scores based on data quality
   * 3. Calculates overall weighted confidence score
   * 
   * Task 16: Core confidence calculation implementation
   */
  private computeConfidenceScores(
    analysis: AIAnalysis,
    dataQuality?: DataQualityScore
  ): ConfidenceScore {
    // Calculate individual dimension confidence scores
    const technicalConfidence = this.calculateTechnicalConfidence(analysis);
    const sentimentConfidence = this.calculateSentimentConfidence(analysis);
    const onChainConfidence = this.calculateOnChainConfidence(analysis);
    const riskConfidence = this.calculateRiskConfidence(analysis);
    
    // Apply data quality weighting if available
    let weightedTechnical = technicalConfidence;
    let weightedSentiment = sentimentConfidence;
    let weightedOnChain = onChainConfidence;
    let weightedRisk = riskConfidence;
    
    if (dataQuality) {
      // Weight each dimension by its data quality (0-100)
      weightedTechnical = (technicalConfidence * dataQuality.technical) / 100;
      weightedSentiment = (sentimentConfidence * dataQuality.sentiment) / 100;
      weightedOnChain = (onChainConfidence * dataQuality.onChain) / 100;
      // Risk uses overall data quality as it depends on all dimensions
      weightedRisk = (riskConfidence * dataQuality.overall) / 100;
      
      console.log('[GPT51AnalysisEngine] Applied data quality weighting');
      console.log(`  Technical: ${technicalConfidence}% → ${weightedTechnical.toFixed(1)}%`);
      console.log(`  Sentiment: ${sentimentConfidence}% → ${weightedSentiment.toFixed(1)}%`);
      console.log(`  On-Chain: ${onChainConfidence}% → ${weightedOnChain.toFixed(1)}%`);
      console.log(`  Risk: ${riskConfidence}% → ${weightedRisk.toFixed(1)}%`);
    }
    
    // Calculate overall confidence as weighted average
    // Weights: Technical 35%, Sentiment 25%, On-Chain 25%, Risk 15%
    const overall = (
      weightedTechnical * 0.35 +
      weightedSentiment * 0.25 +
      weightedOnChain * 0.25 +
      weightedRisk * 0.15
    );
    
    const confidence: ConfidenceScore = {
      overall: Math.round(overall),
      technical: Math.round(weightedTechnical),
      sentiment: Math.round(weightedSentiment),
      onChain: Math.round(weightedOnChain),
      risk: Math.round(weightedRisk)
    };
    
    console.log('[GPT51AnalysisEngine] Confidence scores calculated');
    console.log(`  Overall: ${confidence.overall}%`);
    console.log(`  Technical: ${confidence.technical}%`);
    console.log(`  Sentiment: ${confidence.sentiment}%`);
    console.log(`  On-Chain: ${confidence.onChain}%`);
    console.log(`  Risk: ${confidence.risk}%`);
    
    return confidence;
  }
  
  /**
   * Calculate technical analysis confidence
   * 
   * Based on:
   * - Timeframe alignment (higher alignment = higher confidence)
   * - Signal strength and clarity
   * - Indicator agreement
   */
  private calculateTechnicalConfidence(analysis: AIAnalysis): number {
    let confidence = 50; // Base confidence
    
    // Timeframe alignment contributes up to 30 points
    if (analysis.timeframeAlignment) {
      confidence += (analysis.timeframeAlignment.alignment * 0.3);
    }
    
    // Risk-reward ratio contributes up to 20 points
    // Higher risk-reward = higher confidence
    if (analysis.riskReward >= 3) {
      confidence += 20;
    } else if (analysis.riskReward >= 2) {
      confidence += 10;
    }
    
    // Ensure within bounds
    return Math.min(100, Math.max(0, confidence));
  }
  
  /**
   * Calculate sentiment analysis confidence
   * 
   * Based on:
   * - Social metrics strength
   * - News sentiment clarity
   * - Overall sentiment consistency
   */
  private calculateSentimentConfidence(analysis: AIAnalysis): number {
    let confidence = 50; // Base confidence
    
    // Strong position type indicates clear sentiment
    if (analysis.positionType === 'LONG' || analysis.positionType === 'SHORT') {
      confidence += 30;
    } else {
      confidence -= 20; // NO_TRADE indicates unclear sentiment
    }
    
    // Reasoning quality contributes up to 20 points
    if (analysis.reasoning?.sentiment && analysis.reasoning.sentiment.length > 100) {
      confidence += 20;
    }
    
    // Ensure within bounds
    return Math.min(100, Math.max(0, confidence));
  }
  
  /**
   * Calculate on-chain analysis confidence
   * 
   * Based on:
   * - Whale activity clarity
   * - Exchange flow patterns
   * - Holder distribution insights
   */
  private calculateOnChainConfidence(analysis: AIAnalysis): number {
    let confidence = 50; // Base confidence
    
    // Strong position type indicates clear on-chain signals
    if (analysis.positionType === 'LONG' || analysis.positionType === 'SHORT') {
      confidence += 30;
    } else {
      confidence -= 20; // NO_TRADE indicates unclear signals
    }
    
    // Reasoning quality contributes up to 20 points
    if (analysis.reasoning?.onChain && analysis.reasoning.onChain.length > 100) {
      confidence += 20;
    }
    
    // Ensure within bounds
    return Math.min(100, Math.max(0, confidence));
  }
  
  /**
   * Calculate risk assessment confidence
   * 
   * Based on:
   * - Risk-reward ratio quality
   * - Stop-loss placement
   * - Position sizing appropriateness
   */
  private calculateRiskConfidence(analysis: AIAnalysis): number {
    let confidence = 50; // Base confidence
    
    // Good risk-reward ratio contributes up to 30 points
    if (analysis.riskReward >= 3) {
      confidence += 30;
    } else if (analysis.riskReward >= 2) {
      confidence += 20;
    } else if (analysis.riskReward >= 1.5) {
      confidence += 10;
    }
    
    // Valid stop-loss and entry contributes up to 20 points
    if (analysis.stopLoss > 0 && analysis.entry > 0) {
      const stopDistance = Math.abs(analysis.entry - analysis.stopLoss);
      const entryPercent = (stopDistance / analysis.entry) * 100;
      
      // Reasonable stop distance (2-10% from entry)
      if (entryPercent >= 2 && entryPercent <= 10) {
        confidence += 20;
      } else if (entryPercent >= 1 && entryPercent <= 15) {
        confidence += 10;
      }
    }
    
    // Ensure within bounds
    return Math.min(100, Math.max(0, confidence));
  }
  
  /**
   * Generate detailed reasoning for the trade signal
   * 
   * Provides human-readable explanations for each component of the analysis
   * (technical, sentiment, on-chain, risk) and an overall synthesis.
   * 
   * @param analysis - Complete AI analysis
   * @returns Detailed reasoning
   */
  generateReasoning(analysis: AIAnalysis): AIReasoning {
    // Reasoning is already generated by GPT-5.1
    // This method validates and returns it
    
    const { reasoning } = analysis;
    
    // Validate all reasoning fields are present and non-empty
    const fields = [
      { name: 'technical', value: reasoning.technical },
      { name: 'sentiment', value: reasoning.sentiment },
      { name: 'onChain', value: reasoning.onChain },
      { name: 'risk', value: reasoning.risk },
      { name: 'overall', value: reasoning.overall }
    ];
    
    for (const field of fields) {
      if (!field.value || field.value.trim().length === 0) {
        throw new Error(`Missing or empty reasoning for ${field.name}`);
      }
    }
    
    console.log('[GPT51AnalysisEngine] Reasoning validated');
    console.log(`  Technical: ${reasoning.technical.substring(0, 100)}...`);
    console.log(`  Sentiment: ${reasoning.sentiment.substring(0, 100)}...`);
    console.log(`  On-Chain: ${reasoning.onChain.substring(0, 100)}...`);
    console.log(`  Risk: ${reasoning.risk.substring(0, 100)}...`);
    console.log(`  Overall: ${reasoning.overall.substring(0, 100)}...`);
    
    return reasoning;
  }
  
  /**
   * Build comprehensive analysis prompt for GPT-5.1
   * 
   * Constructs a detailed prompt that includes all market data dimensions,
   * requests structured JSON output, and provides examples for position type determination.
   * 
   * Task 14: Comprehensive analysis prompt with all data dimensions and examples
   * Requirements: 1.2 (Detailed reasoning), 1.3 (Confidence scores)
   * 
   * @param data - Comprehensive market data
   * @returns Formatted prompt string
   */
  private buildAnalysisPrompt(data: ComprehensiveData): string {
    const { symbol, timeframe, accountBalance, riskTolerance, minRiskReward, maxLoss } = this.config;
    
    // Build comprehensive prompt - see next file chunk
    return this.buildPromptContent(data, symbol, timeframe, accountBalance, riskTolerance, minRiskReward, maxLoss);
  }
  
  /**
   * Build the actual prompt content (separated for readability)
   */
  private buildPromptContent(
    data: ComprehensiveData,
    symbol: string,
    timeframe: string,
    accountBalance: number,
    riskTolerance: number,
    minRiskReward: number,
    maxLoss: number
  ): string {
    return `You are Einstein, the world's most intelligent cryptocurrency trading analyst with maximum reasoning capability.

TASK: Analyze comprehensive market data and generate a trade signal with detailed reasoning across ALL dimensions.

# TRADING PARAMETERS
Symbol: ${symbol}
Timeframe: ${timeframe}
Account Balance: $${accountBalance.toLocaleString()}
Risk Tolerance: ${riskTolerance}% per trade
Min Risk-Reward: ${minRiskReward}:1
Max Loss: ${maxLoss}% of account

# MARKET DATA
Price: $${data.market.price.toLocaleString()}
24h Change: ${data.market.change24h >= 0 ? '+' : ''}${data.market.change24h.toFixed(2)}%
24h Volume: $${data.market.volume24h.toLocaleString()}
Market Cap: $${data.market.marketCap.toLocaleString()}
24h High: $${data.market.high24h.toLocaleString()}
24h Low: $${data.market.low24h.toLocaleString()}

# TECHNICAL INDICATORS
RSI: ${data.technical.indicators.rsi.toFixed(2)} ${data.technical.indicators.rsi > 70 ? '(Overbought)' : data.technical.indicators.rsi < 30 ? '(Oversold)' : '(Neutral)'}
MACD: ${data.technical.indicators.macd.value.toFixed(2)} (Signal: ${data.technical.indicators.macd.signal.toFixed(2)})
EMA 9: $${data.technical.indicators.ema.ema9.toLocaleString()}
EMA 21: $${data.technical.indicators.ema.ema21.toLocaleString()}
EMA 50: $${data.technical.indicators.ema.ema50.toLocaleString()}
EMA 200: $${data.technical.indicators.ema.ema200.toLocaleString()}
Bollinger Bands: Upper $${data.technical.indicators.bollingerBands.upper.toLocaleString()}, Middle $${data.technical.indicators.bollingerBands.middle.toLocaleString()}, Lower $${data.technical.indicators.bollingerBands.lower.toLocaleString()}
ATR: ${data.technical.indicators.atr.toFixed(2)}
Stochastic: K ${data.technical.indicators.stochastic.k.toFixed(2)}, D ${data.technical.indicators.stochastic.d.toFixed(2)}

# SENTIMENT DATA
LunarCrush Galaxy Score: ${data.sentiment.social.lunarCrush.galaxyScore}/100
LunarCrush Alt Rank: #${data.sentiment.social.lunarCrush.altRank}
Twitter Mentions: ${data.sentiment.social.twitter.mentions}
Twitter Sentiment: ${data.sentiment.social.twitter.sentiment.toFixed(2)}
Reddit Posts: ${data.sentiment.social.reddit.posts}
Reddit Sentiment: ${data.sentiment.social.reddit.sentiment.toFixed(2)}
News Articles: ${data.sentiment.news.articles}
News Sentiment: ${data.sentiment.news.sentiment.toFixed(2)}

# ON-CHAIN DATA
Whale Transactions: ${data.onChain.whaleActivity.transactions}
Whale Total Value: $${data.onChain.whaleActivity.totalValue.toLocaleString()}
Exchange Deposits: ${data.onChain.exchangeFlows.deposits}
Exchange Withdrawals: ${data.onChain.exchangeFlows.withdrawals}
Net Flow: ${data.onChain.exchangeFlows.netFlow > 0 ? '+' : ''}${data.onChain.exchangeFlows.netFlow}
Whale Holders: ${data.onChain.holderDistribution.whales}
Retail Holders: ${data.onChain.holderDistribution.retail}
Concentration: ${data.onChain.holderDistribution.concentration.toFixed(2)}%

# ANALYSIS INSTRUCTIONS

1. TECHNICAL ANALYSIS: Analyze RSI, MACD, EMAs, Bollinger Bands, ATR, Stochastic
2. SENTIMENT ANALYSIS: Evaluate social metrics, news sentiment, overall market mood
3. ON-CHAIN ANALYSIS: Assess whale activity, exchange flows, holder distribution
4. RISK ASSESSMENT: Evaluate volatility, liquidity, market conditions
5. TIMEFRAME ALIGNMENT: Analyze 15m, 1h, 4h, 1d trends
6. POSITION TYPE: Determine LONG, SHORT, or NO_TRADE based on weighted scoring

# POSITION TYPE EXAMPLES

LONG Example:
- Technical: RSI < 40, MACD bullish crossover, price > EMA21
- Sentiment: Galaxy Score > 60, positive social/news sentiment
- On-Chain: Net flow > 0, withdrawals > deposits (accumulation)
- Confidence: Overall > 60%

SHORT Example:
- Technical: RSI > 60, MACD bearish crossover, price < EMA21
- Sentiment: Galaxy Score < 40, negative social/news sentiment
- On-Chain: Net flow < 0, deposits > withdrawals (distribution)
- Confidence: Overall > 60%

NO_TRADE Example:
- Conflicting signals across dimensions
- Low confidence (< 60%)
- Extreme volatility or unclear market structure

# OUTPUT FORMAT (Strict JSON)
{
  "positionType": "LONG" | "SHORT" | "NO_TRADE",
  "confidence": {
    "overall": 0-100,
    "technical": 0-100,
    "sentiment": 0-100,
    "onChain": 0-100,
    "risk": 0-100
  },
  "reasoning": {
    "technical": "Detailed technical analysis (100+ words)",
    "sentiment": "Detailed sentiment analysis (100+ words)",
    "onChain": "Detailed on-chain analysis (100+ words)",
    "risk": "Detailed risk assessment (100+ words)",
    "overall": "Overall synthesis and recommendation (100+ words)"
  },
  "entry": number,
  "stopLoss": number,
  "takeProfits": {
    "tp1": { "price": number, "allocation": 50 },
    "tp2": { "price": number, "allocation": 30 },
    "tp3": { "price": number, "allocation": 20 }
  },
  "timeframeAlignment": {
    "15m": "BULLISH" | "BEARISH" | "NEUTRAL",
    "1h": "BULLISH" | "BEARISH" | "NEUTRAL",
    "4h": "BULLISH" | "BEARISH" | "NEUTRAL",
    "1d": "BULLISH" | "BEARISH" | "NEUTRAL",
    "alignment": 0-100
  },
  "riskReward": number
}

# CRITICAL RULES
1. If confidence < 60%, return "NO_TRADE"
2. For LONG: stopLoss < entry < tp1 < tp2 < tp3
3. For SHORT: stopLoss > entry > tp1 > tp2 > tp3
4. Risk-reward ratio ≥ ${minRiskReward}:1
5. Max loss ≤ ${maxLoss}% of account ($${(accountBalance * maxLoss / 100).toLocaleString()})
6. Provide detailed reasoning for EVERY dimension (minimum 100 words each)
7. Cite specific indicator values in your reasoning
8. Address conflicting signals explicitly

Respond ONLY with valid JSON. No additional text.`;
  }
}

/**
 * Create a new GPT-5.1 analysis engine instance
 * 
 * @param config - Einstein engine configuration
 * @returns GPT-5.1 analysis engine instance
 */
export function createGPT51AnalysisEngine(config: EinsteinConfig): GPT51AnalysisEngine {
  return new GPT51AnalysisEngine(config);
}
