/**
 * Einstein 100000x Trade Generation Engine - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the Einstein engine for trade signal generation, analysis, and workflow management.
 */

// ============================================================================
// Core Trade Signal Types
// ============================================================================

/**
 * Position type for a trade signal
 */
export type PositionType = 'LONG' | 'SHORT' | 'NO_TRADE';

/**
 * Trade execution status
 */
export type TradeStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'EXECUTED' 
  | 'PARTIAL_CLOSE' 
  | 'CLOSED';

/**
 * Timeframe for analysis
 */
export type Timeframe = '15m' | '1h' | '4h' | '1d';

/**
 * Trend direction for timeframe analysis
 */
export type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

// ============================================================================
// Take Profit Targets
// ============================================================================

/**
 * Individual take profit target with price and allocation
 */
export interface TakeProfitTarget {
  price: number;
  allocation: number; // Percentage (0-100)
}

/**
 * Complete take profit targets structure
 */
export interface TakeProfitTargets {
  tp1: TakeProfitTarget; // 50% allocation
  tp2: TakeProfitTarget; // 30% allocation
  tp3: TakeProfitTarget; // 20% allocation
}

// ============================================================================
// Confidence Scoring
// ============================================================================

/**
 * Confidence scores across different analysis dimensions
 */
export interface ConfidenceScore {
  overall: number;      // 0-100: Overall confidence in the trade signal
  technical: number;    // 0-100: Confidence from technical indicators
  sentiment: number;    // 0-100: Confidence from sentiment analysis
  onChain: number;      // 0-100: Confidence from on-chain data
  risk: number;         // 0-100: Confidence in risk assessment
}

// ============================================================================
// Timeframe Alignment
// ============================================================================

/**
 * Trend analysis across multiple timeframes
 */
export interface TimeframeAlignment {
  '15m': TrendDirection;
  '1h': TrendDirection;
  '4h': TrendDirection;
  '1d': TrendDirection;
  alignment: number; // 0-100: Percentage of aligned timeframes
}

// ============================================================================
// Data Quality
// ============================================================================

/**
 * Data quality assessment for collected market data
 */
export interface DataQualityScore {
  overall: number;      // 0-100: Overall data quality
  market: number;       // 0-100: Market data quality
  sentiment: number;    // 0-100: Sentiment data quality
  onChain: number;      // 0-100: On-chain data quality
  technical: number;    // 0-100: Technical data quality
  sources: {
    successful: string[]; // List of successful API sources
    failed: string[];     // List of failed API sources
  };
}

// ============================================================================
// AI Analysis
// ============================================================================

/**
 * AI-generated reasoning for trade signal
 */
export interface AIReasoning {
  technical: string;    // Technical analysis reasoning
  sentiment: string;    // Sentiment analysis reasoning
  onChain: string;      // On-chain analysis reasoning
  risk: string;         // Risk assessment reasoning
  overall: string;      // Overall synthesis and recommendation
}

/**
 * Complete AI analysis result from GPT-5.1
 */
export interface AIAnalysis {
  positionType: PositionType;
  confidence: ConfidenceScore;
  reasoning: AIReasoning;
  entry: number;
  stopLoss: number;
  takeProfits: TakeProfitTargets;
  timeframeAlignment: TimeframeAlignment;
  riskReward: number;
}

// ============================================================================
// Trade Execution Status
// ============================================================================

/**
 * Exit price information for closed positions
 */
export interface ExitPrice {
  target: 'TP1' | 'TP2' | 'TP3' | 'STOP_LOSS';
  price: number;
  percentage: number;   // Percentage of position closed
  timestamp: string;    // ISO 8601 timestamp
}

/**
 * Profit/Loss calculation result
 */
export interface PLCalculation {
  profitLoss: number;
  profitLossPercent: number;
  isProfit: boolean;
  color: 'green' | 'red';
  icon: 'up' | 'down';
}

/**
 * Target hit status for monitoring
 */
export interface TargetStatus {
  tp1Hit: boolean;
  tp2Hit: boolean;
  tp3Hit: boolean;
  stopLossHit: boolean;
  suggestUpdate: boolean;
  message?: string;
}

/**
 * Trade execution tracking information
 */
export interface TradeExecutionStatus {
  executedAt?: string;          // ISO 8601 timestamp
  entryPrice?: number;
  currentPrice?: number;
  exitPrices?: ExitPrice[];
  percentFilled?: number;
  unrealizedPL?: PLCalculation;
  realizedPL?: PLCalculation;
  targetsHit?: TargetStatus;
}

// ============================================================================
// Data Source Health
// ============================================================================

/**
 * Individual data source health status
 */
export interface DataSourceStatus {
  name: string;
  status: 'SUCCESS' | 'FAILED' | 'SLOW';
  responseTime: number;         // Milliseconds
  error?: string;
}

/**
 * Overall data source health monitoring
 */
export interface DataSourceHealth {
  overall: number;              // 0-100: Overall health score
  sources: DataSourceStatus[];
  lastChecked: string;          // ISO 8601 timestamp
}

// ============================================================================
// Data Changes Tracking
// ============================================================================

/**
 * Changes detected during data refresh
 */
export interface DataChanges {
  priceChanged: boolean;
  priceDelta: number;
  indicatorsChanged: string[];
  sentimentChanged: boolean;
  onChainChanged: boolean;
  significantChanges: boolean;
}

/**
 * Result of data refresh operation
 */
export interface RefreshResult {
  success: boolean;
  dataQuality: DataQualityScore;
  changes: DataChanges;
  timestamp: string;            // ISO 8601 timestamp
  duration: number;             // Milliseconds
}

// ============================================================================
// Main Trade Signal
// ============================================================================

/**
 * Complete trade signal with all analysis and tracking data
 */
