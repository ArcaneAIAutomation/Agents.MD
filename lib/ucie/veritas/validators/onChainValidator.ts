/**
 * On-Chain Data Validator
 * 
 * Validates on-chain data against market activity to detect inconsistencies
 * and logical impossibilities. Implements market-to-chain consistency checks.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 12.4
 */

import type {
  VeritasValidationResult,
  ValidationAlert,
  Discrepancy,
  DataQualitySummary
} from '../types/validationTypes';
import { veritasAlertSystem } from '../utils/alertSystem';

/**
 * Transaction flow analysis result
 */
interface TransactionFlowAnalysis {
  deposits: number;           // Exchange deposits (selling pressure)
  withdrawals: number;        // Exchange withdrawals (accumulation)
  p2pTransfers: number;       // Peer-to-peer transfers
  totalFlows: number;         // Total exchange flows
  netFlow: number;            // Net flow (withdrawals - deposits)
  flowSentiment: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Market-to-chain consistency analysis
 */
interface MarketToChainConsistency {
  volume24h: number;
  exchangeFlows: number;
  expectedFlowRatio: number;
  actualFlowRatio: number;
  consistencyScore: number;   // 0-100
  isConsistent: boolean;
}

/**
 * Validate on-chain data against market activity
 * 
 * @param symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param marketData - Market data including 24h volume
 * @param existingOnChainData - On-chain data from blockchain APIs
 * @returns Validation result with alerts and quality metrics
 */
export async function validateOnChainData(
  symbol: string,
  marketData: any,
  existingOnChainData: any
): Promise<VeritasValidationResult> {
  const alerts: ValidationAlert[] = [];
  const discrepancies: Discrepancy[] = [];
  
  console.log(`[Veritas] Validating on-chain data for ${symbol}...`);
  
  try {
    // Extract market volume
    const volume24h = extractVolume24h(marketData);
    
    if (!volume24h || volume24h === 0) {
      console.warn('[Veritas] No market volume data available for validation');
      return createPartialValidationResult(
        'warning',
        'Market volume data unavailable - cannot validate on-chain consistency',
        50
      );
    }
    
    // Analyze transaction flows
    const flowAnalysis = analyzeTransactionFlows(existingOnChainData);
    
    // IMPOSSIBILITY CHECK: High volume but zero exchange flows
    if (volume24h > 20_000_000_000 && flowAnalysis.totalFlows === 0) {
      console.error('[Veritas] FATAL: High volume with zero exchange flows detected');
      
      const fatalAlert: ValidationAlert = {
        severity: 'fatal',
        type: 'onchain',
        message: 'Fatal On-Chain Data Error: Market volume disconnected from on-chain flows',
        affectedSources: ['Blockchain.com', 'Etherscan', 'Market Data'],
        recommendation: 'On-chain flow data is unreliable or incomplete - cannot analyze accumulation/distribution'
      };
      
      alerts.push(fatalAlert);
      
      // Send email alert for fatal error
      await veritasAlertSystem.queueAlert({
        severity: 'fatal',
        symbol,
        alertType: 'fatal_error',
        message: fatalAlert.message,
        details: {
          affectedSources: fatalAlert.affectedSources,
          discrepancyValue: volume24h,
          threshold: 20_000_000_000,
          recommendation: fatalAlert.recommendation
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: true
      });
      
      return {
        isValid: false,
        confidence: 0,
        alerts,
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 0,
          marketDataQuality: 0,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks: ['market_to_chain_consistency', 'impossibility_check']
        }
      };
    }
    
    // Calculate market-to-chain consistency
    const consistency = calculateMarketToChainConsistency(
      volume24h,
      flowAnalysis
    );
    
    // Check consistency score
    if (consistency.consistencyScore < 50) {
      const warningAlert: ValidationAlert = {
        severity: 'warning',
        type: 'onchain',
        message: `Low market-to-chain consistency: ${consistency.consistencyScore.toFixed(0)}%`,
        affectedSources: ['Market Data', 'On-Chain Data'],
        recommendation: 'On-chain data may be incomplete - use caution with accumulation signals'
      };
      
      alerts.push(warningAlert);
      
      discrepancies.push({
        metric: 'market_to_chain_consistency',
        sources: [
          { name: 'Market Volume (24h)', value: `$${(volume24h / 1_000_000_000).toFixed(2)}B` },
          { name: 'Exchange Flows', value: `$${(flowAnalysis.totalFlows / 1_000_000_000).toFixed(2)}B` }
        ],
        variance: Math.abs(consistency.expectedFlowRatio - consistency.actualFlowRatio),
        threshold: 0.5,
        exceeded: true
      });
      
      // Queue alert for low consistency
      await veritasAlertSystem.queueAlert({
        severity: 'warning',
        symbol,
        alertType: 'onchain_inconsistency',
        message: warningAlert.message,
        details: {
          affectedSources: warningAlert.affectedSources,
          discrepancyValue: consistency.consistencyScore,
          threshold: 50,
          recommendation: warningAlert.recommendation
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: false
      });
    }
    
    // Add informational alert about flow sentiment
    if (flowAnalysis.netFlow !== 0) {
      alerts.push({
        severity: 'info',
        type: 'onchain',
        message: `Exchange flow sentiment: ${flowAnalysis.flowSentiment.toUpperCase()} (net flow: ${flowAnalysis.netFlow > 0 ? '+' : ''}${flowAnalysis.netFlow})`,
        affectedSources: ['On-Chain Data'],
        recommendation: flowAnalysis.flowSentiment === 'bullish' 
          ? 'Net withdrawals suggest accumulation - potential bullish signal'
          : flowAnalysis.flowSentiment === 'bearish'
          ? 'Net deposits suggest distribution - potential bearish signal'
          : 'Balanced flows - neutral market sentiment'
      });
    }
    
    // Calculate data quality
    const dataQuality: DataQualitySummary = {
      overallScore: consistency.consistencyScore,
      marketDataQuality: 0,
      socialDataQuality: 0,
      onChainDataQuality: consistency.consistencyScore,
      newsDataQuality: 0,
      passedChecks: consistency.isConsistent ? ['market_to_chain_consistency'] : [],
      failedChecks: consistency.isConsistent ? [] : ['market_to_chain_consistency']
    };
    
    console.log(`[Veritas] On-chain validation complete: ${consistency.consistencyScore.toFixed(0)}% consistency`);
    
    return {
      isValid: alerts.filter(a => a.severity === 'fatal').length === 0,
      confidence: consistency.consistencyScore,
      alerts,
      discrepancies,
      dataQualitySummary: dataQuality
    };
    
  } catch (error) {
    console.error('[Veritas] On-chain validation error:', error);
    
    // Return error result
    return {
      isValid: false,
      confidence: 0,
      alerts: [{
        severity: 'error',
        type: 'onchain',
        message: `On-chain validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        affectedSources: ['Veritas Validator'],
        recommendation: 'Validation temporarily unavailable - using unvalidated on-chain data'
      }],
      discrepancies: [],
      dataQualitySummary: {
        overallScore: 0,
        marketDataQuality: 0,
        socialDataQuality: 0,
        onChainDataQuality: 0,
        newsDataQuality: 0,
        passedChecks: [],
        failedChecks: ['validation_error']
      }
    };
  }
}

/**
 * Extract 24h volume from market data
 */
function extractVolume24h(marketData: any): number {
  if (!marketData) return 0;
  
  // Try different possible field names
  return marketData.volume24h 
    || marketData.volume_24h 
    || marketData.total_volume 
    || marketData.totalVolume 
    || 0;
}

/**
 * Analyze transaction flows from on-chain data
 * Categorizes transactions as deposits, withdrawals, or P2P transfers
 */
function analyzeTransactionFlows(onChainData: any): TransactionFlowAnalysis {
  if (!onChainData || !onChainData.whaleActivity) {
    return {
      deposits: 0,
      withdrawals: 0,
      p2pTransfers: 0,
      totalFlows: 0,
      netFlow: 0,
      flowSentiment: 'neutral'
    };
  }
  
  const summary = onChainData.whaleActivity.summary;
  
  // Extract flow data
  const deposits = summary?.exchangeDeposits || 0;
  const withdrawals = summary?.exchangeWithdrawals || 0;
  const p2pTransfers = summary?.coldWalletMovements || 0;
  
  // Calculate totals
  const totalFlows = deposits + withdrawals;
  const netFlow = withdrawals - deposits;
  
  // Determine flow sentiment
  let flowSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (netFlow > 5) {
    flowSentiment = 'bullish'; // More withdrawals = accumulation
  } else if (netFlow < -5) {
    flowSentiment = 'bearish'; // More deposits = selling pressure
  }
  
  return {
    deposits,
    withdrawals,
    p2pTransfers,
    totalFlows,
    netFlow,
    flowSentiment
  };
}

/**
 * Calculate market-to-chain consistency score
 * 
 * Compares 24h market volume to exchange flows to detect inconsistencies.
 * High volume with low flows suggests incomplete on-chain data.
 */
function calculateMarketToChainConsistency(
  volume24h: number,
  flowAnalysis: TransactionFlowAnalysis
): MarketToChainConsistency {
  // Calculate expected flow ratio based on volume
  // Typically, exchange flows represent 10-30% of total volume
  const expectedFlowRatio = volume24h / 1_000_000_000; // Expected flow per $1B volume
  
  // Calculate actual flow ratio
  const actualFlowRatio = flowAnalysis.totalFlows / 1_000_000_000;
  
  // Calculate consistency score (0-100)
  // Perfect consistency = actual matches expected
  // Low consistency = actual is much lower than expected
  let consistencyScore: number;
  
  if (expectedFlowRatio === 0) {
    // No volume data - cannot calculate consistency
    consistencyScore = 50; // Neutral score
  } else {
    // Calculate ratio of actual to expected
    const ratio = actualFlowRatio / expectedFlowRatio;
    
    // Score based on how close actual is to expected
    // We expect flows to be 10-30% of volume
    // So ratio should be around 0.1-0.3
    if (ratio >= 0.1 && ratio <= 0.3) {
      // Perfect range
      consistencyScore = 100;
    } else if (ratio >= 0.05 && ratio < 0.1) {
      // Slightly low but acceptable
      consistencyScore = 80;
    } else if (ratio >= 0.3 && ratio <= 0.5) {
      // Slightly high but acceptable
      consistencyScore = 80;
    } else if (ratio < 0.05) {
      // Very low flows - suspicious
      consistencyScore = Math.max(0, ratio * 1000); // Scale up small ratios
    } else {
      // Very high flows - unusual but not necessarily bad
      consistencyScore = Math.min(100, 100 - (ratio - 0.5) * 50);
    }
  }
  
  // Ensure score is within bounds
  consistencyScore = Math.max(0, Math.min(100, consistencyScore));
  
  return {
    volume24h,
    exchangeFlows: flowAnalysis.totalFlows,
    expectedFlowRatio,
    actualFlowRatio,
    consistencyScore,
    isConsistent: consistencyScore >= 50
  };
}

/**
 * Create a partial validation result for cases where full validation cannot be performed
 */
function createPartialValidationResult(
  severity: 'info' | 'warning' | 'error',
  message: string,
  score: number
): VeritasValidationResult {
  return {
    isValid: severity !== 'error',
    confidence: score,
    alerts: [{
      severity,
      type: 'onchain',
      message,
      affectedSources: ['On-Chain Validator'],
      recommendation: 'Partial validation only - some checks could not be performed'
    }],
    discrepancies: [],
    dataQualitySummary: {
      overallScore: score,
      marketDataQuality: 0,
      socialDataQuality: 0,
      onChainDataQuality: score,
      newsDataQuality: 0,
      passedChecks: [],
      failedChecks: []
    }
  };
}
