/**
 * Quick diagnostic to see Market Data structure
 */

import { getCachedAnalysis } from '../lib/ucie/cacheUtils';

async function main() {
  const marketData = await getCachedAnalysis('BTC', 'market-data');
  
  console.log('\n=== MARKET DATA STRUCTURE ===\n');
  console.log('Top-level keys:', Object.keys(marketData || {}));
  
  if (marketData?.priceAggregation) {
    console.log('\npriceAggregation keys:', Object.keys(marketData.priceAggregation));
    console.log('\npriceAggregation.consensus:', marketData.priceAggregation.consensus);
  }
  
  if (marketData?.marketData) {
    console.log('\nmarketData keys:', Object.keys(marketData.marketData));
    console.log('\nmarketData content:', marketData.marketData);
  }
  
  console.log('\n=== RISK DATA STRUCTURE ===\n');
  const riskData = await getCachedAnalysis('BTC', 'risk');
  console.log('Top-level keys:', Object.keys(riskData || {}));
  
  if (riskData?.riskScore) {
    console.log('\nriskScore keys:', Object.keys(riskData.riskScore));
    console.log('\nriskScore content:', riskData.riskScore);
  }
}

main().catch(console.error);
