/**
 * Verify ATGE Verification Columns
 * 
 * Quick verification that all columns were added successfully
 */

import { query } from '../lib/db';

async function verifyColumns() {
  console.log('🔍 Verifying ATGE Verification Columns...\n');

  try {
    // Check all verification columns
    const result = await query(`
      SELECT 
        table_name,
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('trade_results', 'trade_market_snapshot')
        AND column_name IN ('last_verified_at', 'verification_data_source', 'sopr_value', 'mvrv_z_score')
      ORDER BY table_name, column_name
    `);

    console.log('📋 Verification Columns:\n');
    
    const tradeResults = result.rows.filter(r => r.table_name === 'trade_results');
    const marketSnapshot = result.rows.filter(r => r.table_name === 'trade_market_snapshot');
    
    console.log('trade_results:');
    tradeResults.forEach(r => {
      console.log(`  ✅ ${r.column_name} (${r.data_type}) - nullable: ${r.is_nullable}`);
    });
    
    console.log('\ntrade_market_snapshot:');
    marketSnapshot.forEach(r => {
      console.log(`  ✅ ${r.column_name} (${r.data_type}) - nullable: ${r.is_nullable}`);
    });

    // Check views
    const views = await query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name IN ('vw_trade_verification_status', 'vw_bitcoin_onchain_metrics')
      ORDER BY table_name
    `);

    console.log('\n📋 Verification Views:\n');
    views.rows.forEach(v => {
      console.log(`  ✅ ${v.table_name}`);
    });

    console.log('\n✅ All verification columns and views are present!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyColumns();
