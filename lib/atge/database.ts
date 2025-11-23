/**
 * ATGE Database Utility Functions
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * This module provides database access functions for the ATGE system.
 * All functions use parameterized queries to prevent SQL injection.
 */

import { query, queryOne } from '../db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TradeSignal {
  id: string;
  userId: string;
  symbol: string;
  status: 'active' | 'completed_success' | 'completed_failure' | 'expired' | 'incomplete_data';
  
  // Entry & Exit
  entryPrice: number;
  
  // Take Profit Levels
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;
  tp3Price: number;
  tp3Allocation: number;
  
  // Stop Loss
  stopLossPrice: number;
  stopLossPercentage: number;
  
  // Timeframe
  timeframe: '1h' | '4h' | '1d' | '1w';
  timeframeHours: number;
  
  // AI Analysis
  confidenceScore: number;
  riskRewardRatio: number;
  marketCondition: 'trending' | 'ranging' | 'volatile';
  aiReasoning: string;
  aiModelVersion: string;
  
  // Timestamps
  generatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeResult {
  id: string;
  tradeSignalId: string;
  
  // Actual Prices
  actualEntryPrice: number;
  actualExitPrice?: number;
  
  // Targets Hit
  tp1Hit: boolean;
  tp1HitAt?: Date;
  tp1HitPrice?: number;
  tp2Hit: boolean;
  tp2HitAt?: Date;
  tp2HitPrice?: number;
  tp3Hit: boolean;
  tp3HitAt?: Date;
  tp3HitPrice?: number;
  stopLossHit: boolean;
  stopLossHitAt?: Date;
  stopLossHitPrice?: number;
  
  // P/L
  profitLossUsd?: number;
  profitLossPercentage?: number;
  tradeDurationMinutes?: number;
  
  // Fees & Slippage
  tradeSizeUsd: number;
  feesUsd: number;
  slippageUsd: number;
  netProfitLossUsd?: number;
  
  // Data Quality
  dataSource: string;
  dataResolution: string;
  dataQualityScore: number;
  
  // AI Analysis
  aiAnalysis?: string;
  
  // Timestamps
  backtestedAt: Date;
  createdAt: Date;
}

export interface TechnicalIndicators {
  id: string;
  tradeSignalId: string;
  
  // RSI
  rsiValue?: number;
  
  // MACD
  macdValue?: number;
  macdSignal?: number;
  macdHistogram?: number;
  
  // EMAs
  ema20?: number;
  ema50?: number;
  ema200?: number;
  
  // Bollinger Bands
  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;
  
  // ATR
  atrValue?: number;
  
  // Volume & Market Cap
  volume24h?: number;
  marketCap?: number;
  
  // Metadata (V2)
  dataSource?: string;
  timeframe?: string;
  calculatedAt?: Date;
  dataQuality?: number;
  candleCount?: number;
  
  createdAt: Date;
}

export interface MarketSnapshot {
  id: string;
  tradeSignalId: string;
  
  // Price Data
  currentPrice: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  
  // Sentiment
  socialSentimentScore?: number;
  whaleActivityCount?: number;
  fearGreedIndex?: number;
  
  // LunarCrush Social Intelligence
  galaxyScore?: number;
  altRank?: number;
  socialDominance?: number;
  sentimentPositive?: number;
  sentimentNegative?: number;
  sentimentNeutral?: number;
  socialVolume24h?: number;
  socialPosts24h?: number;
  socialInteractions24h?: number;
  socialContributors24h?: number;
  correlationScore?: number;
  
  // Bitcoin On-Chain Metrics (Glassnode)
  soprValue?: number;
  mvrvZScore?: number;
  
  // Timestamps
  snapshotAt: Date;
  createdAt: Date;
}

export interface HistoricalPrice {
  id: string;
  tradeSignalId: string;
  timestamp: Date;
  
  // OHLCV
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume?: number;
  
  // Source
  dataSource: string;
  
  createdAt: Date;
}

