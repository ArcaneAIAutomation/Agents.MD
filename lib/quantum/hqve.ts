/**
 * Hourly Quantum Validation Engine (HQVE)
 * Quantum BTC Super Spec - Real-time Trade Validation System
 * 
 * Validates trade predictions every hour against live market data,
 * tracks accuracy, detects phase shifts, and identifies anomalies.
 * 
 * Requirements: 4.1-4.15 (Hourly Quantum Validation Engine)
 */

import { query, queryOne, queryMany } from '../db';
import { qdpp, type ComprehensiveMarketData } from './qdpp';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TradeValidation {
  tradeId: string;
  status: 'HIT' | 'NOT_HIT' | 'INVALIDATED' | 'EXPIRED';
  currentPrice: number;
  targetsHit: {
    tp1: boolean;
    tp2: boolean;
    tp3: boolean;
    stopLoss: boolean;
  };
  deviationScore: number; // 0-100 (lower is better)
  phaseShiftDetected: boolean;
  anomalies: QuantumAnomaly[];
  snapshot: HourlySnapshot;
}

export interface HourlySnapshot {
  timestamp: string;
  price: number;
  volume24h: number;
  mempoolSize: number;
  whaleTransactions: number;
  sentiment: number;
  deviationFromPrediction: number;
  dataQualityScore: number;
}

export interface QuantumAnomaly {
  type: 'PRICE_DIVERGENCE' | 'MEMPOOL_ZERO' | 'WHALE_COUNT_LOW' | 'PHASE_SHIFT' | 'DATA_QUALITY_LOW';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
  description: string;
  affectedSources: string[];
  impact: string;
  detectedAt: string;
}

export interface ValidationSummary {
  tradesValidated: number;
  tradesHit: number;
  tradesNotHit: number;
  tradesInvalidated: number;
  tradesExpired: number;
  anomaliesDetected: number;
  executionTime: number;
  errors: string[];
}

export interface ActiveTrade {
  id: string;
  user_id: string;
  symbol: string;
  entry_min: number;
  entry_max: number;
  entry_optimal: number;
  tp1_price: number;
  tp2_price: number;
  tp3_price: number;
  stop_loss_price: number;
  timeframe: string;
  confidence_score: number;
  quantum_reasoning: string;
  generated_at: string;
  expires_at: string;
  status: string;
}

export interface PhaseShiftResult {
  detected: boolean;
  previousPhase: string;
  currentPhase: string;
  confidence: number;
  description: string;
}

// ============================================================================
// HOURLY QUANTUM VALIDATION ENGINE
// ============================================================================

