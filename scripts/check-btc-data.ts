import { query } from '../lib/db';

async function checkBTCData() {
  console.log('🔍 Checking Supabase for BTC data...\n');
  
  try {
    // First, check the table schema
    console.log('📋 Checking ucie_analysis_cache schema...');
    const schemaCheck = await query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'ucie_analysis_cache'
       ORDER BY ordinal_position`
    );
    
    console.log('Columns:');
    schemaCheck.rows.forEach((row: any) => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    console.log('');
    
    // Check ucie_analysis_cache table (without quality_score)
    const cacheData = await query(
      `SELECT analysis_type, created_at 
       FROM ucie_analysis_cache 
       WHERE symbol = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      ['BTC']
    );
    
    console.log('📊 ucie_analysis_cache (last 10 entries):');
    if (cacheData.rows.length > 0) {
      cacheData.rows.forEach((row: any) => {
        console.log(`  ✅ ${row.analysis_type} at ${new Date(row.created_at).toLocaleString()}`);
      });
    } else {
      console.log('  ❌ No data found');
    }
    
    console.log('');
    
    // Check ucie_gemini_analysis table
    const geminiData = await query(
      `SELECT analysis_type, data_quality_score, LENGTH(summary_text) as text_length, created_at 
       FROM ucie_gemini_analysis 
       WHERE symbol = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      ['BTC']
    );
    
    console.log('🤖 ucie_gemini_analysis (last 5 entries):');
    if (geminiData.rows.length > 0) {
      geminiData.rows.forEach((row: any) => {
        console.log(`  ✅ ${row.analysis_type}: Quality ${row.data_quality_score}%, ${row.text_length} chars at ${new Date(row.created_at).toLocaleString()}`);
      });
    } else {
      console.log('  ❌ No Gemini analysis found');
    }
    
    // Get latest Gemini analysis text preview
    if (geminiData.rows.length > 0) {
      const latestGemini = await query(
        `SELECT summary_text 
         FROM ucie_gemini_analysis 
         WHERE symbol = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        ['BTC']
      );
      
      if (latestGemini.rows.length > 0) {
        const text = latestGemini.rows[0].summary_text;
        console.log('\n📝 Latest Gemini Analysis Preview (first 500 chars):');
        console.log(text.substring(0, 500) + '...');
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  }
  
  process.exit(0);
}

checkBTCData();
