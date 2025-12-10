/**
 * Check On-Chain Data Storage
 * Verifies what's actually stored in Supabase for on-chain data
 */

import { getCachedAnalysis } from '../lib/ucie/cacheUtils';

async function main() {
  console.log('🔍 Checking On-Chain Data Storage in Supabase...\n');
  
  try {
    const data = await getCachedAnalysis('BTC', 'on-chain');
    
    if (!data) {
      console.log('❌ No on-chain data found in database');
      return;
    }
    
    console.log('✅ On-Chain Data Found!\n');
    console.log('📊 Full Stored Data:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n📈 Data Structure Analysis:');
    console.log('- Has networkMetrics:', !!data.networkMetrics);
    console.log('- Has whaleActivity:', !!data.whaleActivity);
    console.log('- Has mempoolAnalysis:', !!data.mempoolAnalysis);
    console.log('- Data Quality:', data.dataQuality || 'N/A');
    console.log('- Timestamp:', data.timestamp || 'N/A');
    
    if (data.whaleActivity) {
      console.log('\n🐋 Whale Activity Details:');
      console.log(JSON.stringify(data.whaleActivity, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