export class HourlyQuantumValidationEngine {
  /**
   * Subtask 6.1: Implement hourly validation worker
   * Fetch all active trades and validate them
   * 
   * Requirements: 4.1, 4.2
   */
  async validateAllTrades(): Promise<ValidationSummary> {
    console.log('🔄 Starting Hourly Quantum Validation...');
    const startTime = Date.now();
    
    const summary: ValidationSummary = {
      tradesValidated: 0,
      tradesHit: 0,
      tradesNotHit: 0,
      tradesInvalidated: 0,
      tradesExpired: 0,
      anomaliesDetected: 0,
      executionTime: 0,
      errors: []
    };
    
    try {
      // Fetch all active trades from database
      console.log('📊 Fetching active trades...');
      const activeTrades = await this.fetchActiveTrades();
      
      console.log(`   Found ${activeTrades.length} active trades`);
      
      if (activeTrades.length === 0) {
        console.log('✅ No active trades to validate');
        summary.executionTime = Date.now() - startTime;
        return summary;
      }
      
      // Validate each trade
      for (const trade of activeTrades) {
        try {
          console.log(`\n🔍 Validating trade ${trade.id}...`);
          
          const validation = await this.validateSingleTrade(trade.id);
          
          summary.tradesValidated++;
          
          // Update counters based on status
          switch (validation.status) {
            case 'HIT':
              summary.tradesHit++;
              break;
            case 'NOT_HIT':
              summary.tradesNotHit++;
              break;
            case 'INVALIDATED':
              summary.tradesInvalidated++;
              break;
            case 'EXPIRED':
              summary.tradesExpired++;
              break;
          }
          
          // Count anomalies
          summary.anomaliesDetected += validation.anomalies.length;
          
          console.log(`   Status: ${validation.status}`);
          console.log(`   Deviation: ${validation.deviationScore.toFixed(2)}%`);
          console.log(`   Anomalies: ${validation.anomalies.length}`);
          
        } catch (error: any) {
          console.error(`❌ Failed to validate trade ${trade.id}:`, error.message);
          summary.errors.push(`Trade ${trade.id}: ${error.message}`);
        }
      }
      
      // Update performance metrics
      await this.updatePerformanceMetrics(summary);
      
      summary.executionTime = Date.now() - startTime;
      
      console.log(`\n✅ Hourly validation complete in ${summary.executionTime}ms`);
      console.log(`   Validated: ${summary.tradesValidated}`);
      console.log(`   Hit: ${summary.tradesHit}`);
      console.log(`   Not Hit: ${summary.tradesNotHit}`);
      console.log(`   Invalidated: ${summary.tradesInvalidated}`);
      console.log(`   Expired: ${summary.tradesExpired}`);
      console.log(`   Anomalies: ${summary.anomaliesDetected}`);
      
      return summary;
      
    } catch (error: any) {
      console.error('❌ Hourly validation failed:', error.message);
      summary.errors.push(`System error: ${error.message}`);
      summary.executionTime = Date.now() - startTime;
      return summary;
    }
  }

  /**
   * Fetch all active trades from database
   */
  private async fetchActiveTrades(): Promise<ActiveTrade[]> {
    const result = await query(
      `SELECT * FROM btc_trades 
       WHERE status = 'ACTIVE' 
       AND expires_at > NOW()
       ORDER BY generated_at DESC`,
      []
    );
    
    return result.rows as ActiveTrade[];
  }

  /**
   * Subtask 6.2: Implement trade validation logic
   * Compare predicted vs actual price movement and validate quantum trajectory
   * 
   * Requirements: 4.4, 4.5
   */
  async validateSingleTrade(tradeId: string): Promise<TradeValidation> {
    console.log(`🔍 Validating trade ${tradeId}...`);
    
    // Step 1: Fetch trade from database
    const trade = await this.fetchTrade(tradeId);
    
    if (!trade) {
      throw new Error(`Trade ${tradeId} not found`);
    }
    
    // Step 2: Check if trade has expired
    const now = new Date();
    const expiresAt = new Date(trade.expires_at);
    
    if (now > expiresAt) {
      console.log('   Trade has expired');
      await this.updateTradeStatus(tradeId, 'EXPIRED');
      
      return {
        tradeId,
        status: 'EXPIRED',
        currentPrice: 0,
        targetsHit: { tp1: false, tp2: false, tp3: false, stopLoss: false },
        deviationScore: 0,
        phaseShiftDetected: false,
        anomalies: [],
        snapshot: await this.createEmptySnapshot()
      };
    }
    
    // Step 3: Fetch current market data
    console.log('   Fetching current market data...');
    const marketData = await qdpp.getComprehensiveMarketData();
    const currentPrice = marketData.triangulation.medianPrice;
    
    console.log(`   Current price: ${currentPrice.toFixed(2)}`);
    console.log(`   Entry optimal: ${trade.entry_optimal.toFixed(2)}`);
    
    // Step 4: Check which targets have been hit
    const targetsHit = {
      tp1: currentPrice >= trade.tp1_price,
      tp2: currentPrice >= trade.tp2_price,
      tp3: currentPrice >= trade.tp3_price,
      stopLoss: currentPrice <= trade.stop_loss_price
    };
    
    console.log(`   Targets hit: TP1=${targetsHit.tp1}, TP2=${targetsHit.tp2}, TP3=${targetsHit.tp3}, SL=${targetsHit.stopLoss}`);
    
    // Step 5: Determine trade status
    const status = await this.determineTradeStatus(trade, targetsHit, currentPrice);
    
    // Step 6: Calculate deviation score
    const deviationScore = this.calculateDeviationScore(trade, currentPrice);
    
    // Step 7: Capture hourly snapshot
    const snapshot = await this.captureHourlySnapshot(tradeId, trade, marketData, deviationScore);
    
    // Step 8: Detect phase shifts
    const phaseShift = await this.detectPhaseShift(tradeId);
    
    // Step 9: Detect anomalies
    const anomalies = await this.detectAnomalies(trade, marketData, phaseShift);
    
    // Step 10: Update trade status in database
    await this.updateTradeStatus(tradeId, status);
    await this.updateLastValidated(tradeId);
    
    return {
      tradeId,
      status,
      currentPrice,
      targetsHit,
      deviationScore,
      phaseShiftDetected: phaseShift.detected,
      anomalies,
      snapshot
    };
  }

