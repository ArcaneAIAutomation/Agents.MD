import { query } from '../lib/db';

async function checkGeminiCache() {
  console.log('🔍 Checking Gemini analysis cache for BTC...\n');
  
  try {
    // Check ucie_gemini_analysis table
    console.log('📊 Checking ucie_gemini_analysis table:');
    const geminiResult = await query(
      `SELECT symbol, created_at, 
       LENGTH(summary_text) as summary_length,
       (LENGTH(summary_text) - LENGTH(REPLACE(summary_text, ' ', '')) + 1) as word_count,
       data_quality_score, tokens_used
       FROM ucie_gemini_analysis 
       WHERE symbol = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      ['BTC']
    );
    
    if (geminiResult.rows.length > 0) {
      const row = geminiResult.rows[0];
      console.log('   ❌ FOUND OLD CACHE:');
      console.log(`      Symbol: ${row.symbol}`);
      console.log(`      Created: ${row.created_at}`);
      console.log(`      Summary length: ${row.summary_length} characters`);
      console.log(`      Word count: ${row.word_count} words`);
      console.log(`      Data quality: ${row.data_quality_score}%`);
      console.log(`      Tokens used: ${row.tokens_used}`);
      console.log('\n   ⚠️ This is OLD cached data! Need to clear it.');
    } else {
      console.log('   ✅ No Gemini analysis cached (good - will generate fresh)');
    }
    
    // Check ucie_analysis_cache table
    console.log('\n📊 Checking ucie_analysis_cache table:');
    const cacheResult = await query(
      `SELECT symbol, analysis_type, created_at, expires_at, data_quality_score,
       LENGTH(data::text) as data_length
       FROM ucie_analysis_cache 
       WHERE symbol = $1
       ORDER BY created_at DESC`,
      ['BTC']
    );
    
    if (cacheResult.rows.length > 0) {
      console.log(`   Found ${cacheResult.rows.length} cached entries:`);
      cacheResult.rows.forEach((row, i) => {
        console.log(`\n   Entry ${i + 1}:`);
        console.log(`      Type: ${row.analysis_type}`);
        console.log(`      Created: ${row.created_at}`);
        console.log(`      Expires: ${row.expires_at}`);
        console.log(`      Quality: ${row.data_quality_score}%`);
        console.log(`      Data size: ${row.data_length} characters`);
      });
    } else {
      console.log('   ✅ No analysis cache (good - will generate fresh)');
    }
    
    // Check ucie_phase_data table
    console.log('\n📊 Checking ucie_phase_data table:');
    const phaseResult = await query(
      `SELECT symbol, phase_number, created_at, expires_at
       FROM ucie_phase_data 
       WHERE symbol = $1
       ORDER BY phase_number DESC`,
      ['BTC']
    );
    
    if (phaseResult.rows.length > 0) {
      console.log(`   Found ${phaseResult.rows.length} phase entries:`);
      phaseResult.rows.forEach((row, i) => {
        console.log(`      Phase ${row.phase_number}: Created ${row.created_at}, Expires ${row.expires_at}`);
      });
    } else {
      console.log('   ✅ No phase data (good - will generate fresh)');
    }
    
    console.log('\n🎯 Summary:');
    console.log('   - If all tables show ✅, next BTC analysis will be completely fresh');
    console.log('   - If any show ❌, run clear-gemini-cache.ts to clear old data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkGeminiCache();
