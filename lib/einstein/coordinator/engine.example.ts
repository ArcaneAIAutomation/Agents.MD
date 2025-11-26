/**
 * Einstein Engine Coordinator - Usage Example
 * 
 * This file demonstrates how to use the Einstein Engine Coordinator
 * to generate trade signals with comprehensive AI analysis.
 */

import { createEinsteinCoordinator } from './engine';
import type { EinsteinConfig } from '../types';

/**
 * Example 1: Generate a Bitcoin trade signal with default settings
 */
async function example1_BasicBitcoinSignal() {
  console.log('=== Example 1: Basic Bitcoin Trade Signal ===\n');
  
  // Configure Einstein engine
  const config: EinsteinConfig = {
    symbol: 'BTC',
    timeframe: '1h',
    accountBalance: 10000, // $10,000 account
    riskTolerance: 2, // 2% risk per trade
    minDataQuality: 90, // Minimum 90% data quality
    minConfidence: 60, // Minimum 60% confidence
    minRiskReward: 2, // Minimum 2:1 risk-reward
    maxLoss: 2 // Maximum 2% loss per trade
  };
  
  // Create coordinator
  const coordinator = createEinsteinCoordinator(config);
  
  // Generate trade signal
  const result = await coordinator.generateTradeSignal();
  
  // Check result
  if (result.success && result.signal) {
    console.log('\n✅ Trade signal generated successfully!\n');
    console.log('Signal Details:');
    console.log(`  ID: ${result.signal.id}`);
    console.log(`  Symbol: ${result.signal.symbol}`);
    console.log(`  Position: ${result.signal.positionType}`);
    console.log(`  Entry: $${result.signal.entry.toLocaleString()}`);
    console.log(`  Stop Loss: $${result.signal.stopLoss.toLocaleString()}`);
    console.log(`  TP1: $${result.signal.takeProfits.tp1.price.toLocaleString()} (${result.signal.takeProfits.tp1.allocation}%)`);
    console.log(`  TP2: $${result.signal.takeProfits.tp2.price.toLocaleString()} (${result.signal.takeProfits.tp2.allocation}%)`);
    console.log(`  TP3: $${result.signal.takeProfits.tp3.price.toLocaleString()} (${result.signal.takeProfits.tp3.allocation}%)`);
    console.log(`  Confidence: ${result.signal.confidence.overall}%`);
    console.log(`  Risk-Reward: ${result.signal.riskReward.toFixed(2)}:1`);
    console.log(`  Position Size: $${result.signal.positionSize.toLocaleString()}`);
    console.log(`  Max Loss: $${result.signal.maxLoss.toLocaleString()}`);
    console.log(`  Data Quality: ${result.dataQuality.overall}%`);
    
    console.log('\nReasoning:');
    console.log(`  Technical: ${result.signal.analysis.reasoning.technical.substring(0, 200)}...`);
    console.log(`  Sentiment: ${result.signal.analysis.reasoning.sentiment.substring(0, 200)}...`);
    console.log(`  On-Chain: ${result.signal.analysis.reasoning.onChain.substring(0, 200)}...`);
    console.log(`  Risk: ${result.signal.analysis.reasoning.risk.substring(0, 200)}...`);
    console.log(`  Overall: ${result.signal.analysis.reasoning.overall.substring(0, 200)}...`);
  } else {
    console.log('\n❌ Trade signal generation failed');
    console.log(`Error: ${result.error}`);
    console.log(`Data Quality: ${result.dataQuality.overall}%`);
  }
}

/**
 * Example 2: Generate an Ethereum trade signal with custom settings
 */
async function example2_CustomEthereumSignal() {
  console.log('\n=== Example 2: Custom Ethereum Trade Signal ===\n');
  
  // Configure Einstein engine with custom settings
  const config: EinsteinConfig = {
    symbol: 'ETH',
    timeframe: '4h', // 4-hour timeframe
    accountBalance: 50000, // $50,000 account
    riskTolerance: 1.5, // 1.5% risk per trade (more conservative)
    minDataQuality: 95, // Higher quality requirement
    minConfidence: 70, // Higher confidence requirement
    minRiskReward: 3, // Higher risk-reward requirement (3:1)
    maxLoss: 1.5 // Lower max loss (1.5%)
  };
  
  // Create coordinator
  const coordinator = createEinsteinCoordinator(config);
  
  // Generate trade signal
  const result = await coordinator.generateTradeSignal();
  
  // Check result
  if (result.success && result.signal) {
    console.log('\n✅ Trade signal generated successfully!\n');
    console.log('Signal Summary:');
    console.log(`  ${result.signal.symbol} ${result.signal.positionType}`);
    console.log(`  Entry: $${result.signal.entry.toLocaleString()}`);
    console.log(`  Confidence: ${result.signal.confidence.overall}%`);
    console.log(`  Risk-Reward: ${result.signal.riskReward.toFixed(2)}:1`);
    console.log(`  Data Quality: ${result.dataQuality.overall}%`);
  } else {
    console.log('\n⚠️  No trade signal generated');
    console.log(`Reason: ${result.error}`);
  }
}

