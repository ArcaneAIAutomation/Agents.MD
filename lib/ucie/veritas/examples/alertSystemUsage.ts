/**
 * Veritas Alert System - Usage Examples
 * 
 * This file demonstrates how to use the alert system in validators
 */

import {
  veritasAlertSystem,
  notifyFatalError,
  notifyCriticalWarning,
  notifyWarning,
  notifyInfo,
  AlertNotification
} from '../utils/alertSystem';

/**
 * Example 1: Fatal Error in Social Sentiment Validator
 * 
 * Detects logical impossibility: zero mentions but non-zero sentiment
 */
export async function exampleFatalError() {
  const symbol = 'BTC';
  const lunarCrushData = {
    mention_count: 0,
    sentiment_distribution: { positive: 50, negative: 30, neutral: 20 }
  };
  
  // Check for impossibility
  if (lunarCrushData.mention_count === 0 && 
      (lunarCrushData.sentiment_distribution.positive > 0 || 
       lunarCrushData.sentiment_distribution.negative > 0)) {
    
    // Send fatal error alert
    await notifyFatalError(
      symbol,
      'social_impossibility',
      'Fatal Social Data Error: Contradictory mention count and distribution',
      {
        affectedSources: ['LunarCrush'],
        recommendation: 'Discarding social data - cannot have sentiment without mentions',
        additionalContext: {
          mentionCount: lunarCrushData.mention_count,
          sentimentDistribution: lunarCrushData.sentiment_distribution
        }
      }
    );
    
    // Return invalid validation result
    return {
      isValid: false,
      confidence: 0,
      alerts: [{
        severity: 'fatal' as const,
        type: 'social' as const,
        message: 'Fatal Social Data Error',
        affectedSources: ['LunarCrush'],
        recommendation: 'Discarding social data'
      }]
    };
  }
}

/**
 * Example 2: Market Data Discrepancy
 * 
 * Detects price variance exceeding threshold
 */
export async function exampleMarketDiscrepancy() {
  const symbol = 'BTC';
  const prices = [
    { name: 'CoinGecko', value: 95000 },
    { name: 'CoinMarketCap', value: 97500 },
    { name: 'Kraken', value: 96000 }
  ];
  
  // Calculate variance
  const avgPrice = prices.reduce((sum, p) => sum + p.value, 0) / prices.length;
  const variance = Math.max(...prices.map(p => Math.abs(p.value - avgPrice) / avgPrice));
  const variancePercent = variance * 100;
  
  // Check if exceeds threshold
  if (variancePercent > 1.5) {
    // Send critical warning
    await notifyCriticalWarning(
      symbol,
      'market_discrepancy',
      `Price discrepancy detected: ${variancePercent.toFixed(2)}% variance across sources`,
      {
        affectedSources: prices.map(p => p.name),
        discrepancyValue: variancePercent,
        threshold: 1.5,
        recommendation: 'Using Kraken as tie-breaker for final price',
        additionalContext: {
          prices: prices,
          averagePrice: avgPrice
        }
      }
    );
  }
}

/**
 * Example 3: On-Chain Consistency Warning
 * 
 * Detects low market-to-chain consistency
 */
export async function exampleOnChainWarning() {
  const symbol = 'BTC';
  const volume24h = 25_000_000_000; // $25B
  const exchangeFlows = {
    deposits: 500_000_000,
    withdrawals: 300_000_000
  };
  
  const totalFlows = exchangeFlows.deposits + exchangeFlows.withdrawals;
  const expectedFlowRatio = volume24h / 1_000_000_000;
  const actualFlowRatio = totalFlows / 1_000_000_000;
  const consistencyScore = Math.min(100, (actualFlowRatio / expectedFlowRatio) * 100);
  
  // Check if consistency is low
  if (consistencyScore < 50) {
    // Send warning
    await notifyWarning(
      symbol,
      'onchain_inconsistency',
      `Low market-to-chain consistency: ${consistencyScore.toFixed(0)}%`,
      {
        affectedSources: ['Market Data', 'On-Chain Data'],
        recommendation: 'On-chain data may be incomplete - use caution with accumulation signals',
        additionalContext: {
          volume24h,
          exchangeFlows,
          consistencyScore
        }
      }
    );
  }
}

/**
 * Example 4: API Timeout Info
 * 
 * Logs informational alert for slow validation
 */
export async function exampleApiTimeout() {
  const symbol = 'ETH';
  const validationTime = 6500; // 6.5 seconds
  
  // Check if validation took too long
  if (validationTime > 5000) {
    // Send info alert
    await notifyInfo(
      symbol,
      'validation_timeout',
      `Validation took longer than expected: ${validationTime}ms`,
      {
        affectedSources: ['Validation System'],
        recommendation: 'Monitor validation performance and consider optimization',
        additionalContext: {
          validationTime,
          threshold: 5000
        }
      }
    );
  }
}

/**
 * Example 5: Custom Alert with Full Control
 * 
 * Demonstrates using the alert system directly
 */