  /**
   * Fetch trade from database
   */
  private async fetchTrade(tradeId: string): Promise<ActiveTrade | null> {
    const result = await queryOne(
      'SELECT * FROM btc_trades WHERE id = $1',
      [tradeId]
    );
    
    return result as ActiveTrade | null;
  }

  /**
   * Subtask 6.3: Implement status determination
   * Classify as hit, not_hit, invalidated, or expired
   * 
   * Requirements: 4.6
   */
  private async determineTradeStatus(
    trade: ActiveTrade,
    targetsHit: { tp1: boolean; tp2: boolean; tp3: boolean; stopLoss: boolean },
    currentPrice: number
  ): Promise<'HIT' | 'NOT_HIT' | 'INVALIDATED' | 'EXPIRED'> {
    // If stop loss hit, trade is invalidated
    if (targetsHit.stopLoss) {
      console.log('   ❌ Stop loss hit - INVALIDATED');
      return 'INVALIDATED';
    }
    
    // If any target hit, trade is successful
    if (targetsHit.tp1 || targetsHit.tp2 || targetsHit.tp3) {
      console.log('   ✅ Target hit - HIT');
      return 'HIT';
    }
    
    // Check if price is moving in predicted direction
    const entryPrice = trade.entry_optimal;
    const isLong = trade.tp1_price > entryPrice; // Assuming LONG if TP1 > entry
    
    if (isLong) {
      // For LONG trades, check if price is above entry
      if (currentPrice > entryPrice) {
        console.log('   📈 Price above entry - NOT_HIT (yet)');
        return 'NOT_HIT';
      } else {
        // Price below entry but stop not hit yet
        console.log('   📉 Price below entry - NOT_HIT');
        return 'NOT_HIT';
      }
    } else {
      // For SHORT trades, check if price is below entry
      if (currentPrice < entryPrice) {
        console.log('   📉 Price below entry - NOT_HIT (yet)');
        return 'NOT_HIT';
      } else {
        console.log('   📈 Price above entry - NOT_HIT');
        return 'NOT_HIT';
      }
    }
  }

