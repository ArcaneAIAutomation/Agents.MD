/**
 * Veritas Protocol - Validation Orchestrator Usage Examples
 * 
 * This file demonstrates how to use the validation orchestrator
 * in various scenarios.
 */

import {
  orchestrateValidation,
  isSufficientForAnalysis,
  getStatusMessage,
  type OrchestrationResult,
  type ValidationInput,
  type VeritasValidationState
} from '../utils/validationOrchestrator';

// ============================================================================
// Example 1: Basic Usage
// ============================================================================

async function basicUsageExample() {
  console.log('=== Example 1: Basic Usage ===\n');
  
  // Prepare input data
  const input: ValidationInput = {
    symbol: 'BTC',
    marketData: {
      price: 95000,
      volume24h: 45000000000,
      marketCap: 1850000000000
    },
    socialData: {
      lunarCrush: {
        mentions: 15000,
        sentimentScore: 65,
        galaxyScore: 72
      }
    },
    onChainData: {
      whaleActivity: {
        summary: {
          exchangeDeposits: 8,
          exchangeWithdrawals: 15,
          coldWalletMovements: 5
        }
      }
    }
  };
  
  // Run validation
  const result = await orchestrateValidation(input);
  
  // Check result
  if (result.success && result.completed) {
    console.log('✅ Validation completed successfully');
    console.log(`   Confidence: ${result.confidenceScore?.overallScore}%`);
    console.log(`   Data Quality: ${result.dataQualitySummary?.overallScore}/100`);
    console.log(`   Duration: ${result.duration}ms`);
  } else {
    console.error('❌ Validation failed');
    console.error(`   Reason: ${result.haltReason}`);
    console.error(`   Progress: ${result.progress}%`);
  }
  
  return result;
}

// ============================================================================
// Example 2: With Progress Callback
// ============================================================================

async function progressCallbackExample() {
  console.log('\n=== Example 2: With Progress Callback ===\n');
  
  // Define progress callback
  const onProgress = (state: VeritasValidationState) => {
    console.log(`📊 Progress: ${state.progress}%`);
    console.log(`   Current step: ${state.currentStep || 'complete'}`);
    console.log(`   Validating: ${state.isValidating}`);
    
    if (state.error) {
      console.error(`   Error: ${state.error}`);
    }
  };
  
  // Prepare input
  const input: ValidationInput = {
    symbol: 'ETH',
    marketData: { price: 3500, volume24h: 25000000000 }
  };
  
  // Run validation with progress updates
  const result = await orchestrateValidation(input, onProgress);
  
  console.log(`\n✅ Final result: ${getStatusMessage(result)}`);
  
  return result;
}

// ============================================================================
// Example 3: Checking if Result is Sufficient for Analysis
// ============================================================================

async function sufficientAnalysisExample() {
  console.log('\n=== Example 3: Checking if Result is Sufficient ===\n');
  
  const input: ValidationInput = {
    symbol: 'BTC',
    marketData: { price: 95000, volume24h: 45000000000 }
  };
  
  const result = await orchestrateValidation(input);
  
  // Check with default threshold (60%)
  if (isSufficientForAnalysis(result)) {
    console.log('✅ Data quality is sufficient for analysis (≥60% confidence)');
    console.log('   Proceeding with AI analysis...');
  } else {
    console.log('❌ Data quality is insufficient for analysis');
    console.log('   Displaying warning to user...');
  }
  
  // Check with high confidence threshold (80%)
  if (isSufficientForAnalysis(result, 80)) {
    console.log('✅ Data quality meets high confidence threshold (≥80%)');
  } else {
    console.log('⚠️ Data quality does not meet high confidence threshold');
  }
  
  return result;
}

// ============================================================================
// Example 4: Handling Partial Results (Timeout)
// ============================================================================

async function partialResultsExample() {
  console.log('\n=== Example 4: Handling Partial Results ===\n');
  
  const input: ValidationInput = {
    symbol: 'BTC',
    marketData: { price: 95000, volume24h: 45000000000 }
  };
  
  const result = await orchestrateValidation(input);
  
  if (result.timedOut) {
    console.log('⏱️ Validation timed out');
    console.log(`   Progress: ${result.progress}%`);
    console.log(`   Completed steps: ${result.completedSteps.join(', ')}`);
    console.log(`   Duration: ${result.duration}ms`);
    
    // Use partial results
    if (result.results.market) {
      console.log('   ✅ Market data validated');
    }
    if (result.results.social) {
      console.log('   ✅ Social data validated');
    }
    if (result.results.onChain) {
      console.log('   ✅ On-chain data validated');
    }
    
    console.log('\n   Using partial results for analysis...');
  }
  
  return result;
}

// ============================================================================
// Example 5: Handling Fatal Errors
// ============================================================================

