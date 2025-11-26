/**
 * Einstein Trade Generation Endpoint
 * 
 * POST /api/einstein/generate-signal
 * 
 * Generates a comprehensive trade signal using the Einstein 100000x Trade Generation Engine.
 * This endpoint orchestrates the entire process from data collection through AI analysis
 * to user approval workflow.
 * 
 * Requirements: All
 * Task 49: Create trade generation endpoint
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { createEinsteinCoordinator } from '../../../lib/einstein/coordinator/engine';
import type { EinsteinConfig, TradeSignalResult } from '../../../lib/einstein/types';

/**
 * Request body interface
 */
interface GenerateSignalRequest {
  symbol: string;
  timeframe: '15m' | '1h' | '4h' | '1d';
  accountBalance?: number;
  riskTolerance?: number;
}

/**
 * Generate trade signal endpoint handler
 * 
 * This endpoint:
 * 1. Validates request parameters
 * 2. Creates Einstein Engine Coordinator with user config
 * 3. Calls generateTradeSignal() to orchestrate the entire process
 * 4. Returns trade signal and comprehensive analysis
 * 
 * Authentication: Required (JWT token in httpOnly cookie)
 * Method: POST
 * 
 * Request Body:
 * {
 *   symbol: string (e.g., "BTC", "ETH")
 *   timeframe: "15m" | "1h" | "4h" | "1d"
 *   accountBalance?: number (optional, defaults to 10000)
 *   riskTolerance?: number (optional, defaults to 2)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   signal?: TradeSignal
 *   analysis?: ComprehensiveAnalysis
 *   dataQuality: DataQualityScore
 *   approvalInfo?: { signalId: string, expiresAt: string }
 *   error?: string
 * }
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const startTime = Date.now();
  
  try {
    // ========================================================================
    // STEP 1: VALIDATE REQUEST
    // ========================================================================
    
    const { symbol, timeframe, accountBalance, riskTolerance } = req.body as GenerateSignalRequest;
    
    // Validate required parameters
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: symbol'
      });
    }
    
    if (!timeframe) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: timeframe'
      });
    }
    
    // Validate symbol format
    const validSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'LINK', 'MATIC', 'UNI', 'AVAX'];
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid symbol. Supported symbols: ${validSymbols.join(', ')}`
      });
    }
    
    // Validate timeframe
    const validTimeframes = ['15m', '1h', '4h', '1d'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        success: false,
        error: `Invalid timeframe. Supported timeframes: ${validTimeframes.join(', ')}`
      });
    }
    
    // Validate optional parameters
    const balance = accountBalance || 10000;
    const risk = riskTolerance || 2;
    
    if (balance <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Account balance must be greater than 0'
      });
    }
    
    if (risk < 0.5 || risk > 5) {
      return res.status(400).json({
        success: false,
        error: 'Risk tolerance must be between 0.5 and 5'
      });
    }
    
    console.log('\n========================================');
    console.log('EINSTEIN TRADE GENERATION REQUEST');
    console.log('========================================');
    console.log(`User: ${req.user!.email} (${req.user!.id})`);
    console.log(`Symbol: ${symbol.toUpperCase()}`);
    console.log(`Timeframe: ${timeframe}`);
    console.log(`Account Balance: $${balance.toLocaleString()}`);
    console.log(`Risk Tolerance: ${risk}%`);
    console.log('========================================\n');
    
    // ========================================================================
    // STEP 2: CREATE EINSTEIN COORDINATOR
    // ========================================================================
    
    const config: EinsteinConfig = {
      symbol: symbol.toUpperCase(),
      timeframe,
      accountBalance: balance,
      riskTolerance: risk,
      minDataQuality: 90,    // Requirement 2.3: Minimum 90% data quality
      minConfidence: 60,     // Requirement 4.5: Minimum 60% confidence
      minRiskReward: 2,      // Requirement 8.4: Minimum 2:1 risk-reward
      maxLoss: 2             // Requirement 8.5: Maximum 2% loss per trade
    };
    
    const coordinator = createEinsteinCoordinator(config);
    
    // ========================================================================
    // STEP 3: GENERATE TRADE SIGNAL
    // ========================================================================
    
    console.log('Calling EinsteinEngineCoordinator.generateTradeSignal()...\n');
    
    const result: TradeSignalResult = await coordinator.generateTradeSignal();
    
    const totalTime = Date.now() - startTime;
    
    // ========================================================================
    // STEP 4: RETURN RESPONSE
    // ========================================================================
    
    if (!result.success) {
      console.error('\n❌ Trade signal generation failed');
      console.error(`Error: ${result.error}`);
      console.error(`Total time: ${totalTime}ms\n`);
      
      return res.status(400).json({
        success: false,
        dataQuality: result.dataQuality,
        error: result.error || 'Trade signal generation failed'
      });
    }
    
    console.log('\n✅ Trade signal generation successful');
    console.log(`Total time: ${totalTime}ms`);
    console.log(`Signal ID: ${result.signal!.id}`);
    console.log(`Position: ${result.signal!.positionType}`);
    console.log(`Confidence: ${result.signal!.confidence.overall}%`);
    console.log(`Data Quality: ${result.dataQuality.overall}%\n`);
    
    // Return successful result with signal and analysis
    return res.status(200).json({
      success: true,
      signal: result.signal,
      analysis: result.analysis,
      dataQuality: result.dataQuality,
      approvalInfo: result.approvalInfo,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: req.user!.email,
        processingTime: totalTime,
        version: '1.0.0'
      }
    });
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    
    console.error('\n========================================');
    console.error('❌ ENDPOINT ERROR');
    console.error('========================================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`Total time: ${totalTime}ms\n`);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during trade signal generation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Export handler wrapped with authentication middleware
 * 
 * This ensures that only authenticated users can generate trade signals.
 * The withAuth middleware verifies the JWT token and attaches user data to the request.
 */
export default withAuth(handler);
