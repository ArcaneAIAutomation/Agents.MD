/**
 * Quantum BTC Trade Details Endpoint
 * GET /api/quantum/trade-details/:tradeId
 * 
 * Retrieves complete details for a specific Bitcoin trade including:
 * - Full trade data
 * - Validation history (hourly snapshots)
 * - Anomaly logs
 * - Current status
 * 
 * Requirements: 13.1-13.10
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, queryMany } from '../../../../lib/db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TradeSignal {
  id: string;
  user_id: string;
  symbol: string;
  entryZone: {
    min: number;
    max: number;
    optimal: number;
  };
  targets: {
    tp1: { price: number; allocation: number };
    tp2: { price: number; allocation: number };
    tp3: { price: number; allocation: number };
  };
  stopLoss: {
    price: number;
    maxLossPercent: number;
  };
  timeframe: string;
  timeframeHours: number;
  confidence: number;
  quantumReasoning: string;
  mathematicalJustification: string;
  wavePatternCollapse: string;
  dataQualityScore: number;
  crossAPIProof: any[];
  historicalTriggers: any[];
  status: string;
  generatedAt: string;
  expiresAt: string;
  lastValidatedAt: string | null;
}

interface HourlySnapshot {
  id: string;
  trade_id: string;
  price: number;
  volume_24h: number;
  market_cap: number;
  mempool_size: number;
  whale_transactions: number;
  sentiment_score: number | null;
  social_dominance: number | null;
  deviation_from_prediction: number;
  phase_shift_detected: boolean;
  data_quality_score: number;
  snapshot_at: string;
}

interface QuantumAnomaly {
  id: string;
  anomaly_type: string;
  severity: string;
  description: string;
  detected_at: string;
}

interface TradeValidation {
  status: string;
  currentPrice: number;
  targetsHit: {
    tp1: boolean;
    tp2: boolean;
    tp3: boolean;
    stopLoss: boolean;
  };
  deviationScore: number;
  phaseShiftDetected: boolean;
  lastValidated: string | null;
}

interface TradeDetailsResponse {
  success: boolean;
  trade?: TradeSignal;
  validationHistory?: HourlySnapshot[];
  anomalies?: QuantumAnomaly[];
  currentStatus?: TradeValidation;
  error?: string;
}

// ============================================================================
// DATABASE QUERIES
// ============================================================================

async function fetchTradeById(tradeId: string): Promise<TradeSignal | null> {
  const sql = `
    SELECT 
      id, user_id, symbol,
      entry_min, entry_max, entry_optimal,
      tp1_price, tp1_allocation,
      tp2_price, tp2_allocation,
      tp3_price, tp3_allocation,
      stop_loss_price, max_loss_percent,
      timeframe, timeframe_hours,
      confidence_score, quantum_reasoning,
      mathematical_justification, wave_pattern_collapse,
      data_quality_score, cross_api_proof, historical_triggers,
      status, generated_at, expires_at, last_validated_at
    FROM btc_trades
    WHERE id = $1
  `;
  
  const row = await queryOne<any>(sql, [tradeId]);
  
  if (!row) {
    return null;
  }
  
  // Transform database row to TradeSignal format
  return {
    id: row.id,
    user_id: row.user_id,
    symbol: row.symbol,
    entryZone: {
      min: parseFloat(row.entry_min),
      max: parseFloat(row.entry_max),
      optimal: parseFloat(row.entry_optimal),
    },
    targets: {
      tp1: { price: parseFloat(row.tp1_price), allocation: row.tp1_allocation },
      tp2: { price: parseFloat(row.tp2_price), allocation: row.tp2_allocation },
      tp3: { price: parseFloat(row.tp3_price), allocation: row.tp3_allocation },
    },
    stopLoss: {
      price: parseFloat(row.stop_loss_price),
      maxLossPercent: parseFloat(row.max_loss_percent),
    },
    timeframe: row.timeframe,
    timeframeHours: row.timeframe_hours,
    confidence: row.confidence_score,
    quantumReasoning: row.quantum_reasoning,
    mathematicalJustification: row.mathematical_justification,
    wavePatternCollapse: row.wave_pattern_collapse,
    dataQualityScore: row.data_quality_score,
    crossAPIProof: typeof row.cross_api_proof === 'string' 
      ? JSON.parse(row.cross_api_proof) 
      : row.cross_api_proof,
    historicalTriggers: typeof row.historical_triggers === 'string'
      ? JSON.parse(row.historical_triggers)
      : row.historical_triggers,
    status: row.status,
    generatedAt: row.generated_at,
    expiresAt: row.expires_at,
    lastValidatedAt: row.last_validated_at,
  };
}

async function fetchValidationHistory(tradeId: string): Promise<HourlySnapshot[]> {
  const sql = `
    SELECT 
      id, trade_id, price, volume_24h, market_cap,
      mempool_size, whale_transactions,
      sentiment_score, social_dominance,
      deviation_from_prediction, phase_shift_detected,
      data_quality_score, snapshot_at
    FROM btc_hourly_snapshots
    WHERE trade_id = $1
    ORDER BY snapshot_at DESC
  `;
  
  return await queryMany<HourlySnapshot>(sql, [tradeId]);
}

async function fetchAnomalies(tradeId: string): Promise<QuantumAnomaly[]> {
  const sql = `
    SELECT 
      id, anomaly_type, severity, description, detected_at
    FROM quantum_anomaly_logs
    WHERE trade_id = $1
    ORDER BY detected_at DESC
  `;
  
  return await queryMany<QuantumAnomaly>(sql, [tradeId]);
}

async function calculateCurrentStatus(
  trade: TradeSignal,
  validationHistory: HourlySnapshot[]
): Promise<TradeValidation> {
  // Get latest snapshot for current price
  const latestSnapshot = validationHistory[0];
  const currentPrice = latestSnapshot?.price || trade.entryZone.optimal;
  
  // Check which targets have been hit
  const targetsHit = {
    tp1: currentPrice >= trade.targets.tp1.price,
    tp2: currentPrice >= trade.targets.tp2.price,
    tp3: currentPrice >= trade.targets.tp3.price,
    stopLoss: currentPrice <= trade.stopLoss.price,
  };
  
  // Calculate deviation score (average from snapshots)
  const deviationScore = validationHistory.length > 0
    ? validationHistory.reduce((sum, s) => sum + s.deviation_from_prediction, 0) / validationHistory.length
    : 0;
  
  // Check if any phase shift detected
  const phaseShiftDetected = validationHistory.some(s => s.phase_shift_detected);
  
  return {
    status: trade.status,
    currentPrice,
    targetsHit,
    deviationScore,
    phaseShiftDetected,
    lastValidated: trade.lastValidatedAt,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TradeDetailsResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    });
  }
  
  try {
    const { tradeId } = req.query;
    
    // Validate tradeId parameter
    if (!tradeId || typeof tradeId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid trade ID parameter.',
      });
    }
    
    console.log(`[Trade Details] Fetching details for trade ${tradeId}`);
    
    // Fetch trade data
    const trade = await fetchTradeById(tradeId);
    
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found.',
      });
    }
    
    // Fetch validation history, anomalies in parallel
    const [validationHistory, anomalies] = await Promise.all([
      fetchValidationHistory(tradeId),
      fetchAnomalies(tradeId),
    ]);
    
    // Calculate current status
    const currentStatus = await calculateCurrentStatus(trade, validationHistory);
    
    console.log(`[Trade Details] Successfully fetched details for trade ${tradeId}`);
    
    return res.status(200).json({
      success: true,
      trade,
      validationHistory,
      anomalies,
      currentStatus,
    });
    
  } catch (error) {
    console.error('[Error] Failed to fetch trade details:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Failed to fetch trade details.',
    });
  }
}