async function fatalErrorExample() {
  console.log('\n=== Example 5: Handling Fatal Errors ===\n');
  
  // Input with data that will cause fatal error
  const input: ValidationInput = {
    symbol: 'BTC',
    socialData: {
      lunarCrush: {
        mentions: 0,  // Zero mentions
        sentimentScore: 65  // But non-zero sentiment (impossibility!)
      }
    }
  };
  
  const result = await orchestrateValidation(input);
  
  if (result.halted) {
    console.log('🛑 Validation halted due to fatal error');
    console.log(`   Reason: ${result.haltReason}`);
    console.log(`   Completed steps: ${result.completedSteps.join(', ')}`);
    
    // Check which validator caused the halt
    const fatalAlerts = Object.values(result.results)
      .flatMap(r => r?.alerts || [])
      .filter(a => a.severity === 'fatal');
    
    console.log(`\n   Fatal alerts (${fatalAlerts.length}):`);
    fatalAlerts.forEach(alert => {
      console.log(`   - ${alert.type}: ${alert.message}`);
      console.log(`     Recommendation: ${alert.recommendation}`);
    });
  }
  
  return result;
}

// ============================================================================
// Example 6: Accessing Detailed Results
// ============================================================================

async function detailedResultsExample() {
  console.log('\n=== Example 6: Accessing Detailed Results ===\n');
  
  const input: ValidationInput = {
    symbol: 'BTC',
    marketData: { price: 95000, volume24h: 45000000000 }
  };
  
  const result = await orchestrateValidation(input);
  
  if (result.confidenceScore) {
    console.log('📊 Confidence Score Breakdown:');
    console.log(`   Overall: ${result.confidenceScore.overallScore}%`);
    console.log(`   Data Source Agreement: ${result.confidenceScore.dataSourceAgreement}% (40% weight)`);
    console.log(`   Logical Consistency: ${result.confidenceScore.logicalConsistency}% (30% weight)`);
    console.log(`   Cross-Validation Success: ${result.confidenceScore.crossValidationSuccess}% (20% weight)`);
    console.log(`   Completeness: ${result.confidenceScore.completeness}% (10% weight)`);
  }
  
  if (result.dataQualitySummary) {
    console.log('\n📋 Data Quality Summary:');
    console.log(`   Overall Score: ${result.dataQualitySummary.overallScore}/100`);
    console.log(`   Market Data: ${result.dataQualitySummary.marketDataQuality}/100`);
    console.log(`   Social Data: ${result.dataQualitySummary.socialDataQuality}/100`);
    console.log(`   On-Chain Data: ${result.dataQualitySummary.onChainDataQuality}/100`);
    console.log(`   Total Alerts: ${result.dataQualitySummary.totalAlerts}`);
    console.log(`   Critical Alerts: ${result.dataQualitySummary.criticalAlerts}`);
    console.log(`   Total Discrepancies: ${result.dataQualitySummary.totalDiscrepancies}`);
    
    if (result.dataQualitySummary.recommendations.length > 0) {
      console.log(`\n   Recommendations (${result.dataQualitySummary.recommendations.length}):`);
      result.dataQualitySummary.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`      ${rec.description}`);
        console.log(`      Action: ${rec.action}`);
      });
    }
  }
  
  return result;
}

// ============================================================================
// Example 7: Integration with API Endpoint
// ============================================================================

async function apiEndpointExample() {
  console.log('\n=== Example 7: API Endpoint Integration ===\n');
  
  // Simulated API endpoint handler
  async function handleAnalysisRequest(symbol: string) {
    console.log(`📡 API Request: /api/ucie/analyze/${symbol}`);
    
    // Fetch data from various sources (simulated)
    console.log('   Fetching market data...');
    const marketData = { price: 95000, volume24h: 45000000000 };
    
    console.log('   Fetching social data...');
    const socialData = { lunarCrush: { mentions: 15000, sentimentScore: 65 } };
    
    console.log('   Fetching on-chain data...');
    const onChainData = { whaleActivity: { summary: { exchangeDeposits: 8 } } };
    
    // Run Veritas validation
    console.log('   Running Veritas validation...');
    const validationResult = await orchestrateValidation({
      symbol,
      marketData,
      socialData,
      onChainData
    });
    
    // Build API response
    const response = {
      symbol,
      timestamp: new Date().toISOString(),
      marketData,
      socialData,
      onChainData,
      veritasValidation: {
        success: validationResult.success,
        completed: validationResult.completed,
        confidenceScore: validationResult.confidenceScore?.overallScore,
        dataQuality: validationResult.dataQualitySummary?.overallScore,
        duration: validationResult.duration,
        alerts: validationResult.dataQualitySummary?.totalAlerts,
        recommendations: validationResult.dataQualitySummary?.recommendations.length
      }
    };
    
    console.log('   ✅ API Response prepared');
    console.log(`   Confidence: ${response.veritasValidation.confidenceScore}%`);
    
    return response;
  }
  
  // Simulate API request
  const response = await handleAnalysisRequest('BTC');
  
  return response;
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  try {
    await basicUsageExample();
    await progressCallbackExample();
    await sufficientAnalysisExample();
    await partialResultsExample();
    await fatalErrorExample();
    await detailedResultsExample();
    await apiEndpointExample();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

// Export examples
export {
  basicUsageExample,
  progressCallbackExample,
  sufficientAnalysisExample,
  partialResultsExample,
  fatalErrorExample,
  detailedResultsExample,
  apiEndpointExample,
  runAllExamples
};

// Run examples if executed directly
if (require.main === module) {
  runAllExamples();
}