export interface TradeFilters {
  userId?: string;
  symbol?: string;
  status?: string;
  timeframe?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// TRADE SIGNAL FUNCTIONS
// ============================================================================

/**
 * Store a new trade signal in the database
 */
export async function storeTradeSignal(
  signal: Omit<TradeSignal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TradeSignal> {
  const result = await queryOne(`
    INSERT INTO trade_signals (
      user_id, symbol, status,
      entry_price,
      tp1_price, tp1_allocation,
      tp2_price, tp2_allocation,
      tp3_price, tp3_allocation,
      stop_loss_price, stop_loss_percentage,
      timeframe, timeframe_hours,
      confidence_score, risk_reward_ratio, market_condition,
      ai_reasoning, ai_model_version,
      generated_at, expires_at
    ) VALUES (
      $1, $2, $3,
      $4,
      $5, $6,
      $7, $8,
      $9, $10,
      $11, $12,
      $13, $14,
      $15, $16, $17,
      $18, $19,
      $20, $21
    )
    RETURNING *
  `, [
    signal.userId, signal.symbol, signal.status,
    signal.entryPrice,
    signal.tp1Price, signal.tp1Allocation,
    signal.tp2Price, signal.tp2Allocation,
    signal.tp3Price, signal.tp3Allocation,
    signal.stopLossPrice, signal.stopLossPercentage,
    signal.timeframe, signal.timeframeHours,
    signal.confidenceScore, signal.riskRewardRatio, signal.marketCondition,
    signal.aiReasoning, signal.aiModelVersion,
    signal.generatedAt, signal.expiresAt
  ]);
  
  return mapTradeSignalFromDb(result);
}

/**
 * Fetch a trade signal by ID
 */
export async function fetchTradeSignal(tradeSignalId: string): Promise<TradeSignal | null> {
  const result = await queryOne(`
    SELECT * FROM trade_signals WHERE id = $1
  `, [tradeSignalId]);
  
  if (!result) return null;
  
  return mapTradeSignalFromDb(result);
}

/**
 * Fetch all trades with optional filters
 */
export async function fetchAllTrades(filters: TradeFilters = {}): Promise<TradeSignal[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  
  if (filters.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(filters.userId);
  }
  
  if (filters.symbol) {
    conditions.push(`symbol = $${paramIndex++}`);
    params.push(filters.symbol);
  }
  
  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }
  
  if (filters.timeframe) {
    conditions.push(`timeframe = $${paramIndex++}`);
    params.push(filters.timeframe);
  }
  
  if (filters.startDate) {
    conditions.push(`generated_at >= $${paramIndex++}`);
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    conditions.push(`generated_at <= $${paramIndex++}`);
    params.push(filters.endDate);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;
  
  const result = await query(`
    SELECT * FROM trade_signals
    ${whereClause}
    ORDER BY generated_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `, [...params, limit, offset]);
  
  return result.rows.map(mapTradeSignalFromDb);
}

/**
 * Update trade signal status
 */
export async function updateTradeStatus(
  tradeSignalId: string,
  status: TradeSignal['status']
): Promise<void> {
  await query(`
    UPDATE trade_signals
    SET status = $1, updated_at = NOW()
    WHERE id = $2
  `, [status, tradeSignalId]);
}

// ============================================================================
// TRADE RESULTS FUNCTIONS
// ============================================================================

/**
 * Store backtesting results
 */
export async function storeTradeResults(
  results: Omit<TradeResult, 'id' | 'createdAt'>
): Promise<TradeResult> {
  const result = await queryOne(`
    INSERT INTO trade_results (
      trade_signal_id,
      actual_entry_price, actual_exit_price,
      tp1_hit, tp1_hit_at, tp1_hit_price,
      tp2_hit, tp2_hit_at, tp2_hit_price,
      tp3_hit, tp3_hit_at, tp3_hit_price,
      stop_loss_hit, stop_loss_hit_at, stop_loss_hit_price,
      profit_loss_usd, profit_loss_percentage, trade_duration_minutes,
      trade_size_usd, fees_usd, slippage_usd, net_profit_loss_usd,
      data_source, data_resolution, data_quality_score,
      ai_analysis,
      backtested_at
    ) VALUES (
      $1,
      $2, $3,
      $4, $5, $6,
      $7, $8, $9,
      $10, $11, $12,
      $13, $14, $15,
      $16, $17, $18,
      $19, $20, $21, $22,
      $23, $24, $25,
      $26,
      $27
    )
    RETURNING *
  `, [
    results.tradeSignalId,
    results.actualEntryPrice, results.actualExitPrice,
    results.tp1Hit, results.tp1HitAt, results.tp1HitPrice,
    results.tp2Hit, results.tp2HitAt, results.tp2HitPrice,
    results.tp3Hit, results.tp3HitAt, results.tp3HitPrice,
    results.stopLossHit, results.stopLossHitAt, results.stopLossHitPrice,
    results.profitLossUsd, results.profitLossPercentage, results.tradeDurationMinutes,
    results.tradeSizeUsd, results.feesUsd, results.slippageUsd, results.netProfitLossUsd,
    results.dataSource, results.dataResolution, results.dataQualityScore,
    results.aiAnalysis,
    results.backtestedAt
  ]);
  
  return mapTradeResultFromDb(result);
}

// ============================================================================
// TECHNICAL INDICATORS FUNCTIONS
// ============================================================================

/**
 * Store technical indicators with metadata (V2)
 */
export async function storeTechnicalIndicators(
  indicators: Omit<TechnicalIndicators, 'id' | 'createdAt'>
): Promise<TechnicalIndicators> {
  const result = await queryOne(`
    INSERT INTO trade_technical_indicators (
      trade_signal_id,
      rsi_value,
      macd_value, macd_signal, macd_histogram,
      ema_20, ema_50, ema_200,
      bollinger_upper, bollinger_middle, bollinger_lower,
      atr_value,
      volume_24h, market_cap,
      data_source, timeframe, calculated_at, data_quality, candle_count
    ) VALUES (
      $1,
      $2,
      $3, $4, $5,
      $6, $7, $8,
      $9, $10, $11,
      $12,
      $13, $14,
      $15, $16, $17, $18, $19
    )
    RETURNING *
  `, [
    indicators.tradeSignalId,
    indicators.rsiValue,
    indicators.macdValue, indicators.macdSignal, indicators.macdHistogram,
    indicators.ema20, indicators.ema50, indicators.ema200,
    indicators.bollingerUpper, indicators.bollingerMiddle, indicators.bollingerLower,
    indicators.atrValue,
    indicators.volume24h, indicators.marketCap,
    indicators.dataSource || 'CoinGecko',
    indicators.timeframe || '1d',
    indicators.calculatedAt || new Date(),
    indicators.dataQuality || 0,
    indicators.candleCount || 0
  ]);
  
  return mapTechnicalIndicatorsFromDb(result);
}

// ============================================================================
// MARKET SNAPSHOT FUNCTIONS
// ============================================================================

/**
 * Store market snapshot with LunarCrush data and Glassnode metrics
 */
export async function storeMarketSnapshot(
  snapshot: Omit<MarketSnapshot, 'id' | 'createdAt'>
): Promise<MarketSnapshot> {
  const result = await queryOne(`
    INSERT INTO trade_market_snapshot (
      trade_signal_id,
      current_price, price_change_24h, volume_24h, market_cap,
      social_sentiment_score, whale_activity_count, fear_greed_index,
      galaxy_score, alt_rank, social_dominance,
      sentiment_positive, sentiment_negative, sentiment_neutral,
      social_volume_24h, social_posts_24h, social_interactions_24h,
      social_contributors_24h, correlation_score,
      sopr_value, mvrv_z_score,
      snapshot_at
    ) VALUES (
      $1,
      $2, $3, $4, $5,
      $6, $7, $8,
      $9, $10, $11,
      $12, $13, $14,
      $15, $16, $17,
      $18, $19,
      $20, $21,
      $22
    )
    RETURNING *
  `, [
    snapshot.tradeSignalId,
    snapshot.currentPrice, snapshot.priceChange24h, snapshot.volume24h, snapshot.marketCap,
    snapshot.socialSentimentScore, snapshot.whaleActivityCount, snapshot.fearGreedIndex,
    snapshot.galaxyScore, snapshot.altRank, snapshot.socialDominance,
    snapshot.sentimentPositive, snapshot.sentimentNegative, snapshot.sentimentNeutral,
    snapshot.socialVolume24h, snapshot.socialPosts24h, snapshot.socialInteractions24h,
    snapshot.socialContributors24h, snapshot.correlationScore,
    snapshot.soprValue, snapshot.mvrvZScore,
    snapshot.snapshotAt
  ]);
  
  return mapMarketSnapshotFromDb(result);
}

// ============================================================================
// HISTORICAL PRICES FUNCTIONS
// ============================================================================

/**
 * Batch insert OHLCV data
 */
export async function storeHistoricalPrices(
  prices: Omit<HistoricalPrice, 'id' | 'createdAt'>[]
): Promise<void> {
  if (prices.length === 0) return;
  
  // Build batch insert query
  const values: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  
  for (const price of prices) {
    values.push(`(
      $${paramIndex++}, $${paramIndex++},
      $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++},
      $${paramIndex++}
    )`);
    
    params.push(
      price.tradeSignalId, price.timestamp,
      price.openPrice, price.highPrice, price.lowPrice, price.closePrice, price.volume,
      price.dataSource
    );
  }
  
  await query(`
    INSERT INTO trade_historical_prices (
      trade_signal_id, timestamp,
      open_price, high_price, low_price, close_price, volume,
      data_source
    ) VALUES ${values.join(', ')}
    ON CONFLICT (trade_signal_id, timestamp, data_source) DO NOTHING
  `, params);
}

// ============================================================================
// MAPPING FUNCTIONS (DB to TypeScript)
// ============================================================================

function mapTradeSignalFromDb(row: any): TradeSignal {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    status: row.status,
    entryPrice: parseFloat(row.entry_price),
    tp1Price: parseFloat(row.tp1_price),
    tp1Allocation: parseFloat(row.tp1_allocation),
    tp2Price: parseFloat(row.tp2_price),
    tp2Allocation: parseFloat(row.tp2_allocation),
    tp3Price: parseFloat(row.tp3_price),
    tp3Allocation: parseFloat(row.tp3_allocation),
    stopLossPrice: parseFloat(row.stop_loss_price),
    stopLossPercentage: parseFloat(row.stop_loss_percentage),
    timeframe: row.timeframe,
    timeframeHours: row.timeframe_hours,
    confidenceScore: row.confidence_score,
    riskRewardRatio: parseFloat(row.risk_reward_ratio),
    marketCondition: row.market_condition,
    aiReasoning: row.ai_reasoning,
    aiModelVersion: row.ai_model_version,
    generatedAt: new Date(row.generated_at),
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

function mapTradeResultFromDb(row: any): TradeResult {
  return {
    id: row.id,
    tradeSignalId: row.trade_signal_id,
    actualEntryPrice: parseFloat(row.actual_entry_price),
    actualExitPrice: row.actual_exit_price ? parseFloat(row.actual_exit_price) : undefined,
    tp1Hit: row.tp1_hit,
    tp1HitAt: row.tp1_hit_at ? new Date(row.tp1_hit_at) : undefined,
    tp1HitPrice: row.tp1_hit_price ? parseFloat(row.tp1_hit_price) : undefined,
    tp2Hit: row.tp2_hit,
    tp2HitAt: row.tp2_hit_at ? new Date(row.tp2_hit_at) : undefined,
    tp2HitPrice: row.tp2_hit_price ? parseFloat(row.tp2_hit_price) : undefined,
    tp3Hit: row.tp3_hit,
    tp3HitAt: row.tp3_hit_at ? new Date(row.tp3_hit_at) : undefined,
    tp3HitPrice: row.tp3_hit_price ? parseFloat(row.tp3_hit_price) : undefined,
    stopLossHit: row.stop_loss_hit,
    stopLossHitAt: row.stop_loss_hit_at ? new Date(row.stop_loss_hit_at) : undefined,
    stopLossHitPrice: row.stop_loss_hit_price ? parseFloat(row.stop_loss_hit_price) : undefined,
    profitLossUsd: row.profit_loss_usd ? parseFloat(row.profit_loss_usd) : undefined,
    profitLossPercentage: row.profit_loss_percentage ? parseFloat(row.profit_loss_percentage) : undefined,
    tradeDurationMinutes: row.trade_duration_minutes,
    tradeSizeUsd: parseFloat(row.trade_size_usd),
    feesUsd: parseFloat(row.fees_usd),
    slippageUsd: parseFloat(row.slippage_usd),
    netProfitLossUsd: row.net_profit_loss_usd ? parseFloat(row.net_profit_loss_usd) : undefined,
    dataSource: row.data_source,
    dataResolution: row.data_resolution,
    dataQualityScore: row.data_quality_score,
    aiAnalysis: row.ai_analysis,
    backtestedAt: new Date(row.backtested_at),
    createdAt: new Date(row.created_at)
  };
}

function mapTechnicalIndicatorsFromDb(row: any): TechnicalIndicators {
  return {
    id: row.id,
    tradeSignalId: row.trade_signal_id,
    rsiValue: row.rsi_value ? parseFloat(row.rsi_value) : undefined,
    macdValue: row.macd_value ? parseFloat(row.macd_value) : undefined,
    macdSignal: row.macd_signal ? parseFloat(row.macd_signal) : undefined,
    macdHistogram: row.macd_histogram ? parseFloat(row.macd_histogram) : undefined,
    ema20: row.ema_20 ? parseFloat(row.ema_20) : undefined,
    ema50: row.ema_50 ? parseFloat(row.ema_50) : undefined,
    ema200: row.ema_200 ? parseFloat(row.ema_200) : undefined,
    bollingerUpper: row.bollinger_upper ? parseFloat(row.bollinger_upper) : undefined,
    bollingerMiddle: row.bollinger_middle ? parseFloat(row.bollinger_middle) : undefined,
    bollingerLower: row.bollinger_lower ? parseFloat(row.bollinger_lower) : undefined,
    atrValue: row.atr_value ? parseFloat(row.atr_value) : undefined,
    volume24h: row.volume_24h ? parseFloat(row.volume_24h) : undefined,
    marketCap: row.market_cap ? parseFloat(row.market_cap) : undefined,
    createdAt: new Date(row.created_at)
  };
}

function mapMarketSnapshotFromDb(row: any): MarketSnapshot {
  return {
    id: row.id,
    tradeSignalId: row.trade_signal_id,
    currentPrice: parseFloat(row.current_price),
    priceChange24h: row.price_change_24h ? parseFloat(row.price_change_24h) : undefined,
    volume24h: row.volume_24h ? parseFloat(row.volume_24h) : undefined,
    marketCap: row.market_cap ? parseFloat(row.market_cap) : undefined,
    socialSentimentScore: row.social_sentiment_score,
    whaleActivityCount: row.whale_activity_count,
    fearGreedIndex: row.fear_greed_index,
    // LunarCrush fields
    galaxyScore: row.galaxy_score,
    altRank: row.alt_rank,
    socialDominance: row.social_dominance ? parseFloat(row.social_dominance) : undefined,
    sentimentPositive: row.sentiment_positive ? parseFloat(row.sentiment_positive) : undefined,
    sentimentNegative: row.sentiment_negative ? parseFloat(row.sentiment_negative) : undefined,
    sentimentNeutral: row.sentiment_neutral ? parseFloat(row.sentiment_neutral) : undefined,
    socialVolume24h: row.social_volume_24h,
    socialPosts24h: row.social_posts_24h,
    socialInteractions24h: row.social_interactions_24h,
    socialContributors24h: row.social_contributors_24h,
    correlationScore: row.correlation_score ? parseFloat(row.correlation_score) : undefined,
    // Glassnode on-chain metrics
    soprValue: row.sopr_value ? parseFloat(row.sopr_value) : undefined,
    mvrvZScore: row.mvrv_z_score ? parseFloat(row.mvrv_z_score) : undefined,
    snapshotAt: new Date(row.snapshot_at),
    createdAt: new Date(row.created_at)
  };
}
