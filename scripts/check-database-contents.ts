/**
 * Check Database Contents
 * 
 * Queries the database to see what's actually stored
 */

import { query } from '../lib/db';

async function checkDatabaseContents() {
  console.log('🔍 Checking Database Contents');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Query all entries in ucie_analysis_cache
    const result = await query(`
      SELECT 
        symbol,
        analysis_type,
        user_email,
        data_quality,
        created_at,
        expires_at,
        LENGTH(data::text) as data_size
      FROM ucie_analysis_cache
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log(`📊 Found ${result.rows.length} entries in database`);
    console.log('');
    
    if (result.rows.length === 0) {
      console.log('❌ Database is empty');
      console.log('');
      process.exit(1);
    }
    
    // Group by symbol
    const bySymbol: any = {};
    
    for (const row of result.rows) {
      if (!bySymbol[row.symbol]) {
        bySymbol[row.symbol] = [];
      }
      bySymbol[row.symbol].push(row);
    }
    
    // Display grouped data
    for (const [symbol, entries] of Object.entries(bySymbol)) {
      console.log(`📈 ${symbol}:`);
      console.log('-'.repeat(60));
      
      for (const entry of entries as any[]) {
        const age = Math.floor((Date.now() - new Date(entry.created_at).getTime()) / 1000);
        const ttl = Math.floor((new Date(entry.expires_at).getTime() - Date.now()) / 1000);
        const expired = ttl < 0;
        
        console.log(`  ${expired ? '❌' : '✅'} ${entry.analysis_type}`);
        console.log(`     User: ${entry.user_email}`);
        console.log(`     Quality: ${entry.data_quality}`);
        console.log(`     Size: ${entry.data_size} bytes`);
        console.log(`     Age: ${age}s ago`);
        console.log(`     TTL: ${expired ? 'EXPIRED' : `${ttl}s remaining`}`);
        console.log(`     Created: ${entry.created_at}`);
        console.log(`     Expires: ${entry.expires_at}`);
        console.log('');
      }
    }
    
    // Check for BTC specifically
    console.log('🔍 Checking BTC data specifically:');
    console.log('-'.repeat(60));
    
    const btcResult = await query(`
      SELECT 
        analysis_type,
        user_email,
        data_quality,
        created_at,
        expires_at,
        data
      FROM ucie_analysis_cache
      WHERE symbol = 'BTC'
      AND expires_at > NOW()
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${btcResult.rows.length} valid (non-expired) BTC entries`);
    console.log('');
    
    if (btcResult.rows.length > 0) {
      console.log('Available data types:');
      for (const row of btcResult.rows) {
        console.log(`  ✅ ${row.analysis_type} (quality: ${row.data_quality})`);
      }
      console.log('');
      
      // Show sample data
      console.log('Sample data (first entry):');
      console.log('-'.repeat(60));
      const sample = btcResult.rows[0];
      console.log(`Type: ${sample.analysis_type}`);
      console.log(`Data preview:`);
      console.log(JSON.stringify(sample.data, null, 2).substring(0, 500) + '...');
      console.log('');
    } else {
      console.log('❌ No valid BTC data found (all entries may be expired)');
      console.log('');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabaseContents();