  /**
   * Subtask 6.4: Implement hourly snapshot capture
   * Capture price, volume, mempool, sentiment and store in database
   * 
   * Requirements: 4.7-4.10
   */
  private async captureHourlySnapshot(
    tradeId: string,
    trade: ActiveTrade,
    marketData: ComprehensiveMarketData,
    deviationScore: number
  ): Promise<HourlySnapshot> {
    console.log('   📸 Capturing hourly snapshot...');
    
    const snapshot: HourlySnapshot = {
      timestamp: new Date().toISOString(),
      price: marketData.triangulation.medianPrice,
      volume24h: marketData.marketData.coinMarketCap?.volume24h || 0,
      mempoolSize: marketData.onChain?.mempoolSize || 0,
      whaleTransactions: marketData.onChain?.whaleTransactions.length || 0,
      sentiment: marketData.sentiment?.sentimentScore || 50,
      deviationFromPrediction: deviationScore,
      dataQualityScore: marketData.validation.dataQualityScore
    };
    
    // Store snapshot in database
    await query(
      `INSERT INTO btc_hourly_snapshots (
        trade_id, price, volume_24h, market_cap,
        mempool_size, whale_transactions, difficulty,
        sentiment_score, social_dominance,
        deviation_from_prediction, phase_shift_detected, data_quality_score,
        snapshot_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        tradeId,
        snapshot.price,
        snapshot.volume24h,
        marketData.marketData.coinMarketCap?.marketCap || 0,
        snapshot.mempoolSize,
        snapshot.whaleTransactions,
        marketData.onChain?.difficulty || 0,
        snapshot.sentiment,
        marketData.sentiment?.socialDominance || 0,
        snapshot.deviationFromPrediction,
        false, // phase_shift_detected (will be updated separately)
        snapshot.dataQualityScore
      ]
    );
    
    console.log('   ✅ Snapshot captured and stored');
    
    return snapshot;
  }

  /**
   * Subtask 6.5: Implement deviation scoring
   * Calculate deviation from prediction
   * 
   * Requirements: 4.11
   */
  private calculateDeviationScore(trade: ActiveTrade, currentPrice: number): number {
    console.log('   📊 Calculating deviation score...');
    
    const entryPrice = trade.entry_optimal;
    const tp1Price = trade.tp1_price;
    const stopPrice = trade.stop_loss_price;
    
    // Determine if this is a LONG or SHORT trade
    const isLong = tp1Price > entryPrice;
    
    // Calculate expected price movement
    const expectedMove = isLong ? (tp1Price - entryPrice) : (entryPrice - tp1Price);
    
    // Calculate actual price movement
    const actualMove = isLong ? (currentPrice - entryPrice) : (entryPrice - currentPrice);
    
    // Calculate deviation as percentage
    const deviation = expectedMove !== 0 
      ? Math.abs((actualMove - expectedMove) / expectedMove) * 100
      : 0;
    
    // Normalize to 0-100 scale (lower is better)
    const deviationScore = Math.min(100, deviation);
    
    console.log(`   Deviation: ${deviationScore.toFixed(2)}%`);
    console.log(`   Expected move: ${expectedMove.toFixed(2)}, Actual move: ${actualMove.toFixed(2)}`);
    
    return deviationScore;
  }

  /**
   * Subtask 6.6: Implement phase-shift detection
   * Detect market structure changes
   * 
   * Requirements: 4.14
   */
  private async detectPhaseShift(tradeId: string): Promise<PhaseShiftResult> {
    console.log('   🔄 Detecting phase shifts...');
    
    // Fetch recent snapshots for this trade
    const snapshots = await queryMany(
      `SELECT * FROM btc_hourly_snapshots 
       WHERE trade_id = $1 
       ORDER BY snapshot_at DESC 
       LIMIT 10`,
      [tradeId]
    );
    
    if (snapshots.length < 3) {
      console.log('   ℹ️  Not enough snapshots for phase shift detection');
      return {
        detected: false,
        previousPhase: 'UNKNOWN',
        currentPhase: 'UNKNOWN',
        confidence: 0,
        description: 'Insufficient data for phase shift detection'
      };
    }
    
    // Analyze price trend
    const prices = snapshots.map((s: any) => s.price);
    const volumes = snapshots.map((s: any) => s.volume_24h);
    
    // Calculate trend direction
    const recentTrend = this.calculateTrend(prices.slice(0, 3));
    const olderTrend = this.calculateTrend(prices.slice(3, 6));
    
    // Detect phase shift if trend reverses
    const phaseShiftDetected = (recentTrend > 0 && olderTrend < 0) || (recentTrend < 0 && olderTrend > 0);
    
    if (phaseShiftDetected) {
      console.log('   ⚠️  Phase shift detected!');
      
      // Update snapshot to mark phase shift
      await query(
        `UPDATE btc_hourly_snapshots 
         SET phase_shift_detected = TRUE 
         WHERE trade_id = $1 
         AND snapshot_at = (
           SELECT MAX(snapshot_at) FROM btc_hourly_snapshots WHERE trade_id = $1
         )`,
        [tradeId]
      );
      
      return {
        detected: true,
        previousPhase: olderTrend > 0 ? 'UPTREND' : 'DOWNTREND',
        currentPhase: recentTrend > 0 ? 'UPTREND' : 'DOWNTREND',
        confidence: 75,
        description: `Market structure changed from ${olderTrend > 0 ? 'uptrend' : 'downtrend'} to ${recentTrend > 0 ? 'uptrend' : 'downtrend'}`
      };
    }
    
    console.log('   ✅ No phase shift detected');
    return {
      detected: false,
      previousPhase: olderTrend > 0 ? 'UPTREND' : 'DOWNTREND',
      currentPhase: recentTrend > 0 ? 'UPTREND' : 'DOWNTREND',
      confidence: 50,
      description: 'Market structure remains consistent'
    };
  }

  /**
   * Calculate trend from price array
   */
  private calculateTrend(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    // Simple linear regression slope
    const n = prices.length;
    const xMean = (n - 1) / 2;
    const yMean = prices.reduce((sum, p) => sum + p, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (prices[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }
    
    return numerator / denominator;
  }

  /**
   * Subtask 6.7: Implement anomaly detection
   * Detect severe anomalies and trigger system suspension if needed
   * 
   * Requirements: 4.15
   */
  private async detectAnomalies(
    trade: ActiveTrade,
    marketData: ComprehensiveMarketData,
    phaseShift: PhaseShiftResult
  ): Promise<QuantumAnomaly[]> {
    console.log('   🔍 Detecting anomalies...');
    
    const anomalies: QuantumAnomaly[] = [];
    
    // Anomaly 1: Price divergence
    if (marketData.triangulation.divergence.hasDivergence) {
      anomalies.push({
        type: 'PRICE_DIVERGENCE',
        severity: 'WARNING',
        description: `Price divergence of ${marketData.triangulation.divergence.maxDivergence.toFixed(2)}% detected`,
        affectedSources: marketData.triangulation.divergence.divergentSources,
        impact: 'May indicate market volatility or API issues',
        detectedAt: new Date().toISOString()
      });
    }
    
    // Anomaly 2: Mempool zero
    if (marketData.onChain && marketData.onChain.mempoolSize === 0) {
      anomalies.push({
        type: 'MEMPOOL_ZERO',
        severity: 'FATAL',
        description: 'Mempool size is 0',
        affectedSources: ['Blockchain.com'],
        impact: 'Cannot validate network activity - data quality is 0',
        detectedAt: new Date().toISOString()
      });
    }
    
    // Anomaly 3: Low whale count
    if (marketData.onChain && marketData.onChain.whaleTransactions.length < 2) {
      anomalies.push({
        type: 'WHALE_COUNT_LOW',
        severity: 'WARNING',
        description: `Only ${marketData.onChain.whaleTransactions.length} whale transactions detected`,
        affectedSources: ['Blockchain.com'],
        impact: 'Reduced confidence in whale activity analysis',
        detectedAt: new Date().toISOString()
      });
    }
    
    // Anomaly 4: Phase shift
    if (phaseShift.detected) {
      anomalies.push({
        type: 'PHASE_SHIFT',
        severity: 'ERROR',
        description: phaseShift.description,
        affectedSources: ['Market Structure'],
        impact: 'Trade prediction may no longer be valid',
        detectedAt: new Date().toISOString()
      });
    }
    
    // Anomaly 5: Low data quality
    if (marketData.validation.dataQualityScore < 70) {
      anomalies.push({
        type: 'DATA_QUALITY_LOW',
        severity: 'ERROR',
        description: `Data quality score is ${marketData.validation.dataQualityScore}% (minimum 70%)`,
        affectedSources: marketData.validation.sources.filter(s => s.status !== 'SUCCESS').map(s => s.name),
        impact: 'Validation results may be unreliable',
        detectedAt: new Date().toISOString()
      });
    }
    
    // Log anomalies to database
    for (const anomaly of anomalies) {
      await this.logAnomaly(trade.id, anomaly);
      
      // If fatal anomaly, trigger system suspension
      if (anomaly.severity === 'FATAL') {
        console.log('   🚨 FATAL ANOMALY DETECTED - System suspension triggered');
        await this.triggerSystemSuspension(anomaly);
      }
    }
    
    console.log(`   Found ${anomalies.length} anomalies`);
    
    return anomalies;
  }

  /**
   * Log anomaly to database
   */
  private async logAnomaly(tradeId: string, anomaly: QuantumAnomaly): Promise<void> {
    await query(
      `INSERT INTO quantum_anomaly_logs (
        anomaly_type, severity, description, affected_sources, impact,
        system_suspended, trade_id, detected_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        anomaly.type,
        anomaly.severity,
        anomaly.description,
        JSON.stringify(anomaly.affectedSources),
        anomaly.impact,
        anomaly.severity === 'FATAL',
        tradeId
      ]
    );
  }

