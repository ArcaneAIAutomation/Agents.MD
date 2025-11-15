import { query } from '../lib/db';

async function clearAllBTCCache() {
  console.log('🗑️ Clearing ALL BTC cache from database...\n');
  
  try {
    // Clear ucie_gemini_analysis
    const geminiResult = await query(
      'DELETE FROM ucie_gemini_analysis WHERE symbol = $1',
      ['BTC']
    );
    console.log(`✅ Deleted ${geminiResult.rowCount} rows from ucie_gemini_analysis`);
    
    // Clear ucie_openai_analysis
    const openaiResult = await query(
      'DELETE FROM ucie_openai_analysis WHERE symbol = $1',
      ['BTC']
    );
    console.log(`✅ Deleted ${openaiResult.rowCount} rows from ucie_openai_analysis`);
    
    // Clear ucie_analysis_cache
    const cacheResult = await query(
      'DELETE FROM ucie_analysis_cache WHERE symbol = $1',
      ['BTC']
    );
    console.log(`✅ Deleted ${cacheResult.rowCount} rows from ucie_analysis_cache`);
    
    // Clear ucie_phase_data
    const phaseResult = await query(
      'DELETE FROM ucie_phase_data WHERE symbol = $1',
      ['BTC']
    );
    console.log(`✅ Deleted ${phaseResult.rowCount} rows from ucie_phase_data`);
    
    // Clear ucie_openai_summary
    const summaryResult = await query(
      'DELETE FROM ucie_openai_summary WHERE symbol = $1',
      ['BTC']
    );
    console.log(`✅ Deleted ${summaryResult.rowCount} rows from ucie_openai_summary`);
    
    console.log('\n🎉 All BTC cache cleared! Next analysis will be completely fresh with 1500-2000 words.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAllBTCCache();
