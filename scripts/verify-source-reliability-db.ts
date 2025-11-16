/**
 * Verify Source Reliability Database Records
 */

import { query } from '../lib/db';

async function verifyDatabase() {
  console.log('🔍 Verifying Source Reliability Database...\n');
  
  try {
    // Check if table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'veritas_source_reliability'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Table veritas_source_reliability does not exist');
      process.exit(1);
    }
    
    console.log('✅ Table exists: veritas_source_reliability\n');
    
    // Get all records
    const result = await query(`
      SELECT * FROM veritas_source_reliability 
      ORDER BY reliability_score DESC
    `);
    
    console.log(`📊 Found ${result.rows.length} source reliability records:\n`);
    
    if (result.rows.length > 0) {
      result.rows.forEach((row: any) => {
        console.log(`Source: ${row.source_name}`);
        console.log(`  Reliability: ${parseFloat(row.reliability_score).toFixed(2)}%`);
        console.log(`  Trust Weight: ${parseFloat(row.trust_weight).toFixed(2)}`);
        console.log(`  Total Validations: ${row.total_validations}`);
        console.log(`  Successful: ${row.successful_validations}`);
        console.log(`  Deviations: ${row.deviation_count}`);
        console.log(`  Last Updated: ${row.last_updated}`);
        console.log('');
      });
    } else {
      console.log('No records found (this is normal for a fresh installation)');
    }
    
    console.log('✅ Database verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyDatabase();
