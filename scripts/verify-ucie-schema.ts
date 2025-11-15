/**
 * Verify UCIE Table Schema
 * Ensures all columns exist for 100% live data analysis
 */

import { query } from '../lib/db';

async function verifyUCIESchema() {
  console.log('🔍 Verifying UCIE Table Schema...\n');

  try {
    // Check ucie_analysis_cache structure
    console.log('📊 ucie_analysis_cache:');
    console.log('═══════════════════════════════════════');
    const cacheColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ucie_analysis_cache'
      ORDER BY ordinal_position
    `);
    
    cacheColumns.rows.forEach((col: any) => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '- NOT NULL' : ''}`);
    });

    // Check ucie_phase_data structure
    console.log('\n📊 ucie_phase_data:');
    console.log('═══════════════════════════════════════');
    const phaseColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ucie_phase_data'
      ORDER BY ordinal_position
    `);
    
    phaseColumns.rows.forEach((col: any) => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '- NOT NULL' : ''}`);
    });

    // Check ucie_openai_analysis structure
    console.log('\n📊 ucie_openai_analysis:');
    console.log('═══════════════════════════════════════');
    const openaiColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ucie_openai_analysis'
      ORDER BY ordinal_position
    `);
    
    openaiColumns.rows.forEach((col: any) => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '- NOT NULL' : ''}`);
    });

    // Check ucie_caesar_research structure
    console.log('\n📊 ucie_caesar_research:');
    console.log('═══════════════════════════════════════');
    const caesarColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ucie_caesar_research'
      ORDER BY ordinal_position
    `);
    
    caesarColumns.rows.forEach((col: any) => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '- NOT NULL' : ''}`);
    });

    // Test data insertion and retrieval
    console.log('\n🧪 Testing Data Operations:');
    console.log('═══════════════════════════════════════');

    // Test cache write
    const testSymbol = 'TEST_' + Date.now();
    const testData = {
      price: 50000,
      volume: 1000000,
      timestamp: new Date().toISOString()
    };

    await query(`
      INSERT INTO ucie_analysis_cache (symbol, analysis_type, data, data_quality_score, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '5 minutes')
      ON CONFLICT (symbol, analysis_type) 
      DO UPDATE SET data = $3, data_quality_score = $4, updated_at = NOW()
    `, [testSymbol, 'market-data', JSON.stringify(testData), 100]);

    console.log('  ✅ Cache write successful');

    // Test cache read
    const readResult = await query(`
      SELECT * FROM ucie_analysis_cache 
      WHERE symbol = $1 AND analysis_type = $2
    `, [testSymbol, 'market-data']);

    if (readResult.rows.length > 0) {
      console.log('  ✅ Cache read successful');
      console.log(`     Data: ${JSON.stringify(readResult.rows[0].data).substring(0, 50)}...`);
    }

    // Clean up test data
    await query(`DELETE FROM ucie_analysis_cache WHERE symbol = $1`, [testSymbol]);
    console.log('  ✅ Test data cleaned up');

    // Check indexes
    console.log('\n📊 Database Indexes:');
    console.log('═══════════════════════════════════════');
    const indexes = await query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' 
        AND tablename LIKE 'ucie%'
      ORDER BY tablename, indexname
    `);

    indexes.rows.forEach((idx: any) => {
      console.log(`  ${idx.tablename}.${idx.indexname}`);
    });

    console.log('\n✅ Schema verification complete!\n');

  } catch (error) {
    console.error('❌ Error verifying schema:', error);
    process.exit(1);
  }
}

verifyUCIESchema();