/**
 * Example 3: Handle NO_TRADE scenarios
 */
async function example3_NoTradeScenario() {
  console.log('\n=== Example 3: NO_TRADE Scenario ===\n');
  
  // Configure with very strict requirements
  const config: EinsteinConfig = {
    symbol: 'BTC',
    timeframe: '15m',
    accountBalance: 10000,
    riskTolerance: 2,
    minDataQuality: 95, // Very high quality requirement
    minConfidence: 80, // Very high confidence requirement
    minRiskReward: 4, // Very high risk-reward requirement
    maxLoss: 1 // Very low max loss
  };
  
  // Create coordinator
  const coordinator = createEinsteinCoordinator(config);
  
  // Generate trade signal
  const result = await coordinator.generateTradeSignal();
  
  // Check result
  if (result.success && result.signal) {
    if (result.signal.positionType === 'NO_TRADE') {
      console.log('\n✅ System correctly identified NO_TRADE scenario\n');
      console.log('Reason:');
      console.log(`  ${result.error}`);
      console.log('\nAnalysis:');
      console.log(`  Confidence: ${result.signal.confidence.overall}%`);
      console.log(`  Data Quality: ${result.dataQuality.overall}%`);
      console.log(`  Overall Reasoning: ${result.signal.analysis.reasoning.overall.substring(0, 300)}...`);
    } else {
      console.log('\n✅ Trade signal generated despite strict requirements!\n');
      console.log(`  Position: ${result.signal.positionType}`);
      console.log(`  Confidence: ${result.signal.confidence.overall}%`);
      console.log(`  Risk-Reward: ${result.signal.riskReward.toFixed(2)}:1`);
    }
  } else {
    console.log('\n⚠️  Signal generation failed');
    console.log(`Reason: ${result.error}`);
  }
}

/**
 * Example 4: Error handling
 */
async function example4_ErrorHandling() {
  console.log('\n=== Example 4: Error Handling ===\n');
  
  try {
    // Configure with invalid settings (will be caught by validation)
    const config: EinsteinConfig = {
      symbol: 'BTC',
      timeframe: '1h',
      accountBalance: 10000,
      riskTolerance: 2,
      minDataQuality: 90,
      minConfidence: 60,
      minRiskReward: 2,
      maxLoss: 2
    };
    
    // Create coordinator
    const coordinator = createEinsteinCoordinator(config);
    
    // Generate trade signal
    const result = await coordinator.generateTradeSignal();
    
    // Always check success flag
    if (!result.success) {
      console.log('❌ Trade signal generation failed');
      console.log(`Error: ${result.error}`);
      console.log(`Data Quality: ${result.dataQuality.overall}%`);
      
      // Handle specific error cases
      if (result.error?.includes('Data quality')) {
        console.log('\n💡 Suggestion: Wait for better data quality or lower minDataQuality threshold');
      } else if (result.error?.includes('Confidence')) {
        console.log('\n💡 Suggestion: Lower minConfidence threshold or wait for clearer market signals');
      } else if (result.error?.includes('Risk-reward')) {
        console.log('\n💡 Suggestion: Lower minRiskReward threshold or adjust entry/stop levels');
      }
    } else {
      console.log('✅ Trade signal generated successfully');
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Einstein Engine Coordinator - Usage Examples             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Example 1: Basic Bitcoin signal
    await example1_BasicBitcoinSignal();
    
    // Wait between examples
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Example 2: Custom Ethereum signal
    await example2_CustomEthereumSignal();
    
    // Wait between examples
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Example 3: NO_TRADE scenario
    await example3_NoTradeScenario();
    
    // Wait between examples
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Example 4: Error handling
    await example4_ErrorHandling();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  All examples completed!                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  } catch (error: any) {
    console.error('\n❌ Example execution failed:', error.message);
  }
}

// Export examples for individual use
export {
  example1_BasicBitcoinSignal,
  example2_CustomEthereumSignal,
  example3_NoTradeScenario,
  example4_ErrorHandling,
  runAllExamples
};

// Run examples if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
