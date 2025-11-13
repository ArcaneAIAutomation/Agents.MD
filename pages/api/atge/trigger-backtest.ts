/**
 * ATGE Trigger Backtest API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Manually triggers backtesting for a specific trade signal.
 * Fetches historical data, runs backtesting, generates AI analysis, and returns updated trade.
 * 
 * Requirements: 4.1-4.15, 6.1-6.20, 7.1-7.15
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { fetchTradeSignal, updateTradeStatus } from '../../../lib/atge/database';
import { fetchHistoricalPriceData } from '../../../lib/atge/historicalData';
import { analyzeTradeOutcome } from '../../../lib/atge/backtesting';
import { analyzeCompletedTrade } from '../../../lib/atge/aiAnalyzer';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  try {
    // Get authenticated user
    const userId = req.user!.id;
    
    // Get trade signal ID from request body
    const { tradeSignalId } = req.body;
    
    if (!tradeSignalId) {
      return res.status(400).json({
        success: false,
        error: 'Trade signal ID is required'
      });
    }
    
    // Fetch trade signal from database
    const tradeSignal = await fetchTradeSignal(tradeSignalId);
    
    if (!tradeSignal) {
      return res.status(404).json({
        success: false,
        error: 'Trade signal not found'
      });
    }
    
    // Verify ownership
    if (tradeSignal.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to backtest this trade'
      });
    }
    
    // Check if trade is already completed
    if (tradeSignal.status === 'completed_success' || tradeSignal.status === 'completed_failure') {
      return res.status(400).json({
        success: false,
        error: 'Trade has already been backtested',
        trade: tradeSignal
      });
    }
    
    // Step 1: Fetch historical price data
    console.log(`[Backtest] Fetching historical data for trade ${tradeSignalId}...`);
    
    const historicalData = await fetchHistoricalPriceData({
      symbol: tradeSignal.symbol,
      startTime: tradeSignal.generatedAt,
      endTime: tradeSignal.expiresAt,
      resolution: '1m' // Minute-level data for maximum accuracy
    });
    
    if (!historicalData || historicalData.length === 0) {
      console.error(`[Backtest] No historical data available for trade ${tradeSignalId}`);
      
      // Mark as incomplete data
      await updateTradeStatus(tradeSignalId, 'incomplete_data');
      
      return res.status(400).json({
        success: false,
        error: 'Insufficient historical data for backtesting',
        trade: await fetchTradeSignal(tradeSignalId)
      });
    }
    
    console.log(`[Backtest] Fetched ${historicalData.length} price data points`);
    
    // Step 2: Run backtesting analysis
    console.log(`[Backtest] Analyzing trade outcome...`);
    
    const backtestResult = await analyzeTradeOutcome(tradeSignal, historicalData);
    
    console.log(`[Backtest] Analysis complete. Status: ${backtestResult.status}`);
    console.log(`[Backtest] P/L: $${backtestResult.profitLossUsd}`);
    
    // Step 3: Generate AI analysis (optional, can be done asynchronously)
    let aiAnalysis: string | undefined;
    
    try {
      console.log(`[Backtest] Generating AI analysis...`);
      aiAnalysis = await analyzeCompletedTrade(tradeSignal, backtestResult);
      console.log(`[Backtest] AI analysis generated`);
    } catch (error) {
      console.error(`[Backtest] AI analysis failed:`, error);
      // Continue without AI analysis - it's not critical
    }
    
    // Step 4: Fetch updated trade with results
    const updatedTrade = await fetchTradeSignal(tradeSignalId);
    
    return res.status(200).json({
      success: true,
      message: 'Backtesting completed successfully',
      trade: updatedTrade,
      result: {
        ...backtestResult,
        aiAnalysis
      }
    });
    
  } catch (error) {
    console.error('Trigger backtest error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to trigger backtesting',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export default withAuth(handler);