export interface TradeSignal {
  id: string;
  symbol: string;
  positionType: PositionType;
  entry: number;
  stopLoss: number;
  takeProfits: TakeProfitTargets;
  confidence: ConfidenceScore;
  riskReward: number;
  positionSize: number;
  maxLoss: number;
  timeframe: string;
  createdAt: string;            // ISO 8601 timestamp
  lastRefreshed?: string;       // ISO 8601 timestamp
  status: TradeStatus;
  executionStatus?: TradeExecutionStatus;
  dataQuality: DataQualityScore;
  analysis: ComprehensiveAnalysis;
  dataSourceHealth?: DataSourceHealth;
}

// ============================================================================
// Comprehensive Analysis
// ============================================================================

/**
 * Technical indicators data
 */
export interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
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
 * Technical analysis component
 */
export interface TechnicalAnalysis {
  indicators: TechnicalIndicators;
  signals: string[];
  trend: string;
  strength: number;             // 0-100
}

/**
 * Social metrics data
 */
export interface SocialMetrics {
  lunarCrush: {
    galaxyScore: number;
    altRank: number;
    socialScore: number;
  };
  twitter: {
    mentions: number;
    sentiment: number;
  };
  reddit: {
    posts: number;
    sentiment: number;
  };
}

/**
 * News metrics data
 */
export interface NewsMetrics {
  articles: number;
  sentiment: number;
  trending: boolean;
}

/**
 * Sentiment analysis component
 */
export interface SentimentAnalysis {
  social: SocialMetrics;
  news: NewsMetrics;
  overall: string;
  score: number;                // 0-100
}

/**
 * Whale activity metrics
 */
export interface WhaleMetrics {
  transactions: number;
  totalValue: number;
  averageSize: number;
}

/**
 * Exchange flow data
 */
export interface ExchangeFlows {
  deposits: number;
  withdrawals: number;
  netFlow: number;
}

/**
 * Holder distribution metrics
 */
export interface HolderMetrics {
  whales: number;
  retail: number;
  concentration: number;        // 0-100
}

/**
 * On-chain analysis component
 */
export interface OnChainAnalysis {
  whaleActivity: WhaleMetrics;
  exchangeFlows: ExchangeFlows;
  holderDistribution: HolderMetrics;
  netFlow: string;
}

/**
 * Risk assessment component
 */
export interface RiskAnalysis {
  volatility: number;
  liquidityRisk: string;
  marketConditions: string;
  recommendation: string;
}

/**
 * Complete comprehensive analysis structure
 */
export interface ComprehensiveAnalysis {
  technical: TechnicalAnalysis;
  sentiment: SentimentAnalysis;
  onChain: OnChainAnalysis;
  risk: RiskAnalysis;
  reasoning: AIReasoning;
  timeframeAlignment: TimeframeAlignment;
}

// ============================================================================
// Market Data
// ============================================================================

/**
 * Raw market data from APIs
 */
export interface MarketData {
  price: number;
  volume24h: number;
  marketCap: number;
  change24h: number;
  high24h: number;
  low24h: number;
  timestamp: string;            // ISO 8601 timestamp
  source: string;
}

/**
 * Sentiment data from social sources
 */
export interface SentimentData {
  social: SocialMetrics;
  news: NewsMetrics;
  timestamp: string;            // ISO 8601 timestamp
}

/**
 * On-chain data from blockchain
 */
export interface OnChainData {
  whaleActivity: WhaleMetrics;
  exchangeFlows: ExchangeFlows;
  holderDistribution: HolderMetrics;
  timestamp: string;            // ISO 8601 timestamp
}

/**
 * Technical indicators data
 */
export interface TechnicalData {
  indicators: TechnicalIndicators;
  timeframe: Timeframe;
  timestamp: string;            // ISO 8601 timestamp
}

/**
 * News data
 */
export interface NewsData {
  articles: Array<{
    title: string;
    source: string;
    sentiment: number;
    timestamp: string;
  }>;
  timestamp: string;            // ISO 8601 timestamp
}

/**
 * Complete data collection from all sources
 */
export interface ComprehensiveData {
  market: MarketData;
  sentiment: SentimentData;
  onChain: OnChainData;
  technical: TechnicalData;
  news: NewsData;
  timestamp: string;            // ISO 8601 timestamp
}

// ============================================================================
// Workflow & Results
// ============================================================================

/**
 * Approval action types
 */
export type ApprovalAction = 'APPROVED' | 'REJECTED' | 'MODIFIED';

/**
 * Result of approval workflow
 */
export interface ApprovalResult {
  action: ApprovalAction;
  modifiedSignal?: TradeSignal;
  rejectionReason?: string;
}

/**
 * Result of trade signal generation
 */
export interface TradeSignalResult {
  success: boolean;
  signal?: TradeSignal;
  analysis?: ComprehensiveAnalysis;
  dataQuality: DataQualityScore;
  approvalInfo?: {
    signalId: string;
    expiresAt: string;
  };
  error?: string;
}

/**
 * Database operation result
 */
export interface DatabaseResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error categories
 */
export type ErrorCategory = 
  | 'DATA_COLLECTION'
  | 'AI_ANALYSIS'
  | 'DATABASE'
  | 'WORKFLOW';

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details: string;
  retryable: boolean;
  fallbackAvailable: boolean;
  userMessage: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Einstein engine configuration
 */
export interface EinsteinConfig {
  symbol: string;
  timeframe: Timeframe;
  accountBalance: number;
  riskTolerance: number;        // 0-100
  minDataQuality: number;       // 0-100 (default: 90)
  minConfidence: number;        // 0-100 (default: 60)
  minRiskReward: number;        // Minimum ratio (default: 2)
  maxLoss: number;              // Maximum loss percentage (default: 2)
}
