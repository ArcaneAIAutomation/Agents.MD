/**
 * Check Table Schema
 * 
 * Shows the actual columns in the ucie_analysis_cache table
 */

import { query } from '../lib/db';

async function checkTableSchema() {
  console.log('🔍 Checking Table Schema');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Get table schema
    const schemaResult = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ucie_analysis_cache'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table: ucie_analysis_cache');
    console.log('-'.repeat(60));
    console.log('Columns:');
    for (const col of schemaResult.rows) {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    }
    console.log('');
    
    // Get sample data
    const dataResult = await query(`
      SELECT *
      FROM ucie_analysis_cache
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`📊 Sample Data (${dataResult.rows.length} rows):`);
    console.log('-'.repeat(60));
    
    for (const row of dataResult.rows) {
      console.log(`Symbol: ${row.symbol}`);
      console.log(`Type: ${row.analysis_type}`);
      console.log(`User: ${row.user_email}`);
      console.log(`Created: ${row.created_at}`);
      console.log(`Expires: ${row.expires_at}`);
      
      // Check if expired
      const now = new Date();
      const expires = new Date(row.expires_at);
      const isExpired = expires < now;
      console.log(`Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
      
      if (row.data) {
        const dataStr = JSON.stringify(row.data);
        console.log(`Data size: ${dataStr.length} bytes`);
        console.log(`Data preview: ${dataStr.substring(0, 100)}...`);
      }
      console.log('');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTableSchema();