  /**
   * Trigger system suspension for fatal anomalies
   */
  private async triggerSystemSuspension(anomaly: QuantumAnomaly): Promise<void> {
    console.log('🚨 TRIGGERING SYSTEM SUSPENSION');
    console.log(`   Reason: ${anomaly.description}`);
    console.log(`   Impact: ${anomaly.impact}`);
    
    // Update anomaly log with suspension details
    await query(
      `UPDATE quantum_anomaly_logs 
       SET system_suspended = TRUE, suspension_duration_minutes = 60
       WHERE anomaly_type = $1 AND detected_at >= NOW() - INTERVAL '1 minute'`,
      [anomaly.type]
    );
    
    // In a real system, this would:
    // 1. Disable trade generation endpoints
    // 2. Send alerts to administrators
    // 3. Log suspension event
    // 4. Schedule automatic re-enable after investigation
  }

  /**
   * Update trade status in database
   */
  private async updateTradeStatus(tradeId: string, status: string): Promise<void> {
    await query(
      'UPDATE btc_trades SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, tradeId]
    );
  }

  /**
   * Update last validated timestamp
   */
  private async updateLastValidated(tradeId: string): Promise<void> {
    await query(
      'UPDATE btc_trades SET last_validated_at = NOW() WHERE id = $1',
      [tradeId]
    );
  }

