/**
 * Source Reliability Tracker - Usage Examples
 * 
 * This file demonstrates how to use the Source Reliability Tracker
 * in various scenarios within the Veritas Protocol.
 */

import { sourceReliabilityTracker } from '../utils/sourceReliabilityTracker';

/**
 * Example 1: Basic Reliability Tracking
 * 
 * Track validation results for multiple sources and see how
 * trust weights are dynamically adjusted.
 */
async function example1_BasicTracking() {
  console.log('=== Example 1: Basic Reliability Tracking ===\n');
  
  // Simulate validation results for CoinGecko (highly reliable)
  console.log('Tracking CoinGecko validations...');
  for (let i = 0; i < 10; i++) {
    sourceReliabilityTracker.updateReliability('CoinGecko', 'pass');
  }
  
  // Simulate validation results for CoinMarketCap (mostly reliable)
  console.log('Tracking CoinMarketCap validations...');
  for (let i = 0; i < 8; i++) {
    sourceReliabilityTracker.updateReliability('CoinMarketCap', 'pass');
  }
  sourceReliabilityTracker.updateReliability('CoinMarketCap', 'deviation', 1.8);
  sourceReliabilityTracker.updateReliability('CoinMarketCap', 'fail');
  
  // Simulate validation results for BadSource (unreliable)
  console.log('Tracking BadSource validations...');
  for (let i = 0; i < 5; i++) {
    sourceReliabilityTracker.updateReliability('BadSource', 'pass');
  }
  for (let i = 0; i < 5; i++) {
    sourceReliabilityTracker.updateReliability('BadSource', 'fail');
  }
  
  // Display results
  console.log('\nReliability Scores:');
  console.log('CoinGecko:', sourceReliabilityTracker.getScore('CoinGecko'));
  console.log('CoinMarketCap:', sourceReliabilityTracker.getScore('CoinMarketCap'));
  console.log('BadSource:', sourceReliabilityTracker.getScore('BadSource'));
  
  console.log('\nTrust Weights:');
  console.log('CoinGecko:', sourceReliabilityTracker.getTrustWeight('CoinGecko'));
  console.log('CoinMarketCap:', sourceReliabilityTracker.getTrustWeight('CoinMarketCap'));
  console.log('BadSource:', sourceReliabilityTracker.getTrustWeight('BadSource'));
  
  // Persist to database
  await sourceReliabilityTracker.persistToDatabase();
  console.log('\n✅ Reliability scores persisted to database');
}

/**
 * Example 2: Identifying Unreliable Sources
 * 
 * Demonstrate how to identify and handle unreliable sources.
 */
async function example2_UnreliableSources() {
  console.log('\n=== Example 2: Identifying Unreliable Sources ===\n');
  
  // Get unreliable sources (below 70% reliability)
  const unreliable = sourceReliabilityTracker.getUnreliableSources(70);
  
  if (unreliable.length > 0) {
    console.log('⚠️ Unreliable sources detected:');
    unreliable.forEach(source => {
      const score = sourceReliabilityTracker.getScore(source);
      console.log(`  - ${source}: ${score?.reliabilityScore.toFixed(2)}% reliability`);
    });
    
    console.log('\n💡 Recommendation: Consider removing or replacing these sources');
  } else {
    console.log('✅ All sources are reliable (≥70% reliability)');
  }
}

/**
 * Example 3: Weighted Price Calculation
 * 
 * Show how to use trust weights in price validation.
 */
async function example3_WeightedPriceCalculation() {
  console.log('\n=== Example 3: Weighted Price Calculation ===\n');
  
  // Simulate price data from multiple sources
  const priceData = [
    { source: 'CoinGecko', price: 95000 },
    { source: 'CoinMarketCap', price: 95100 },
    { source: 'BadSource', price: 98000 } // Outlier
  ];
  
  console.log('Raw prices:');
  priceData.forEach(data => {
    console.log(`  ${data.source}: $${data.price.toLocaleString()}`);
  });
  
  // Calculate simple average (no weights)
  const simpleAverage = priceData.reduce((sum, d) => sum + d.price, 0) / priceData.length;
  console.log(`\nSimple average: $${simpleAverage.toLocaleString()}`);
  
  // Calculate weighted average using trust weights
  const weightedPrices = priceData.map(data => ({
    price: data.price,
    weight: sourceReliabilityTracker.getTrustWeight(data.source)
  }));
  
  const totalWeight = weightedPrices.reduce((sum, p) => sum + p.weight, 0);
  const weightedAverage = weightedPrices.reduce(
    (sum, p) => sum + (p.price * p.weight), 0
  ) / totalWeight;
  
  console.log('\nWeighted calculation:');
  priceData.forEach((data, i) => {
    const weight = weightedPrices[i].weight;
    console.log(`  ${data.source}: $${data.price.toLocaleString()} × ${weight.toFixed(2)} weight`);
  });
  console.log(`\nWeighted average: $${weightedAverage.toLocaleString()}`);
  
  console.log('\n💡 The weighted average reduces the impact of unreliable sources');
}

