/**
 * Clear UCIE Data for Specific Symbol
 * 
 * Removes UCIE data for a specific cryptocurrency symbol (BTC, ETH, etc.)
 * 
 * Usage: 
 *   npx tsx scripts/clear-ucie-symbol.ts BTC
 *   npx tsx scripts/clear-ucie-symbol.ts ETH
 */

import { query } from '../lib/db';

async function clearUCIESymbol(symbol: string) {
  const normalizedSymbol = symbol.toUpperCase();
  
  console.log(`🗑️  CLEARING UCIE DATA FOR ${normalizedSymbol}...\n`);
  
  try {
    // 1. Clear ucie_analysis_cache for this symbol
    console.log(`📊 Clearing cached API responses for ${normalizedSymbol}...`);
    const cacheResult = await query(
      'DELETE FROM ucie_analysis_cache WHERE symbol = $1',
      [normalizedSymbol]
    );
    console.log(`   ✅ Deleted ${cacheResult.rowCount || 0} cached entries\n`);
    
    // 2. Clear ucie_openai_analysis for this symbol
    console.log(`🤖 Clearing OpenAI summaries for ${normalizedSymbol}...`);
    const openaiResult = await query(
      'DELETE FROM ucie_openai_analysis WHERE symbol = $1',
      [normalizedSymbol]
    );
    console.log(`   ✅ Deleted ${openaiResult.rowCount || 0} OpenAI summaries\n`);
    
    // 3. Clear ucie_phase_data for this symbol
    console.log(`📈 Clearing phase data for ${normalizedSymbol}...`);
    const phaseResult = await query(
      'DELETE FROM ucie_phase_data WHERE symbol = $1',
      [normalizedSymbol]
    );
    console.log(`   ✅ Deleted ${phaseResult.rowCount || 0} phase entries\n`);
    
    // 4. Clear caesar_research_jobs for this symbol - if table exists
    console.log(`🏛️  Clearing Caesar research jobs for ${normalizedSymbol}...`);
    let caesarResult = { rowCount: 0 };
    try {
      caesarResult = await query(
        'DELETE FROM caesar_research_jobs WHERE symbol = $1',
        [normalizedSymbol]
      );
      console.log(`   ✅ Deleted ${caesarResult.rowCount || 0} Caesar jobs\n`);
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
    console.log(`✅ ALL ${normalizedSymbol} DATA CLEARED SUCCESSFULLY!`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total entries deleted: ${totalDeleted}`);
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - API Cache: ${cacheResult.rowCount || 0} entries`);
    console.log(`   - OpenAI Summaries: ${openaiResult.rowCount || 0} entries`);
    console.log(`   - Phase Data: ${phaseResult.rowCount || 0} entries`);
    console.log(`   - Caesar Jobs: ${caesarResult.rowCount || 0} entries`);
    console.log('');
    console.log(`🎯 ${normalizedSymbol} data cleared - ready for fresh collection!`);
    
  } catch (error) {
    console.error(`❌ Error clearing ${normalizedSymbol} data:`, error);
    throw error;
  }
}

// Get symbol from command line arguments
const symbol = process.argv[2];

if (!symbol) {
  console.error('❌ Error: Symbol required');
  console.log('');
  console.log('Usage:');
  console.log('  npx tsx scripts/clear-ucie-symbol.ts BTC');
  console.log('  npx tsx scripts/clear-ucie-symbol.ts ETH');
  process.exit(1);
}

// Run the script
clearUCIESymbol(symbol)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