export async function exampleCustomAlert() {
  const alert: AlertNotification = {
    severity: 'error',
    symbol: 'SOL',
    alertType: 'api_failure',
    message: 'Multiple API sources failed during validation',
    details: {
      affectedSources: ['CoinGecko', 'CoinMarketCap'],
      recommendation: 'Check API status and retry validation',
      additionalContext: {
        failedApis: ['CoinGecko', 'CoinMarketCap'],
        successfulApis: ['Kraken'],
        errorMessages: {
          CoinGecko: 'Rate limit exceeded',
          CoinMarketCap: 'Connection timeout'
        }
      }
    },
    timestamp: new Date().toISOString(),
    requiresHumanReview: true
  };
  
  await veritasAlertSystem.queueAlert(alert);
}

/**
 * Example 6: Batch Alert Processing
 * 
 * Process multiple alerts efficiently
 */
export async function exampleBatchAlerts() {
  const symbols = ['BTC', 'ETH', 'SOL'];
  
  for (const symbol of symbols) {
    // Simulate validation issue
    await notifyWarning(
      symbol,
      'api_failure',
      `API timeout during ${symbol} validation`,
      {
        affectedSources: ['External API'],
        recommendation: 'Retry validation or use cached data'
      }
    );
  }
}

/**
 * Example 7: Admin Dashboard Operations
 * 
 * Demonstrates admin operations
 */
export async function exampleAdminOperations() {
  // Get pending alerts
  const pendingAlerts = await veritasAlertSystem.getPendingAlerts(10);
  console.log(`Found ${pendingAlerts.length} pending alerts`);
  
  // Get all alerts
  const allAlerts = await veritasAlertSystem.getAllAlerts(50);
  console.log(`Total alerts: ${allAlerts.length}`);
  
  // Get statistics
  const stats = await veritasAlertSystem.getAlertStatistics();
  console.log('Alert Statistics:', {
    total: stats.total,
    pending: stats.pending,
    reviewed: stats.reviewed,
    bySeverity: stats.bySeverity,
    byType: stats.byType
  });
  
  // Mark alert as reviewed (if any pending)
  if (pendingAlerts.length > 0) {
    const firstAlert = pendingAlerts[0];
    await veritasAlertSystem.markAsReviewed(
      firstAlert.id,
      'admin@arcane.group',
      'Reviewed and acknowledged. Issue has been resolved.'
    );
    console.log(`Alert ${firstAlert.id} marked as reviewed`);
  }
}

/**
 * Example 8: Integration in Validator
 * 
 * Complete example of using alerts in a validator
 */
export async function exampleValidatorIntegration(symbol: string, data: any) {
  try {
    // Perform validation
    const validationResult = await performValidation(symbol, data);
    
    // Check for fatal errors
    if (!validationResult.isValid) {
      await notifyFatalError(
        symbol,
        'fatal_error',
        validationResult.errorMessage,
        {
          affectedSources: validationResult.affectedSources,
          recommendation: validationResult.recommendation
        }
      );
    }
    
    // Check for warnings
    if (validationResult.warnings.length > 0) {
      for (const warning of validationResult.warnings) {
        await notifyWarning(
          symbol,
          'market_discrepancy',
          warning.message,
          {
            affectedSources: warning.sources,
            recommendation: warning.recommendation
          }
        );
      }
    }
    
    return validationResult;
    
  } catch (error) {
    // Handle validation errors
    await notifyFatalError(
      symbol,
      'fatal_error',
      `Validation failed: ${error.message}`,
      {
        affectedSources: ['Validation System'],
        recommendation: 'Check validation logic and retry'
      }
    );
    
    throw error;
  }
}

// Mock validation function for example
async function performValidation(symbol: string, data: any) {
  return {
    isValid: true,
    errorMessage: '',
    affectedSources: [],
    recommendation: '',
    warnings: []
  };
}

/**
 * Example 9: Testing Alert System
 * 
 * Test alert delivery and database persistence
 */
export async function testAlertSystem() {
  console.log('Testing Veritas Alert System...\n');
  
  // Test 1: Info alert
  console.log('Test 1: Sending info alert...');
  await notifyInfo(
    'TEST',
    'api_failure',
    'Test info alert - please ignore',
    {
      affectedSources: ['Test Source'],
      recommendation: 'This is a test'
    }
  );
  console.log('✓ Info alert sent\n');
  
  // Test 2: Warning alert
  console.log('Test 2: Sending warning alert...');
  await notifyWarning(
    'TEST',
    'market_discrepancy',
    'Test warning alert - please ignore',
    {
      affectedSources: ['Test Source 1', 'Test Source 2'],
      discrepancyValue: 2.5,
      threshold: 1.5,
      recommendation: 'This is a test'
    }
  );
  console.log('✓ Warning alert sent\n');
  
  // Test 3: Get pending alerts
  console.log('Test 3: Retrieving pending alerts...');
  const pending = await veritasAlertSystem.getPendingAlerts(5);
  console.log(`✓ Found ${pending.length} pending alerts\n`);
  
  // Test 4: Get statistics
  console.log('Test 4: Getting alert statistics...');
  const stats = await veritasAlertSystem.getAlertStatistics();
  console.log('✓ Statistics:', stats, '\n');
  
  console.log('Alert system test complete!');
}
