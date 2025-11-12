/**
 * UCIE Storage Verification Script
 * 
 * Tests that API data is being correctly stored in Supabase database
 * 
 * Usage:
 *   npx tsx scripts/verify-ucie-storage.ts [symbol]
 * 
 * Example:
 *   npx tsx scripts/verify-ucie-storage.ts BTC
 */

import { query } from '../lib/db';

const symbol = process.argv[2] || 'BTC';

interface CacheEntry {
  id: string;
  symbol: string;
  analysis_type: string;
  data_quality_score: number | null;
  user_id: string;
  user_email: string;
  created_at: Date;
  expires_at: Date;
  data: any;
}

async function verifyStorage() {
  console.log('🔍 UCIE Storage Verification');
  console.log('=' .repeat(60));
  console.log(`Symbol: ${symbol}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Test 1: Check if data exists
    console.log('📊 Test 1: Checking for stored data...');
    const result = await query(
      `SELECT 
        id,
        symbol,
        analysis_type,
        data_quality_score,
        user_id,
        user_email,
        created_at,
        expires_at,
        CASE 
          WHEN data IS NOT NULL THEN 'present'
          ELSE 'missing'
        END as data_status,
        pg_column_size(data) as data_size_bytes
      FROM ucie_analysis_cache
      WHERE symbol = $1
      ORDER BY created_at DESC`,
      [symbol.toUpperCase()]
    );

    if (result.rows.length === 0) {
      console.log('❌ No data found in database');
      console.log('');
      console.log('💡 To populate data, make a request:');
      console.log(`   curl https://news.arcane.group/api/ucie/preview-data/${symbol}`);
      console.log('');
      process.exit(1);
    }

    console.log(`✅ Found ${result.rows.length} cache entries`);
    console.log('');

    // Test 2: Verify all expected types
    console.log('📋 Test 2: Verifying data types...');
    const expectedTypes = ['market-data', 'sentiment', 'technical', 'news', 'on-chain'];
    const foundTypes = result.rows.map(row => row.analysis_type);
    
    const missingTypes = expectedTypes.filter(type => !foundTypes.includes(type));
    const extraTypes = foundTypes.filter(type => !expectedTypes.includes(type));

    if (missingTypes.length > 0) {
      console.log(`⚠️  Missing types: ${missingTypes.join(', ')}`);
    }
    if (extraTypes.length > 0) {
      console.log(`ℹ️  Extra types: ${extraTypes.join(', ')}`);
    }
    if (missingTypes.length === 0) {
      console.log('✅ All expected types present');
    }
    console.log('');

    // Test 3: Check data freshness
    console.log('⏰ Test 3: Checking data freshness...');
    const now = new Date();
    let allFresh = true;

    for (const row of result.rows) {
      const age = now.getTime() - new Date(row.created_at).getTime();
      const ageMinutes = Math.floor(age / 60000);
      const ttl = new Date(row.expires_at).getTime() - now.getTime();
      const ttlMinutes = Math.floor(ttl / 60000);

      const isFresh = ageMinutes < 15; // Fresh if < 15 minutes old
      const status = isFresh ? '✅' : '⚠️';

      console.log(`${status} ${row.analysis_type.padEnd(15)} - Age: ${ageMinutes}m, TTL: ${ttlMinutes}m`);

      if (!isFresh) {
        allFresh = false;
      }
    }

    if (allFresh) {
      console.log('✅ All data is fresh (< 15 minutes old)');
    } else {
      console.log('⚠️  Some data is stale (> 15 minutes old)');
    }
    console.log('');

    // Test 4: Check data quality scores
    console.log('📈 Test 4: Checking data quality scores...');
    let hasQualityScores = false;

    for (const row of result.rows) {
      if (row.data_quality_score !== null) {
        hasQualityScores = true;
        const status = row.data_quality_score >= 70 ? '✅' : '⚠️';
        console.log(`${status} ${row.analysis_type.padEnd(15)} - Quality: ${row.data_quality_score}%`);
      } else {
        console.log(`ℹ️  ${row.analysis_type.padEnd(15)} - Quality: N/A`);
      }
    }

    if (hasQualityScores) {
      console.log('✅ Quality scores present');
    } else {
      console.log('⚠️  No quality scores found');
    }
    console.log('');

    // Test 5: Check data sizes
    console.log('💾 Test 5: Checking data sizes...');
    for (const row of result.rows) {
      const sizeKB = Math.round(row.data_size_bytes / 1024);
      const status = sizeKB > 0 ? '✅' : '❌';
      console.log(`${status} ${row.analysis_type.padEnd(15)} - Size: ${sizeKB} KB`);
    }
    console.log('');

    // Test 6: Verify data structure
    console.log('🔍 Test 6: Verifying data structure...');
    const detailedResult = await query(
      `SELECT analysis_type, data
      FROM ucie_analysis_cache
      WHERE symbol = $1
      ORDER BY analysis_type`,
      [symbol.toUpperCase()]
    );

    for (const row of detailedResult.rows) {
      const data = row.data;
      const hasSuccess = data && typeof data.success !== 'undefined';
      const status = hasSuccess ? '✅' : '❌';
      
      console.log(`${status} ${row.analysis_type.padEnd(15)} - Has 'success' field: ${hasSuccess}`);
      
      if (hasSuccess && data.success) {
        // Check for type-specific fields
        switch (row.analysis_type) {
          case 'market-data':
            console.log(`   - Has priceAggregation: ${!!data.priceAggregation}`);
            break;
          case 'sentiment':
            console.log(`   - Has sentiment: ${!!data.sentiment}`);
            break;
          case 'technical':
            console.log(`   - Has indicators: ${!!data.indicators}`);
            break;
          case 'news':
            console.log(`   - Has articles: ${!!data.articles} (${data.articles?.length || 0} articles)`);
            break;
          case 'on-chain':
            console.log(`   - Has dataQuality: ${!!data.dataQuality}`);
            break;
        }
      }
    }
    console.log('');

    // Test 7: Check user tracking
    console.log('👤 Test 7: Checking user tracking...');
    const uniqueUsers = new Set(result.rows.map(row => row.user_email));
    console.log(`Found ${uniqueUsers.size} unique user(s):`);
    for (const email of uniqueUsers) {
      const count = result.rows.filter(row => row.user_email === email).length;
      console.log(`  - ${email}: ${count} entries`);
    }
    console.log('');

    // Summary
    console.log('=' .repeat(60));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total entries: ${result.rows.length}`);
    console.log(`Expected types: ${expectedTypes.length}`);
    console.log(`Found types: ${foundTypes.length}`);
    console.log(`Missing types: ${missingTypes.length}`);
    console.log(`Fresh data: ${allFresh ? 'Yes' : 'No'}`);
    console.log(`Quality scores: ${hasQualityScores ? 'Yes' : 'No'}`);
    console.log('');

    if (result.rows.length >= 3 && missingTypes.length === 0 && allFresh) {
      console.log('✅ VERIFICATION PASSED');
      console.log('All data is correctly stored in Supabase database');
      process.exit(0);
    } else {
      console.log('⚠️  VERIFICATION INCOMPLETE');
      console.log('Some data may be missing or stale');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
verifyStorage();
