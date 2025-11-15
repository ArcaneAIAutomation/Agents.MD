import { query } from '../lib/db';

async function clearGeminiCache() {
  console.log('🗑️ Clearing Gemini analysis cache for BTC...\n');
  
  try {
    // Delete from ucie_gemini_analysis
    const result1 = await query(
      `DELETE FROM ucie_gemini_analysis WHERE symbol = $1`,
      ['BTC']
    );
    console.log(`✅ Deleted ${result1.rowCount} rows from ucie_gemini_analysis`);
    
    // Delete from ucie_openai_analysis (backward compatibility table)
    const result2 = await query(
      `DELETE FROM ucie_openai_analysis WHERE symbol = $1`,
      ['BTC']
    );
    console.log(`✅ Deleted ${result2.rowCount} rows from ucie_openai_analysis`);
    
    // Also clear the analysis cache
    const result3 = await query(
      `DELETE FROM ucie_analysis_cache WHERE symbol = $1`,
      ['BTC']
    );
    console.log(`✅ Deleted ${result3.rowCount} rows from ucie_analysis_cache`);
    
    console.log('\n🎉 Cache cleared! Next BTC analysis will generate fresh Gemini summary with 1500-2000 words.');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
  
  process.exit(0);
}

clearGeminiCache();
