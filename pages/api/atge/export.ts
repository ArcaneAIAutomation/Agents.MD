/**
 * ATGE Export API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Exports trade data in CSV, JSON, or PDF format.
 * Allows filtering by date range, status, and other criteria.
 * 
 * Requirements: 16.1-16.7
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

interface ExportTrade {
  id: string;
  symbol: string;
  status: string;
  entryPrice: number;
  tp1Price: number;
  tp2Price: number;
  tp3Price: number;
  stopLossPrice: number;
  stopLossPercentage: number;
  timeframe: string;
  confidenceScore: number;
  riskRewardRatio: number;
  marketCondition: string;
  generatedAt: Date;
  expiresAt: Date;
  
  // Results (if available)
  profitLossUsd?: number;
  profitLossPercentage?: number;
  tradeDurationMinutes?: number;
  tp1Hit?: boolean;
  tp2Hit?: boolean;
  tp3Hit?: boolean;
  stopLossHit?: boolean;
  dataSource?: string;
  dataQualityScore?: number;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  try {
    // Get authenticated user
    const userId = req.user!.id;
    
    // Parse query parameters
    const {
      format = 'csv',
      symbol,
      status,
      timeframe,
      startDate,
      endDate
    } = req.query;
    
    // Validate format
    const validFormats = ['csv', 'json'];
    if (!validFormats.includes(format as string)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}`
      });
    }
    
    // Build WHERE clause
    const conditions: string[] = ['ts.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (symbol) {
      conditions.push(`ts.symbol = $${paramIndex++}`);
      params.push(symbol);
    }
    
    if (status) {
      conditions.push(`ts.status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (timeframe) {
      conditions.push(`ts.timeframe = $${paramIndex++}`);
      params.push(timeframe);
    }
    
    if (startDate) {
      conditions.push(`ts.generated_at >= $${paramIndex++}`);
      params.push(new Date(startDate as string));
    }
    
    if (endDate) {
      conditions.push(`ts.generated_at <= $${paramIndex++}`);
      params.push(new Date(endDate as string));
    }
    
    const whereClause = conditions.join(' AND ');
    
    // Fetch trades with results
    const result = await query(`
      SELECT 
        ts.id, ts.symbol, ts.status,
        ts.entry_price, 
        ts.tp1_price, ts.tp2_price, ts.tp3_price,
        ts.stop_loss_price, ts.stop_loss_percentage,
        ts.timeframe, ts.confidence_score, ts.risk_reward_ratio, ts.market_condition,
        ts.generated_at, ts.expires_at,
        
        tr.profit_loss_usd, tr.profit_loss_percentage, tr.trade_duration_minutes,
        tr.tp1_hit, tr.tp2_hit, tr.tp3_hit, tr.stop_loss_hit,
        tr.data_source, tr.data_quality_score
        
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      WHERE ${whereClause}
      ORDER BY ts.generated_at DESC
    `, params);
    
    // Map to export format
    const trades: ExportTrade[] = result.rows.map((row: any) => ({
      id: row.id,
      symbol: row.symbol,
      status: row.status,
      entryPrice: parseFloat(row.entry_price),
      tp1Price: parseFloat(row.tp1_price),
      tp2Price: parseFloat(row.tp2_price),
      tp3Price: parseFloat(row.tp3_price),
      stopLossPrice: parseFloat(row.stop_loss_price),
      stopLossPercentage: parseFloat(row.stop_loss_percentage),
      timeframe: row.timeframe,
      confidenceScore: row.confidence_score,
      riskRewardRatio: parseFloat(row.risk_reward_ratio),
      marketCondition: row.market_condition,
      generatedAt: new Date(row.generated_at),
      expiresAt: new Date(row.expires_at),
      
      // Results (if available)
      profitLossUsd: row.profit_loss_usd ? parseFloat(row.profit_loss_usd) : undefined,
      profitLossPercentage: row.profit_loss_percentage ? parseFloat(row.profit_loss_percentage) : undefined,
      tradeDurationMinutes: row.trade_duration_minutes,
      tp1Hit: row.tp1_hit,
      tp2Hit: row.tp2_hit,
      tp3Hit: row.tp3_hit,
      stopLossHit: row.stop_loss_hit,
      dataSource: row.data_source,
      dataQualityScore: row.data_quality_score
    }));
    
    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(trades);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="atge-trades-${Date.now()}.csv"`);
      
      return res.status(200).send(csv);
    } else if (format === 'json') {
      const json = JSON.stringify(trades, null, 2);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="atge-trades-${Date.now()}.json"`);
      
      return res.status(200).send(json);
    }
    
  } catch (error) {
    console.error('Export trades error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to export trades',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

/**
 * Generate CSV from trades data
 */
function generateCSV(trades: ExportTrade[]): string {
  // CSV header
  const headers = [
    'Trade ID',
    'Symbol',
    'Status',
    'Entry Price',
    'TP1 Price',
    'TP2 Price',
    'TP3 Price',
    'Stop Loss Price',
    'Stop Loss %',
    'Timeframe',
    'Confidence Score',
    'Risk/Reward Ratio',
    'Market Condition',
    'Generated At',
    'Expires At',
    'Profit/Loss USD',
    'Profit/Loss %',
    'Duration (min)',
    'TP1 Hit',
    'TP2 Hit',
    'TP3 Hit',
    'Stop Loss Hit',
    'Data Source',
    'Data Quality Score'
  ];
  
  // CSV rows
  const rows = trades.map(trade => [
    trade.id,
    trade.symbol,
    trade.status,
    trade.entryPrice,
    trade.tp1Price,
    trade.tp2Price,
    trade.tp3Price,
    trade.stopLossPrice,
    trade.stopLossPercentage,
    trade.timeframe,
    trade.confidenceScore,
    trade.riskRewardRatio,
    trade.marketCondition,
    trade.generatedAt.toISOString(),
    trade.expiresAt.toISOString(),
    trade.profitLossUsd !== undefined ? trade.profitLossUsd : '',
    trade.profitLossPercentage !== undefined ? trade.profitLossPercentage : '',
    trade.tradeDurationMinutes !== undefined ? trade.tradeDurationMinutes : '',
    trade.tp1Hit !== undefined ? trade.tp1Hit : '',
    trade.tp2Hit !== undefined ? trade.tp2Hit : '',
    trade.tp3Hit !== undefined ? trade.tp3Hit : '',
    trade.stopLossHit !== undefined ? trade.stopLossHit : '',
    trade.dataSource || '',
    trade.dataQualityScore !== undefined ? trade.dataQualityScore : ''
  ]);
  
  // Combine header and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape commas and quotes in cell values
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ];
  
  return csvLines.join('\n');
}

export default withAuth(handler);