  /**
   * Create empty snapshot for expired trades
   */
  private async createEmptySnapshot(): Promise<HourlySnapshot> {
    return {
      timestamp: new Date().toISOString(),
      price: 0,
      volume24h: 0,
      mempoolSize: 0,
      whaleTransactions: 0,
      sentiment: 0,
      deviationFromPrediction: 0,
      dataQualityScore: 0
    };
  }

  /**
   * Update performance metrics in database
   */
  private async updatePerformanceMetrics(summary: ValidationSummary): Promise<void> {
    console.log('📊 Updating performance metrics...');
    
    // Calculate accuracy rate
    const totalCompleted = summary.tradesHit + summary.tradesNotHit + summary.tradesInvalidated;
    const accuracyRate = totalCompleted > 0 
      ? (summary.tradesHit / totalCompleted) * 100 
      : 0;
    
    // Insert or update performance record
    await query(
      `INSERT INTO prediction_accuracy_database (
        total_trades, trades_hit, trades_not_hit, trades_invalidated, trades_expired,
        overall_accuracy_rate, total_anomalies,
        period_start, period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '1 hour', NOW())`,
      [
        summary.tradesValidated,
        summary.tradesHit,
        summary.tradesNotHit,
        summary.tradesInvalidated,
        summary.tradesExpired,
        accuracyRate,
        summary.anomaliesDetected
      ]
    );
    
    console.log(`   Accuracy rate: ${accuracyRate.toFixed(2)}%`);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const hqve = new HourlyQuantumValidationEngine();
