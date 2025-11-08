/**
 * Verify UCIE Data Storage in Supabase
 * 
 * Checks that all data is being properly stored in the database
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { query } from '../lib/db';

async function verifyDatabaseStorage() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║   🗄️  SUPABASE DATABASE VERIFICATION 🗄️                  ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  try {
    // Check if table exists
    console.log('📊 Checking ucie_analysis_cache table...\n');
    
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ucie_analysis_cache'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table ucie_analysis_cache does not exist!');
      console.log('   Run migrations to create the table.');
      process.exit(1);
    }
    
    console.log('✅ Table exists\n');
    
    // Get total record count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM ucie_analysis_cache;
    `);
    
    const totalRecords = parseInt(countResult.rows[0].total);
    console.log(`📊 Total cached records: ${totalRecords}\n`);
    
    if (totalRecords === 0) {
      console.log('⚠️  No records found in cache. This is normal if no API calls have been made yet.\n');
    }
    
    // Get records by symbol
    console.log('📊 Records by Symbol:\n');
    
    const symbolStats = await query(`
      SELECT 
        symbol,
        COUNT(*) as count,
        MAX(created_at) as last_updated
      FROM ucie_analysis_cache
      GROUP BY symbol
      ORDER BY symbol;
    `);
    
    if (symbolStats.rows.length === 0) {
      console.log('   No records found\n');
    } else {
      symbolStats.rows.forEach(row => {
        console.log(`   ${row.symbol}: ${row.count} records (last: ${new Date(row.last_updated).toLocaleString()})`);
      });
      console.log('');
    }
    
    // Get records by analysis type
    console.log('📊 Records by Analysis Type:\n');
    
    const typeStats = await query(`
      SELECT 
        analysis_type,
        COUNT(*) as count,
        AVG(data_quality_score) as avg_quality,
        MAX(created_at) as last_updated
      FROM ucie_analysis_cache
      GROUP BY analysis_type
      ORDER BY analysis_type;
    `);
    
    if (typeStats.rows.length === 0) {
      console.log('   No records found\n');
    } else {
      typeStats.rows.forEach(row => {
        const avgQuality = parseFloat(row.avg_quality).toFixed(1);
        console.log(`   ${row.analysis_type}: ${row.count} records, Avg Quality: ${avgQuality}% (last: ${new Date(row.last_updated).toLocaleString()})`);
      });
      console.log('');
    }
    
    // Get recent records
    console.log('📊 Recent Records (Last 10):\n');
    
    const recentRecords = await query(`
      SELECT 
        symbol,
        analysis_type,
        data_quality_score,
        created_at,
        expires_at
      FROM ucie_analysis_cache
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    if (recentRecords.rows.length === 0) {
      console.log('   No records found\n');
    } else {
      recentRecords.rows.forEach(row => {
        const isExpired = new Date(row.expires_at) < new Date();
        const status = isExpired ? '❌ EXPIRED' : '✅ VALID';
        console.log(`   ${status} | ${row.symbol} | ${row.analysis_type} | Quality: ${row.data_quality_score}% | ${new Date(row.created_at).toLocaleString()}`);
      });
      console.log('');
    }
    
    // Check for BTC and ETH specifically
    console.log('📊 BTC & ETH Data Status:\n');
    
    for (const symbol of ['BTC', 'ETH']) {
      const symbolData = await query(`
        SELECT 
          analysis_type,
          data_quality_score,
          created_at,
          expires_at,
          CASE 
            WHEN expires_at > NOW() THEN 'VALID'
            ELSE 'EXPIRED'
          END as status
        FROM ucie_analysis_cache
        WHERE symbol = $1
        ORDER BY created_at DESC;
      `, [symbol]);
      
      console.log(`   ${symbol}:`);
      
      if (symbolData.rows.length === 0) {
        console.log(`      No cached data found`);
      } else {
        const types = ['market-data', 'on-chain', 'technical', 'news'];
        types.forEach(type => {
          const record = symbolData.rows.find(r => r.analysis_type === type);
          if (record) {
            const icon = record.status === 'VALID' ? '✅' : '❌';
            console.log(`      ${icon} ${type}: Quality ${record.data_quality_score}% (${record.status})`);
          } else {
            console.log(`      ⚠️  ${type}: Not cached yet`);
          }
        });
      }
      console.log('');
    }
    
    // Sample data
    console.log('📊 Sample Cached Data:\n');
    
    const sampleData = await query(`
      SELECT 
        symbol,
        analysis_type,
        data_quality_score,
        cached_data
      FROM ucie_analysis_cache
      WHERE symbol IN ('BTC', 'ETH')
      ORDER BY created_at DESC
      LIMIT 1;
    `);
    
    if (sampleData.rows.length > 0) {
      const sample = sampleData.rows[0];
      console.log(`   Symbol: ${sample.symbol}`);
      console.log(`   Type: ${sample.analysis_type}`);
      console.log(`   Quality: ${sample.data_quality_score}%`);
      console.log(`   Data Preview: ${JSON.stringify(sample.cached_data).substring(0, 200)}...\n`);
    } else {
      console.log('   No sample data available\n');
    }
    
    // Summary
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    
    if (totalRecords === 0) {
      console.log('║   ⚠️  DATABASE EMPTY ⚠️                                   ║');
      console.log('║   Make API calls to populate cache                       ║');
    } else if (totalRecords < 8) {
      console.log('║   ⚠️  PARTIAL DATA ⚠️                                     ║');
      console.log('║   Some data types not cached yet                         ║');
    } else {
      console.log('║   ✅ DATABASE WORKING ✅                                  ║');
      console.log('║   Data is being cached properly                          ║');
    }
    
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 Total Records: ${totalRecords}`);
    console.log(`📊 Symbols Cached: ${symbolStats.rows.length}`);
    console.log(`📊 Analysis Types: ${typeStats.rows.length}\n`);
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  }
}

verifyDatabaseStorage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
