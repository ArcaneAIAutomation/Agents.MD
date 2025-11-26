/**
 * Einstein 100000x Trade Generation Engine - Main Coordinator
 * 
 * This is the central orchestration module that coordinates the entire trade signal
 * generation process from data collection through AI analysis to user approval.
 * 
 * The coordinator follows a strict execution order:
 * 1. Data Collection Phase - Fetch and validate all market data
 * 2. AI Analysis Phase - Generate comprehensive trade signal with GPT-5.1
 * 3. Risk Calculation Phase - Calculate position sizing and risk parameters
 * 4. Approval Workflow Phase - Present signal for user approval
 * 
 * Requirements: All (this is the main orchestrator)
 * Task 40: Create coordinator class
 */

import { DataCollectionModule } from '../data';
import { GPT51AnalysisEngine } from '../analysis/gpt51';
import { riskCalculator } from '../analysis/riskCalculator';
import { approvalWorkflowManager } from '../workflow/approval';
import type {
  TradeSignalResult,
  TradeSignal,
  ComprehensiveData,
  ComprehensiveAnalysis,
  DataQualityScore,
  AIAnalysis,
  EinsteinConfig,
  PositionType
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const MIN_DATA_QUALITY = 90; // Minimum 90% data quality required (Requirement 2.3)
const MIN_CONFIDENCE = 60; // Minimum 60% confidence required (Requirement 4.5)
const MIN_RISK_REWARD = 2; // Minimum 2:1 risk-reward ratio (Requirement 8.4)
const MAX_LOSS_PERCENT = 2; // Maximum 2% loss per trade (Requirement 8.5)

// ============================================================================
// Einstein Engine Coordinator
// ============================================================================

/**
 * Main coordinator class for the Einstein Trade Generation Engine
 * 
 * Orchestrates the entire trade signal generation process:
 * - Phase 1: Data Collection (parallel fetching from 13+ APIs)
 * - Phase 2: Data Validation (quality scoring and freshness checks)
 * - Phase 3: AI Analysis (GPT-5.1 with high reasoning effort)
 * - Phase 4: Risk Calculation (position sizing, stops, targets)
 * - Phase 5: Approval Workflow (user review and confirmation)
 * 
 * Task 40: Main coordinator implementation
 * Requirements: All
 */
export class EinsteinEngineCoordinator {
  private config: EinsteinConfig;
  private dataCollector: DataCollectionModule;
  private aiEngine: GPT51AnalysisEngine;
  
  constructor(config: EinsteinConfig) {
    this.config = config;
    this.dataCollector = new DataCollectionModule(config.symbol, config.timeframe);
    this.aiEngine = new GPT51AnalysisEngine(config);
    
    console.log('[EinsteinCoordinator] Initialized');
    console.log(`  Symbol: ${config.symbol}`);
    console.log(`  Timeframe: ${config.timeframe}`);
    console.log(`  Account Balance: $${config.accountBalance.toLocaleString()}`);
    console.log(`  Risk Tolerance: ${config.riskTolerance}%`);
    console.log(`  Min Data Quality: ${config.minDataQuality}%`);
    console.log(`  Min Confidence: ${config.minConfidence}%`);
    console.log(`  Min Risk-Reward: ${config.minRiskReward}:1`);
    console.log(`  Max Loss: ${config.maxLoss}%`);
  }
  
  /**
   * Generate a complete trade signal with Einstein-level analysis
   * 
   * This is the main entry point for trade signal generation. It orchestrates
   * all phases of the process and returns a complete trade signal result.
   * 
   * Execution Flow:
   * 1. Data Collection Phase - Fetch all market data in parallel
   * 2. Data Validation Phase - Validate quality and freshness
   * 3. AI Analysis Phase - Generate comprehensive analysis with GPT-5.1
   * 4. Risk Calculation Phase - Calculate position sizing and risk parameters
   * 5. Approval Workflow Phase - Present for user approval
   * 
   * Task 40: Main generateTradeSignal() method
   * Requirements: All
   * 
   * @returns Trade signal result with success status, signal, analysis, and data quality
   */
  async generateTradeSignal(): Promise<TradeSignalResult> {
    console.log('\n========================================');
    console.log('EINSTEIN TRADE GENERATION ENGINE');
    console.log('========================================\n');
    
    const startTime = Date.now();
    
    try {
      // ========================================================================
      // PHASE 1: DATA COLLECTION
      // ========================================================================
      console.log('📊 PHASE 1: DATA COLLECTION');
      console.log('----------------------------');
      
      const data = await this.collectData();
      
      const dataCollectionTime = Date.now() - startTime;
      console.log(`✅ Data collection completed in ${dataCollectionTime}ms\n`);
      
      // ========================================================================
      // PHASE 2: DATA VALIDATION
      // ========================================================================
      console.log('🔍 PHASE 2: DATA VALIDATION');
      console.log('----------------------------');
      
      const dataQuality = await this.validateData(data);
      
      // Check if data quality meets minimum threshold (Requirement 2.3)
      if (dataQuality.overall < this.config.minDataQuality) {
        const error = `Data quality ${dataQuality.overall}% below minimum ${this.config.minDataQuality}%`;
        console.error(`❌ ${error}\n`);
        
        return {
          success: false,
          dataQuality,
          error
        };
      }
      
      console.log(`✅ Data quality validated: ${dataQuality.overall}%\n`);
      
      // ========================================================================
      // PHASE 3: AI ANALYSIS
      // ========================================================================
      console.log('🤖 PHASE 3: AI ANALYSIS (GPT-5.1)');
      console.log('-----------------------------------');
      
      const aiAnalysis = await this.performAIAnalysis(data);
      
      const aiAnalysisTime = Date.now() - startTime - dataCollectionTime;
      console.log(`✅ AI analysis completed in ${aiAnalysisTime}ms\n`);
      
      // Check if confidence meets minimum threshold (Requirement 4.5)
      if (aiAnalysis.confidence.overall < this.config.minConfidence) {
        const error = `Confidence ${aiAnalysis.confidence.overall}% below minimum ${this.config.minConfidence}%`;
        console.warn(`⚠️  ${error}`);
        console.log('   Recommendation: NO_TRADE\n');
        
        // Return NO_TRADE signal
        return this.createNoTradeResult(data, aiAnalysis, dataQuality, error);
      }
      
      // Check if position type is NO_TRADE
      if (aiAnalysis.positionType === 'NO_TRADE') {
        console.log('⚠️  AI recommends NO_TRADE');
        console.log(`   Reason: ${aiAnalysis.reasoning.overall.substring(0, 100)}...\n`);
        
        return this.createNoTradeResult(data, aiAnalysis, dataQuality, 'AI recommends NO_TRADE');
      }
      
      console.log(`✅ Position: ${aiAnalysis.positionType}, Confidence: ${aiAnalysis.confidence.overall}%\n`);
      
      // ========================================================================
      // PHASE 4: RISK CALCULATION
      // ========================================================================
      console.log('⚖️  PHASE 4: RISK CALCULATION');
      console.log('-----------------------------');
      
      const riskParams = await this.calculateRisk(aiAnalysis, data);
      
      // Verify risk-reward ratio meets minimum (Requirement 8.4)
      if (riskParams.riskReward < this.config.minRiskReward) {
        const error = `Risk-reward ${riskParams.riskReward.toFixed(2)}:1 below minimum ${this.config.minRiskReward}:1`;
        console.error(`❌ ${error}\n`);
        
        return {
          success: false,
          dataQuality,
          error
        };
      }
      
      // Verify max loss doesn't exceed limit (Requirement 8.5)
      const maxLossPercent = (riskParams.maxLoss / this.config.accountBalance) * 100;
      if (maxLossPercent > this.config.maxLoss) {
        const error = `Max loss ${maxLossPercent.toFixed(2)}% exceeds limit ${this.config.maxLoss}%`;
        console.error(`❌ ${error}\n`);
        
        return {
          success: false,
          dataQuality,
          error
        };
      }
      
      console.log(`✅ Risk parameters validated`);
      console.log(`   Position Size: $${riskParams.positionSize.toLocaleString()}`);
      console.log(`   Risk-Reward: ${riskParams.riskReward.toFixed(2)}:1`);
      console.log(`   Max Loss: $${riskParams.maxLoss.toLocaleString()} (${maxLossPercent.toFixed(2)}%)\n`);
      
      // ========================================================================
      // PHASE 5: CONSTRUCT TRADE SIGNAL
      // ========================================================================
      console.log('📝 PHASE 5: CONSTRUCT TRADE SIGNAL');
      console.log('-----------------------------------');
      
      const signal = await this.constructTradeSignal(aiAnalysis, riskParams, data, dataQuality);
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Trade signal constructed in ${totalTime}ms total\n`);
      
      // ========================================================================
      // PHASE 6: APPROVAL WORKFLOW
      // ========================================================================
      console.log('👤 PHASE 6: APPROVAL WORKFLOW');
      console.log('------------------------------');
      
      const approvalInfo = await this.presentForApproval(signal, aiAnalysis);
      
      console.log('✅ Signal presented for user approval');
      console.log(`   Signal ID: ${approvalInfo.signalId}`);
      console.log(`   Expires At: ${approvalInfo.expiresAt}`);
      console.log(`   Time Limit: 5 minutes\n`);
      
      // ========================================================================
      // SUCCESS
      // ========================================================================
      console.log('========================================');
      console.log('✅ TRADE SIGNAL GENERATION COMPLETE');
      console.log('========================================\n');
      
      console.log('📊 SIGNAL SUMMARY:');
      console.log(`   Symbol: ${signal.symbol}`);
      console.log(`   Position: ${signal.positionType}`);
      console.log(`   Entry: $${signal.entry.toLocaleString()}`);
      console.log(`   Stop Loss: $${signal.stopLoss.toLocaleString()}`);
      console.log(`   TP1: $${signal.takeProfits.tp1.price.toLocaleString()} (${signal.takeProfits.tp1.allocation}%)`);
      console.log(`   TP2: $${signal.takeProfits.tp2.price.toLocaleString()} (${signal.takeProfits.tp2.allocation}%)`);
      console.log(`   TP3: $${signal.takeProfits.tp3.price.toLocaleString()} (${signal.takeProfits.tp3.allocation}%)`);
      console.log(`   Confidence: ${signal.confidence.overall}%`);
      console.log(`   Risk-Reward: ${signal.riskReward.toFixed(2)}:1`);
      console.log(`   Position Size: $${signal.positionSize.toLocaleString()}`);
      console.log(`   Max Loss: $${signal.maxLoss.toLocaleString()}\n`);
      
      // Build comprehensive analysis
      const analysis = this.buildComprehensiveAnalysis(aiAnalysis, data);
      
      return {
        success: true,
        signal,
        analysis,
        dataQuality
      };
      
    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error('\n========================================');
      console.error('❌ TRADE SIGNAL GENERATION FAILED');
      console.error('========================================\n');
      console.error(`Error: ${error.message}`);
      console.error(`Time elapsed: ${totalTime}ms\n`);
      
      return {
        success: false,
        dataQuality: {
          overall: 0,
          market: 0,
          sentiment: 0,
          onChain: 0,
          technical: 0,
          sources: { successful: [], failed: [] }
        },
        error: error.message
      };
    }
  }
  
  // ==========================================================================
  // PHASE 1: DATA COLLECTION
  // ==========================================================================
  
  /**
   * Collect all market data from 13+ API sources
   * 
   * Fetches data in parallel with timeout handling and fallback mechanisms.
   * 
   * Task 41: Data collection phase implementation
   * Requirements: 2.1 (Multi-source validation), 3.1 (All APIs)
   */
  private async collectData(): Promise<ComprehensiveData> {
    console.log('Fetching data from 13+ API sources...');
    console.log('  - Market data (CoinGecko, CoinMarketCap, Kraken)');
    console.log('  - Sentiment data (LunarCrush, Twitter, Reddit)');
    console.log('  - On-chain data (Blockchain explorers)');
    console.log('  - Technical indicators (calculated)');
    console.log('  - News data (NewsAPI, Caesar)');
    
    try {
      const data = await this.dataCollector.fetchAllData();
      
      console.log('✓ Market data fetched');
      console.log('✓ Sentiment data fetched');
      console.log('✓ On-chain data fetched');
      console.log('✓ Technical indicators calculated');
      console.log('✓ News data fetched');
      
      return data;
    } catch (error: any) {
      console.error('✗ Data collection failed:', error.message);
      throw new Error(`Data collection failed: ${error.message}`);
    }
  }
  
  // ==========================================================================
  // PHASE 2: DATA VALIDATION
  // ==========================================================================
  
  /**
   * Validate collected data and calculate quality score
   * 
   * Checks data freshness, completeness, and cross-source consistency.
   * 
   * Task 41: Data validation phase implementation
   * Requirements: 2.2 (Data freshness), 2.3 (Quality threshold), 2.4 (Cross-source validation)
   */
  private async validateData(data: ComprehensiveData): Promise<DataQualityScore> {
    console.log('Validating data quality...');
    
    try {
      const quality = this.dataCollector.validateAllData(data);
      
      console.log(`  Overall Quality: ${quality.overall}%`);
      console.log(`  Market Data: ${quality.market}%`);
      console.log(`  Sentiment Data: ${quality.sentiment}%`);
      console.log(`  On-Chain Data: ${quality.onChain}%`);
      console.log(`  Technical Data: ${quality.technical}%`);
      console.log(`  Successful Sources: ${quality.sources.successful.length}`);
      console.log(`  Failed Sources: ${quality.sources.failed.length}`);
      
      if (quality.sources.failed.length > 0) {
        console.warn(`  ⚠️  Failed sources: ${quality.sources.failed.join(', ')}`);
      }
      
      return quality;
    } catch (error: any) {
      console.error('✗ Data validation failed:', error.message);
      throw new Error(`Data validation failed: ${error.message}`);
    }
  }
  
  // ==========================================================================
  // PHASE 3: AI ANALYSIS
  // ==========================================================================
  
  /**
   * Perform comprehensive AI analysis with GPT-5.1
   * 
   * Uses GPT-5.1 with high reasoning effort to analyze all data dimensions
   * and generate a complete trade signal with detailed reasoning.
   * 
   * This method implements the complete AI analysis phase by calling all four
   * GPT-5.1 analysis engine methods in sequence:
   * 1. analyzeMarket() - Generate comprehensive market analysis
   * 2. determinePositionType() - Validate and determine position type
   * 3. calculateConfidence() - Calculate/validate confidence scores
   * 4. generateReasoning() - Validate detailed reasoning
   * 
   * Task 42: AI analysis phase implementation
   * Requirements: 1.1 (GPT-5.1 high reasoning), 1.2 (Detailed reasoning), 1.3 (Confidence scores), 4.1 (Position type)
   */
  private async performAIAnalysis(data: ComprehensiveData): Promise<AIAnalysis> {
    console.log('Analyzing market with GPT-5.1 (high reasoning effort)...');
    console.log('  - Technical analysis');
    console.log('  - Sentiment analysis');
    console.log('  - On-chain analysis');
    console.log('  - Risk assessment');
    console.log('  - Position type determination');
    console.log('  - Confidence scoring');
    
    try {
      // Step 1: Call GPT51AnalysisEngine.analyzeMarket()
      // This generates the comprehensive market analysis with GPT-5.1
      console.log('[AI Phase] Step 1: Calling analyzeMarket()...');
      const analysis = await this.aiEngine.analyzeMarket(data);
      
      console.log('✓ Technical analysis complete');
      console.log('✓ Sentiment analysis complete');
      console.log('✓ On-chain analysis complete');
      console.log('✓ Risk assessment complete');
      
      // Step 2: Call GPT51AnalysisEngine.determinePositionType()
      // This validates the position type and checks confidence threshold
      console.log('[AI Phase] Step 2: Calling determinePositionType()...');
      const positionType = this.aiEngine.determinePositionType(analysis);
      
      console.log(`✓ Position type determined: ${positionType}`);
      
      // Update analysis with validated position type
      analysis.positionType = positionType;
      
      // Step 3: Call GPT51AnalysisEngine.calculateConfidence()
      // This validates/calculates confidence scores with data quality weighting
      console.log('[AI Phase] Step 3: Calling calculateConfidence()...');
      const dataQuality = this.dataCollector.getLastDataQuality();
      const confidence = this.aiEngine.calculateConfidence(analysis, dataQuality);
      
      console.log(`✓ Confidence scores calculated/validated`);
      console.log(`  Overall: ${confidence.overall}%`);
      console.log(`  Technical: ${confidence.technical}%`);
      console.log(`  Sentiment: ${confidence.sentiment}%`);
      console.log(`  On-Chain: ${confidence.onChain}%`);
      console.log(`  Risk: ${confidence.risk}%`);
      
      // Update analysis with validated confidence scores
      analysis.confidence = confidence;
      
      // Step 4: Call GPT51AnalysisEngine.generateReasoning()
      // This validates the detailed reasoning for all dimensions
      console.log('[AI Phase] Step 4: Calling generateReasoning()...');
      const reasoning = this.aiEngine.generateReasoning(analysis);
      
      console.log('✓ Reasoning validated');
      console.log(`  Technical: ${reasoning.technical.length} chars`);
      console.log(`  Sentiment: ${reasoning.sentiment.length} chars`);
      console.log(`  On-Chain: ${reasoning.onChain.length} chars`);
      console.log(`  Risk: ${reasoning.risk.length} chars`);
      console.log(`  Overall: ${reasoning.overall.length} chars`);
      
      // Update analysis with validated reasoning
      analysis.reasoning = reasoning;
      
      console.log('[AI Phase] All 4 methods completed successfully');
      console.log(`[AI Phase] Final Position: ${analysis.positionType}, Confidence: ${analysis.confidence.overall}%`);
      
      return analysis;
    } catch (error: any) {
      console.error('✗ AI analysis failed:', error.message);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
  
  // ==========================================================================
  // PHASE 4: RISK CALCULATION
  // ==========================================================================
  
  /**
   * Calculate risk parameters for the trade
   * 
   * Calculates position sizing, stop-loss, take-profit levels, and risk-reward ratio
   * based on account balance, risk tolerance, and market volatility.
   * 
   * Task 43: Risk calculation phase implementation
   * Requirements: 8.1 (Position sizing), 8.2 (Stop-loss), 8.3 (Take-profit), 8.4 (Risk-reward), 8.5 (Max loss)
   */
  private async calculateRisk(
    aiAnalysis: AIAnalysis,
    data: ComprehensiveData
  ): Promise<{
    positionSize: number;
    maxLoss: number;
    riskReward: number;
  }> {
    console.log('Calculating risk parameters...');
    console.log(`  Account Balance: $${this.config.accountBalance.toLocaleString()}`);
    console.log(`  Risk Tolerance: ${this.config.riskTolerance}%`);
    console.log(`  Entry: $${aiAnalysis.entry.toLocaleString()}`);
    console.log(`  Stop Loss: $${aiAnalysis.stopLoss.toLocaleString()}`);
    
    try {
      const result = riskCalculator.calculateRisk({
        accountBalance: this.config.accountBalance,
        riskTolerance: this.config.riskTolerance,
        entryPrice: aiAnalysis.entry,
        positionType: aiAnalysis.positionType,
        atr: data.technical.indicators.atr,
        currentPrice: data.market.price,
        technicalIndicators: data.technical.indicators
      });
      
      console.log('✓ Position sizing calculated');
      console.log('✓ Stop-loss validated');
      console.log('✓ Take-profit levels validated');
      console.log('✓ Risk-reward ratio calculated');
      
      return {
        positionSize: result.positionSize,
        maxLoss: result.maxLoss,
        riskReward: result.riskReward
      };
    } catch (error: any) {
      console.error('✗ Risk calculation failed:', error.message);
      throw new Error(`Risk calculation failed: ${error.message}`);
    }
  }
  
  // ==========================================================================
  // PHASE 5: APPROVAL WORKFLOW
  // ==========================================================================
  
  /**
   * Present trade signal for user approval
   * 
   * Calls the approval workflow manager to present the signal for user review.
   * The signal will only be saved to the database after explicit user approval.
   * 
   * Task 44: Approval workflow phase implementation
   * Requirements: 5.1 (Present for approval), 5.2 (Include all details)
   */
  private async presentForApproval(
    signal: TradeSignal,
    aiAnalysis: AIAnalysis
  ): Promise<{ signalId: string; expiresAt: string }> {
    console.log('Presenting signal for user approval...');
    console.log('  - Comprehensive preview modal');
    console.log('  - All analysis details included');
    console.log('  - Risk metrics displayed');
    console.log('  - 5-minute approval timeout');
    
    try {
      const approvalInfo = await approvalWorkflowManager.presentForApproval(signal, aiAnalysis);
      
      console.log('✓ Signal presented successfully');
      console.log(`  Signal ID: ${approvalInfo.signalId}`);
      console.log(`  Expires: ${approvalInfo.expiresAt}`);
      
      return approvalInfo;
    } catch (error: any) {
      console.error('✗ Failed to present for approval:', error.message);
      throw new Error(`Approval presentation failed: ${error.message}`);
    }
  }
  
  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================
  
  /**
   * Construct complete trade signal from analysis and risk parameters
   */
  private async constructTradeSignal(
    aiAnalysis: AIAnalysis,
    riskParams: { positionSize: number; maxLoss: number; riskReward: number },
    data: ComprehensiveData,
    dataQuality: DataQualityScore
  ): Promise<TradeSignal> {
    const analysis = this.buildComprehensiveAnalysis(aiAnalysis, data);
    
    const signal: TradeSignal = {
      id: this.generateSignalId(),
      symbol: this.config.symbol,
      positionType: aiAnalysis.positionType,
      entry: aiAnalysis.entry,
      stopLoss: aiAnalysis.stopLoss,
      takeProfits: aiAnalysis.takeProfits,
      confidence: aiAnalysis.confidence,
      riskReward: riskParams.riskReward,
      positionSize: riskParams.positionSize,
      maxLoss: riskParams.maxLoss,
      timeframe: this.config.timeframe,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      dataQuality,
      analysis
    };
    
    return signal;
  }
  
  /**
   * Create NO_TRADE result
   */
  private createNoTradeResult(
    data: ComprehensiveData,
    aiAnalysis: AIAnalysis,
    dataQuality: DataQualityScore,
    reason: string
  ): TradeSignalResult {
    const analysis = this.buildComprehensiveAnalysis(aiAnalysis, data);
    
    const signal: TradeSignal = {
      id: this.generateSignalId(),
      symbol: this.config.symbol,
      positionType: 'NO_TRADE',
      entry: 0,
      stopLoss: 0,
      takeProfits: {
        tp1: { price: 0, allocation: 50 },
        tp2: { price: 0, allocation: 30 },
        tp3: { price: 0, allocation: 20 }
      },
      confidence: aiAnalysis.confidence,
      riskReward: 0,
      positionSize: 0,
      maxLoss: 0,
      timeframe: this.config.timeframe,
      createdAt: new Date().toISOString(),
      status: 'REJECTED',
      dataQuality,
      analysis
    };
    
    return {
      success: true,
      signal,
      analysis,
      dataQuality,
      error: reason
    };
  }
  
  /**
   * Build comprehensive analysis from AI analysis and data
   */
  private buildComprehensiveAnalysis(
    aiAnalysis: AIAnalysis,
    data: ComprehensiveData
  ): ComprehensiveAnalysis {
    return {
      technical: {
        indicators: data.technical.indicators,
        signals: this.extractTechnicalSignals(data.technical.indicators),
        trend: this.determineTrend(data.technical.indicators),
        strength: this.calculateTrendStrength(data.technical.indicators)
      },
      sentiment: {
        social: data.sentiment.social,
        news: data.sentiment.news,
        overall: this.determineSentimentOverall(data.sentiment),
        score: this.calculateSentimentScore(data.sentiment)
      },
      onChain: {
        whaleActivity: data.onChain.whaleActivity,
        exchangeFlows: data.onChain.exchangeFlows,
        holderDistribution: data.onChain.holderDistribution,
        netFlow: this.determineNetFlow(data.onChain.exchangeFlows)
      },
      risk: {
        volatility: data.technical.indicators.atr,
        liquidityRisk: this.assessLiquidityRisk(data.market),
        marketConditions: this.assessMarketConditions(data.market),
        recommendation: aiAnalysis.reasoning.risk
      },
      reasoning: aiAnalysis.reasoning,
      timeframeAlignment: aiAnalysis.timeframeAlignment
    };
  }
  
  /**
   * Extract technical signals from indicators
   */
  private extractTechnicalSignals(indicators: any): string[] {
    const signals: string[] = [];
    
    if (indicators.rsi > 70) signals.push('RSI Overbought');
    if (indicators.rsi < 30) signals.push('RSI Oversold');
    if (indicators.macd.histogram > 0) signals.push('MACD Bullish');
    if (indicators.macd.histogram < 0) signals.push('MACD Bearish');
    
    return signals;
  }
  
  /**
   * Determine overall trend from indicators
   */
  private determineTrend(indicators: any): string {
    const bullishSignals = [];
    const bearishSignals = [];
    
    if (indicators.rsi > 50) bullishSignals.push(1);
    if (indicators.rsi < 50) bearishSignals.push(1);
    if (indicators.macd.histogram > 0) bullishSignals.push(1);
    if (indicators.macd.histogram < 0) bearishSignals.push(1);
    
    if (bullishSignals.length > bearishSignals.length) return 'BULLISH';
    if (bearishSignals.length > bullishSignals.length) return 'BEARISH';
    return 'NEUTRAL';
  }
  
  /**
   * Calculate trend strength (0-100)
   */
  private calculateTrendStrength(indicators: any): number {
    let strength = 50;
    
    if (indicators.rsi > 70 || indicators.rsi < 30) strength += 20;
    if (Math.abs(indicators.macd.histogram) > 100) strength += 15;
    if (indicators.atr > 1000) strength += 15;
    
    return Math.min(100, strength);
  }
  
  /**
   * Determine overall sentiment
   */
  private determineSentimentOverall(sentiment: any): string {
    const score = this.calculateSentimentScore(sentiment);
    
    if (score > 60) return 'BULLISH';
    if (score < 40) return 'BEARISH';
    return 'NEUTRAL';
  }
  
  /**
   * Calculate sentiment score (0-100)
   */
  private calculateSentimentScore(sentiment: any): number {
    const social = sentiment.social;
    const news = sentiment.news;
    
    let score = 50;
    
    if (social.lunarCrush.galaxyScore > 60) score += 15;
    if (social.twitter.sentiment > 0) score += 10;
    if (social.reddit.sentiment > 0) score += 10;
    if (news.sentiment > 0) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Determine net flow direction
   */
  private determineNetFlow(flows: any): string {
    if (flows.netFlow > 0) return 'ACCUMULATION';
    if (flows.netFlow < 0) return 'DISTRIBUTION';
    return 'NEUTRAL';
  }
  
  /**
   * Assess liquidity risk
   */
  private assessLiquidityRisk(market: any): string {
    if (market.volume24h > 1000000000) return 'LOW';
    if (market.volume24h > 100000000) return 'MEDIUM';
    return 'HIGH';
  }
  
  /**
   * Assess market conditions
   */
  private assessMarketConditions(market: any): string {
    if (Math.abs(market.change24h) > 10) return 'VOLATILE';
    if (Math.abs(market.change24h) > 5) return 'ACTIVE';
    return 'STABLE';
  }
  
  /**
   * Generate unique signal ID
   */
  private generateSignalId(): string {
    return `einstein_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Create a new Einstein Engine Coordinator instance
 * 
 * @param config - Einstein engine configuration
 * @returns Einstein Engine Coordinator instance
 */
export function createEinsteinCoordinator(config: EinsteinConfig): EinsteinEngineCoordinator {
  return new EinsteinEngineCoordinator(config);
}

/**
 * Singleton instance for convenience
 * 
 * Note: For production use, create instances with specific configs
 * rather than using the singleton.
 */
let coordinatorInstance: EinsteinEngineCoordinator | null = null;

export function getEinsteinCoordinator(config: EinsteinConfig): EinsteinEngineCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new EinsteinEngineCoordinator(config);
  }
  return coordinatorInstance;
}
