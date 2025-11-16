/**
 * Data Quality Summary - Usage Example
 * 
 * This example demonstrates how to use the data quality summary system
 * to generate comprehensive reports and recommendations.
 */

import { generateDataQualitySummary } from '../utils/dataQualitySummary';
import type { VeritasValidationResult } from '../types/validationTypes';

// ============================================================================
// Example: Complete Validation Workflow
// ============================================================================

async function exampleCompleteValidation(symbol: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 VERITAS PROTOCOL - Data Quality Analysis for ${symbol}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const startTime = Date.now();
  
  // Step 1: Run all validators (simulated with mock data)
  console.log('📊 Running validators...');
  
  const validationResults = {
    market: await simulateMarketValidation(symbol),
    social: await simulateSocialValidation(symbol),
    onChain: await simulateOnChainValidation(symbol)
  };
  
  const validationDuration = Date.now() - startTime;
  console.log(`✅ Validation complete in ${validationDuration}ms\n`);
  
  // Step 2: Generate data quality summary
  console.log('📋 Generating data quality summary...');
  const summary = generateDataQualitySummary(validationResults, validationDuration);
  console.log('✅ Summary generated\n');
  
  // Step 3: Display overall quality
  console.log(`${'─'.repeat(80)}`);
  console.log('📊 OVERALL DATA QUALITY');
  console.log(`${'─'.repeat(80)}`);
  console.log(`Score: ${summary.overallScore}/100`);
  console.log(`Reliability: ${summary.reliabilityGuidance.overallReliability.toUpperCase()}`);
  console.log(`Confidence: ${summary.reliabilityGuidance.confidenceLevel.toUpperCase()}`);
  console.log(`Can Proceed: ${summary.reliabilityGuidance.canProceedWithAnalysis ? '✅ YES' : '❌ NO'}`);
  console.log(`Validation Duration: ${summary.validationDuration}ms\n`);
  
  // Step 4: Display quality breakdown
  console.log(`${'─'.repeat(80)}`);
  console.log('📈 QUALITY BREAKDOWN BY DATA TYPE');
  console.log(`${'─'.repeat(80)}`);
  console.log(`Market Data:  ${summary.marketDataQuality}/100`);
  console.log(`Social Data:  ${summary.socialDataQuality}/100`);
  console.log(`On-Chain:     ${summary.onChainDataQuality}/100`);
  console.log(`News Data:    ${summary.newsDataQuality}/100\n`);
  
  // Step 5: Display alerts
  if (summary.totalAlerts > 0) {
    console.log(`${'─'.repeat(80)}`);
    console.log(`🚨 ALERTS (${summary.totalAlerts} total, ${summary.criticalAlerts} critical)`);
    console.log(`${'─'.repeat(80)}`);
    
    // Display by severity
    if (summary.alertsBySeverity.fatal.length > 0) {
      console.log('\n🔴 FATAL ERRORS:');
      summary.alertsBySeverity.fatal.forEach(alert => {
        console.log(`   - ${alert.message}`);
        console.log(`     Sources: ${alert.affectedSources.join(', ')}`);
        console.log(`     Action: ${alert.recommendation}`);
      });
    }
    
    if (summary.alertsBySeverity.error.length > 0) {
      console.log('\n🟠 ERRORS:');
      summary.alertsBySeverity.error.forEach(alert => {
        console.log(`   - ${alert.message}`);
      });
    }
    
    if (summary.alertsBySeverity.warning.length > 0) {
      console.log('\n🟡 WARNINGS:');
      summary.alertsBySeverity.warning.forEach(alert => {
        console.log(`   - ${alert.message}`);
      });
    }
    
    console.log();
  }
  
  // Step 6: Display discrepancies
  if (summary.totalDiscrepancies > 0) {
    console.log(`${'─'.repeat(80)}`);
    console.log(`⚠️  DISCREPANCIES (${summary.totalDiscrepancies} total, ${summary.exceededThresholds} exceeded)`);
    console.log(`${'─'.repeat(80)}`);
    
    Object.entries(summary.discrepanciesByMetric).forEach(([metric, discrepancies]) => {
      console.log(`\n${metric.toUpperCase()}:`);
      discrepancies.forEach(d => {
        console.log(`   Variance: ${(d.variance * 100).toFixed(2)}% (threshold: ${(d.threshold * 100).toFixed(2)}%)`);
        console.log(`   Sources:`);
        d.sources.forEach(s => {
          console.log(`     - ${s.name}: ${typeof s.value === 'number' ? s.value.toLocaleString() : s.value}`);
        });
      });
    });
    
    console.log();
  }
  
  // Step 7: Display recommendations
  if (summary.recommendations.length > 0) {
    console.log(`${'─'.repeat(80)}`);
    console.log(`💡 RECOMMENDATIONS (${summary.recommendations.length} total)`);
    console.log(`${'─'.repeat(80)}\n`);
    
    summary.recommendations.forEach((rec, index) => {
      const emoji = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`${index + 1}. ${emoji} [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`   Category: ${rec.category}`);
      console.log(`   ${rec.description}`);
      console.log(`   Action: ${rec.action}`);
      if (rec.affectedSources && rec.affectedSources.length > 0) {
        console.log(`   Affected Sources: ${rec.affectedSources.join(', ')}`);
      }
      console.log();
    });
  }
  
  // Step 8: Display reliability guidance
  console.log(`${'─'.repeat(80)}`);
  console.log('🎯 RELIABILITY GUIDANCE');
  console.log(`${'─'.repeat(80)}\n`);
  
  if (summary.reliabilityGuidance.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    summary.reliabilityGuidance.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
    console.log();
  }
  
  if (summary.reliabilityGuidance.strengths.length > 0) {
    console.log('✅ STRENGTHS:');
    summary.reliabilityGuidance.strengths.forEach(strength => {
      console.log(`   - ${strength}`);
    });
    console.log();
  }
  
  if (summary.reliabilityGuidance.weaknesses.length > 0) {
    console.log('⚠️  WEAKNESSES:');
    summary.reliabilityGuidance.weaknesses.forEach(weakness => {
      console.log(`   - ${weakness}`);
    });
    console.log();
  }
  
  // Step 9: Display validation checks
  console.log(`${'─'.repeat(80)}`);
  console.log('✓ VALIDATION CHECKS');
  console.log(`${'─'.repeat(80)}\n`);
  
  if (summary.passedChecks.length > 0) {
    console.log('✅ PASSED:');
    summary.passedChecks.forEach(check => {
      console.log(`   - ${check}`);
    });
    console.log();
  }
  
  if (summary.failedChecks.length > 0) {
    console.log('❌ FAILED:');
    summary.failedChecks.forEach(check => {
      console.log(`   - ${check}`);
    });
    console.log();
  }
  
  // Step 10: Final decision
  console.log(`${'='.repeat(80)}`);
  if (summary.reliabilityGuidance.canProceedWithAnalysis) {
    console.log('✅ ANALYSIS CAN PROCEED');
    console.log(`   Confidence Level: ${summary.reliabilityGuidance.confidenceLevel.toUpperCase()}`);
    console.log(`   Overall Reliability: ${summary.reliabilityGuidance.overallReliability.toUpperCase()}`);
  } else {
    console.log('❌ CANNOT PROCEED WITH ANALYSIS');
    console.log('   Data quality is insufficient for reliable analysis.');
    console.log('   Please address the issues above before proceeding.');
  }
  console.log(`${'='.repeat(80)}\n`);
  
  return summary;
}

// ============================================================================
// Mock Validation Functions (for demonstration)
// ============================================================================

async function simulateMarketValidation(symbol: string): Promise<VeritasValidationResult> {
  // Simulate market validation with good quality
  return {
    isValid: true,
    confidence: 92,
    alerts: [
      {
        severity: 'info',
        type: 'market',
        message: 'All market data sources agree within acceptable threshold',
        affectedSources: ['CoinGecko', 'CoinMarketCap', 'Kraken'],
        recommendation: 'No action required'
      }
    ],
    discrepancies: [],
    dataQualitySummary: {
      overallScore: 92,
      marketDataQuality: 92,
      socialDataQuality: 0,
      onChainDataQuality: 0,
      newsDataQuality: 0,
      passedChecks: ['price_consistency', 'volume_consistency'],
      failedChecks: []
    }
  };
}

async function simulateSocialValidation(symbol: string): Promise<VeritasValidationResult> {
  // Simulate social validation with warning
  return {
    isValid: true,
    confidence: 78,
    alerts: [
      {
        severity: 'warning',
        type: 'social',
        message: 'Social Sentiment Mismatch: LunarCrush (68) vs Reddit (52)',
        affectedSources: ['LunarCrush', 'Reddit'],
        recommendation: 'Review both sources - moderate divergence detected'
      }
    ],
    discrepancies: [
      {
        metric: 'sentiment_score',
        sources: [
          { name: 'LunarCrush', value: 68 },
          { name: 'Reddit', value: 52 }
        ],
        variance: 16,
        threshold: 30,
        exceeded: false
      }
    ],
    dataQualitySummary: {
      overallScore: 78,
      marketDataQuality: 0,
      socialDataQuality: 78,
      onChainDataQuality: 0,
      newsDataQuality: 0,
      passedChecks: ['social_impossibility_check', 'sentiment_consistency'],
      failedChecks: []
    }
  };
}

async function simulateOnChainValidation(symbol: string): Promise<VeritasValidationResult> {
  // Simulate on-chain validation with good quality
  return {
    isValid: true,
    confidence: 85,
    alerts: [],
    discrepancies: [],
    dataQualitySummary: {
      overallScore: 85,
      marketDataQuality: 0,
      socialDataQuality: 0,
      onChainDataQuality: 85,
      newsDataQuality: 0,
      passedChecks: ['market_to_chain_consistency'],
      failedChecks: []
    }
  };
}

// ============================================================================
// Run Example
// ============================================================================

if (require.main === module) {
  exampleCompleteValidation('BTC')
    .then(() => {
      console.log('✅ Example completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Example failed:', error);
      process.exit(1);
    });
}

export { exampleCompleteValidation };
