/**
 * Clear All UCIE Data Script
 * 
 * Removes ALL UCIE-related data from database for fresh testing:
 * - ucie_analysis_cache (all cached API responses)
 * - ucie_openai_analysis (all OpenAI summaries)
 * - ucie_phase_data (all phase tracking data)
 * - caesar_research_jobs (all Caesar AI research jobs)
 * 
 * Usage: npx tsx scripts/clear-all-ucie-data.ts
 */

import { query } from '../lib/db';

async function clearAllUCIEData() {
  console.log('🗑️  CLEARING ALL UCIE DATA FROM DATABASE...\n');
  
  try {
    // 1. Clear ucie_analysis_cache (all cached API responses)
    console.log('📊 Clearing ucie_analysis_cache...');
    const cacheResult = await query('DELETE FROM ucie_analysis_cache');
    console.log(`   ✅ Deleted ${cacheResult.rowCount || 0} cached API responses\n`);
    
    // 2. Clear ucie_openai_analysis (all OpenAI summaries)
    console.log('🤖 Clearing ucie_openai_analysis...');
    const openaiResult = await query('DELETE FROM ucie_openai_analysis');
    console.log(`   ✅ Deleted ${openaiResult.rowCount || 0} OpenAI summaries\n`);
    
    // 3. Clear ucie_phase_data (all phase tracking)
    console.log('📈 Clearing ucie_phase_data...');
    const phaseResult = await query('DELETE FROM ucie_phase_data');
    console.log(`   ✅ Deleted ${phaseResult.rowCount || 0} phase tracking entries\n`);
    
    // 4. Clear caesar_research_jobs (all Caesar AI jobs) - if table exists
    console.log('🏛️  Clearing caesar_research_jobs...');
    let caesarResult = { rowCount: 0 };
    try {
      caesarResult = await query('DELETE FROM caesar_research_jobs');
      console.log(`   ✅ Deleted ${caesarResult.rowCount || 0} Caesar research jobs\n`);
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log(`   ⚠️  Table does not exist (skipping)\n`);
      } else {
        throw error;
      }
    }
    
    // Summary
    const totalDeleted = 
      (cacheResult.rowCount || 0) + 
      (openaiResult.rowCount || 0) + 
      (phaseResult.rowCount || 0) + 
      (caesarResult.rowCount || 0);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ALL UCIE DATA CLEARED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total entries deleted: ${totalDeleted}`);
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - API Cache: ${cacheResult.rowCount || 0} entries`);
    console.log(`   - OpenAI Summaries: ${openaiResult.rowCount || 0} entries`);
    console.log(`   - Phase Data: ${phaseResult.rowCount || 0} entries`);
    console.log(`   - Caesar Jobs: ${caesarResult.rowCount || 0} entries`);
    console.log('');
    console.log('🎯 Database is now clean for fresh UCIE testing!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to UCIE dashboard');
    console.log('2. Click "Collect Data" for BTC or ETH');
    console.log('3. Verify fresh data collection (no cache hits)');
    console.log('4. Check AI Summary is complete (no truncation)');
    console.log('5. Proceed with Caesar AI analysis');
    
  } catch (error) {
    console.error('❌ Error clearing UCIE data:', error);
    throw error;
  }
}

// Run the script
clearAllUCIEData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
