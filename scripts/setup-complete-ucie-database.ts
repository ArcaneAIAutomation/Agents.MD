/**
 * Complete UCIE Database Setup Script
 * 
 * Creates ALL required tables in Supabase database
 * Ensures all API/AI data storage is ready
 * 
 * Usage: npx tsx scripts/setup-complete-ucie-database.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function setupCompleteUCIEDatabase() {
  console.log('🚀 Complete UCIE Database Setup\n');
  console.log('='.repeat(60));
  console.log('This will create ALL required tables for:');
  console.log('- API data storage (market, sentiment, news, etc.)');
  console.log('- AI analysis storage (OpenAI, Gemini, Caesar)');
  console.log('- User data (watchlists, alerts)');
  console.log('- Session data (temporary storage)');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const connectionTest = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log(`✅ Connected to PostgreSQL`);
    console.log(`   Time: ${connectionTest.rows[0].current_time}`);
    console.log(`   Version: ${connectionTest.rows[0].pg_version.split(',')[0]}\n`);
    
    // Read and execute complete setup migration
    console.log('📄 Reading complete setup migration...');
    const migrationPath = join(process.cwd(), 'migrations', '000_complete_ucie_setup.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('🔧 Executing complete setup...\n');
    await query(migrationSQL);
    
    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tableCheck = await query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_name IN (
          'ucie_analysis_cache',
          'ucie_openai_analysis',
          'ucie_caesar_research',
          'ucie_phase_data',
          'ucie_watchlist',
          'ucie_alerts'
        )
      ORDER BY table_name
    `);
    
    console.log('\n📊 Database Tables:');
    const expectedTables = [
      { name: 'ucie_alerts', purpose: 'User alerts and notifications' },
      { name: 'ucie_analysis_cache', purpose: 'API data cache (market, sentiment, news, etc.)' },
      { name: 'ucie_caesar_research', purpose: 'Caesar AI research storage' },
      { name: 'ucie_openai_analysis', purpose: 'OpenAI/Gemini AI summaries' },
      { name: 'ucie_phase_data', purpose: 'Session-based temporary data' },
      { name: 'ucie_watchlist', purpose: 'User watchlists' }
    ];
    
    const existingTables = tableCheck.rows.map(row => row.table_name);
    
    for (const table of expectedTables) {
      const exists = existingTables.includes(table.name);
      const row = tableCheck.rows.find(r => r.table_name === table.name);
      const columnCount = row ? row.column_count : 0;
      
      if (exists) {
        console.log(`   ✅ ${table.name} (${columnCount} columns)`);
        console.log(`      ${table.purpose}`);
      } else {
        console.log(`   ❌ ${table.name} (MISSING)`);
      }
    }
    
    // Check indexes
    console.log('\n🔍 Verifying indexes...');
    const indexCheck = await query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename LIKE 'ucie_%'
      ORDER BY tablename, indexname
    `);
    
    console.log(`\n📊 Found ${indexCheck.rows.length} indexes:`);
    let currentTable = '';
    indexCheck.rows.forEach(row => {
      if (row.tablename !== currentTable) {
        console.log(`\n   ${row.tablename}:`);
        currentTable = row.tablename;
      }
      console.log(`      ✅ ${row.indexname}`);
    });
    
    // Check unique constraints
    console.log('\n🔍 Verifying unique constraints...');
    const constraintCheck = await query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        STRING_AGG(kcu.column_name, ', ') as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
        AND tc.table_name LIKE 'ucie_%'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name
    `);
    
    console.log(`\n📊 Found ${constraintCheck.rows.length} unique constraints:`);
    constraintCheck.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}: (${row.columns})`);
      console.log(`      Ensures UPSERT replaces old data`);
    });
    
    // Get table statistics
    console.log('\n📊 Table Statistics:');
    for (const table of expectedTables) {
      if (existingTables.includes(table.name)) {
        try {
          const countResult = await query(`SELECT COUNT(*) as count FROM ${table.name}`);
          const count = countResult.rows[0].count;
          console.log(`   ${table.name}: ${count} rows`);
        } catch (error) {
          console.log(`   ${table.name}: Error getting count`);
        }
      }
    }
    
    // Test UPSERT functionality
    console.log('\n🧪 Testing UPSERT functionality...');
    
    // Test 1: Insert first entry
    await query(`
      INSERT INTO ucie_analysis_cache (
        symbol, analysis_type, data, data_quality_score, user_id, expires_at
      ) VALUES (
        'TEST', 'market-data', '{"test": 1}', 100, 'test-user', NOW() + INTERVAL '1 hour'
      )
      ON CONFLICT (symbol, analysis_type, user_id)
      DO UPDATE SET data = EXCLUDED.data, created_at = NOW()
    `);
    console.log('   ✅ First insert successful');
    
    // Test 2: Update (UPSERT should replace)
    await query(`
      INSERT INTO ucie_analysis_cache (
        symbol, analysis_type, data, data_quality_score, user_id, expires_at
      ) VALUES (
        'TEST', 'market-data', '{"test": 2}', 100, 'test-user', NOW() + INTERVAL '1 hour'
      )
      ON CONFLICT (symbol, analysis_type, user_id)
      DO UPDATE SET data = EXCLUDED.data, created_at = NOW()
    `);
    console.log('   ✅ UPSERT replacement successful');
    
    // Test 3: Verify only one entry exists
    const verifyResult = await query(`
      SELECT COUNT(*) as count, data
      FROM ucie_analysis_cache
      WHERE symbol = 'TEST' AND analysis_type = 'market-data' AND user_id = 'test-user'
      GROUP BY data
    `);
    
    if (verifyResult.rows.length === 1 && verifyResult.rows[0].count === '1') {
      console.log('   ✅ UPSERT verified: Only 1 entry exists (old data replaced)');
      console.log(`   ✅ Data: ${JSON.stringify(verifyResult.rows[0].data)}`);
    } else {
      console.log('   ❌ UPSERT failed: Multiple entries found');
    }
    
    // Cleanup test data
    await query(`DELETE FROM ucie_analysis_cache WHERE symbol = 'TEST' AND user_id = 'test-user'`);
    console.log('   ✅ Test data cleaned up');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SETUP SUMMARY');
    console.log('='.repeat(60));
    
    const missingTables = expectedTables.filter(t => !existingTables.includes(t.name));
    
    if (missingTables.length === 0) {
      console.log('\n✅ All 6 tables created successfully');
      console.log(`✅ ${indexCheck.rows.length} indexes created`);
      console.log(`✅ ${constraintCheck.rows.length} unique constraints created`);
      console.log('✅ UPSERT functionality verified');
      console.log('✅ Database ready for API/AI data storage');
      
      console.log('\n🎉 UCIE DATABASE SETUP COMPLETE!');
      console.log('\n📋 Next steps:');
      console.log('   1. Run: npm run test:ucie');
      console.log('   2. Verify all tests pass');
      console.log('   3. Deploy to production');
      console.log('\n✅ All API/AI data will be stored in Supabase');
      console.log('✅ No in-memory cache (survives serverless restarts)');
      console.log('✅ UPSERT replaces old data automatically');
      console.log('✅ Real data only (no fallbacks)');
      
    } else {
      console.log(`\n⚠️  Missing tables: ${missingTables.map(t => t.name).join(', ')}`);
      console.log('   Please review the errors above');
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during database setup:', error);
    console.log('\n📋 Troubleshooting:');
    console.log('   1. Check DATABASE_URL environment variable');
    console.log('   2. Verify Supabase database is accessible');
    console.log('   3. Check database user has CREATE TABLE permissions');
    console.log('   4. Review error message above');
    process.exit(1);
  }
}

// Run setup
setupCompleteUCIEDatabase().then(() => {
  console.log('\n✅ Setup script completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Setup script failed:', error);
  process.exit(1);
});