/**
 * Example 4: Validation History Analysis
 * 
 * Analyze validation history to understand source behavior.
 */
async function example4_HistoryAnalysis() {
  console.log('\n=== Example 4: Validation History Analysis ===\n');
  
  const source = 'CoinMarketCap';
  const history = sourceReliabilityTracker.getHistory(source, 10);
  
  if (history.length > 0) {
    console.log(`Recent validation history for ${source}:`);
    history.forEach((entry, i) => {
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      let message = `  ${i + 1}. [${timestamp}] ${entry.validationResult}`;
      
      if (entry.deviationAmount) {
        message += ` (deviation: ${entry.deviationAmount.toFixed(2)}%)`;
      }
      
      console.log(message);
    });
  } else {
    console.log(`No validation history found for ${source}`);
  }
}

/**
 * Example 5: Summary Statistics
 * 
 * Get aggregate statistics across all sources.
 */
async function example5_SummaryStatistics() {
  console.log('\n=== Example 5: Summary Statistics ===\n');
  
  const summary = sourceReliabilityTracker.getSummary();
  
  console.log('Overall Statistics:');
  console.log(`  Total sources tracked: ${summary.totalSources}`);
  console.log(`  Average reliability: ${summary.averageReliability.toFixed(2)}%`);
  console.log(`  High reliability sources (≥90%): ${summary.highReliabilitySources}`);
  console.log(`  Low reliability sources (<70%): ${summary.lowReliabilitySources}`);
  console.log(`  Total validations performed: ${summary.totalValidations}`);
  
  // Calculate health score
  const healthScore = summary.totalSources > 0
    ? (summary.highReliabilitySources / summary.totalSources) * 100
    : 0;
  
  console.log(`\n📊 Data Source Health Score: ${healthScore.toFixed(0)}%`);
  
  if (healthScore >= 80) {
    console.log('✅ Excellent - Most sources are highly reliable');
  } else if (healthScore >= 60) {
    console.log('⚠️ Good - Some sources need attention');
  } else {
    console.log('❌ Poor - Many sources are unreliable');
  }
}

/**
 * Example 6: Real-World Integration
 * 
 * Demonstrate integration with market data validation.
 */
async function example6_RealWorldIntegration() {
  console.log('\n=== Example 6: Real-World Integration ===\n');
  
  // Simulate fetching market data from multiple sources
  const marketData = [
    { source: 'CoinGecko', price: 95000, volume: 28000000000 },
    { source: 'CoinMarketCap', price: 95050, volume: 28500000000 },
    { source: 'Kraken', price: 95025, volume: 27800000000 }
  ];
  
  console.log('Validating market data from multiple sources...\n');
  
  // Calculate consensus price (weighted average)
  const weightedPrices = marketData.map(data => ({
    price: data.price,
    weight: sourceReliabilityTracker.getTrustWeight(data.source)
  }));
  
  const totalWeight = weightedPrices.reduce((sum, p) => sum + p.weight, 0);
  const consensusPrice = weightedPrices.reduce(
    (sum, p) => sum + (p.price * p.weight), 0
  ) / totalWeight;
  
  console.log(`Consensus price: $${consensusPrice.toLocaleString()}`);
  console.log('\nValidation results:');
  
  // Validate each source against consensus
  marketData.forEach(data => {
    const deviation = Math.abs(data.price - consensusPrice) / consensusPrice;
    const deviationPercent = deviation * 100;
    
    let result: 'pass' | 'fail' | 'deviation';
    let status: string;
    
    if (deviationPercent < 0.1) {
      result = 'pass';
      status = '✅ PASS';
    } else if (deviationPercent < 1.0) {
      result = 'deviation';
      status = '⚠️ DEVIATION';
    } else {
      result = 'fail';
      status = '❌ FAIL';
    }
    
    console.log(`  ${data.source}: ${status} (${deviationPercent.toFixed(3)}% deviation)`);
    
    // Update reliability
    sourceReliabilityTracker.updateReliability(
      data.source,
      result,
      result === 'deviation' ? deviationPercent : undefined
    );
  });
  
  // Persist updates
  await sourceReliabilityTracker.persistToDatabase();
  console.log('\n✅ Reliability scores updated and persisted');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_BasicTracking();
    await example2_UnreliableSources();
    await example3_WeightedPriceCalculation();
    await example4_HistoryAnalysis();
    await example5_SummaryStatistics();
    await example6_RealWorldIntegration();
    
    console.log('\n🎉 All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  example1_BasicTracking,
  example2_UnreliableSources,
  example3_WeightedPriceCalculation,
  example4_HistoryAnalysis,
  example5_SummaryStatistics,
  example6_RealWorldIntegration
};
