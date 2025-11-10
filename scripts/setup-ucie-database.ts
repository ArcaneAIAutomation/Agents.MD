/**
 * UCIE Database Setup Script
 * 
 * Automatically creates all required tables and initial entries
 * Run this once to set up the complete UCIE database structure
 * 
 * Usage: npx tsx scripts/setup-ucie-database.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

interface MigrationResult {
  migration: string;
  success: boolean;
  error?: string;
}

async function setupUCIEDatabase() {
  console.log('🚀 Starting UCIE Database Setup...\n');
  
  const results: MigrationResult[] = [];
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // List of migrations to run in order
    const migrations = [
      '005_openai_caesar_tables.sql',
      '006_add_ai_provider_column.sql'
    ];
    
    // Run each migration
    for (const migrationFile of migrations) {
      console.log(`📄 Running migration: ${migrationFile}`);
      
      try {
        // Read migration file
        const migrationPath = join(process.cwd(), 'migrations', migrationFile);
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        // Execute migration
        await query(migrationSQL);
        
        console.log(`✅ Migration ${migrationFile} completed successfully\n`);
        results.push({
          migration: migrationFile,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ Migration ${migrationFile} failed:`, error);
        results.push({
          migration: migrationFile,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Continue with other migrations even if one fails
      }
    }
    
    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_name IN (
          'ucie_analysis_cache',
          'ucie_phase_data',
          'ucie_watchlist',
          'ucie_alerts',
          'ucie_openai_analysis',
          'ucie_caesar_research'
        )
      ORDER BY table_name
    `);
    
    console.log('\n📊 Database Tables:');
    const expectedTables = [
      'ucie_analysis_cache',
      'ucie_phase_data',
      'ucie_watchlist',
      'ucie_alerts',
      'ucie_openai_analysis',
      'ucie_caesar_research'
    ];
    
    const existingTables = tableCheck.rows.map(row => row.table_name);
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (MISSING)`);
      }
    }
    
    // Check indexes
    console.log('\n🔍 Verifying indexes...');
    const indexCheck = await query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename LIKE 'ucie_%'
      ORDER BY tablename, indexname
    `);
    
    console.log(`\n📊 Found ${indexCheck.rows.length} indexes:`);
    indexCheck.rows.forEach(row => {
      console.log(`   ✅ ${row.tablename}.${row.indexname}`);
    });
    
    // Create sample entries for testing
    console.log('\n🧪 Creating sample test entries...');
    
    try {
      // Sample cache entry
      await query(`
        INSERT INTO ucie_analysis_cache (
          symbol, analysis_type, data, data_quality_score, user_id, expires_at
        ) VALUES (
          'BTC', 'market-data', '{"price": 95000, "volume": 1000000}', 100, 'system', NOW() + INTERVAL '1 hour'
        )
        ON CONFLICT (symbol, analysis_type, user_id) DO NOTHING
      `);
      console.log('   ✅ Sample cache entry created');
      
      // Sample OpenAI analysis
      await query(`
        INSERT INTO ucie_openai_analysis (
          symbol, user_id, summary_text, data_quality_score, api_status, ai_provider
        ) VALUES (
          'BTC', 'system', 'Sample OpenAI analysis for Bitcoin', 100, '{"marketData": true}', 'openai'
        )
        ON CONFLICT (symbol, user_id) DO NOTHING
      `);
      console.log('   ✅ Sample OpenAI analysis created');
      
      // Sample Caesar research
      await query(`
        INSERT INTO ucie_caesar_research (
          symbol, user_id, job_id, status, research_data, executive_summary, recommendation, confidence_score
        ) VALUES (
          'BTC', 'system', 'sample-job-123', 'completed', '{"content": "Sample research"}', 
          'Sample executive summary for Bitcoin', 'HOLD', 85
        )
        ON CONFLICT (symbol, user_id) DO NOTHING
      `);
      console.log('   ✅ Sample Caesar research created');
      
    } catch (error) {
      console.error('   ⚠️  Sample entries may already exist or failed:', error);
    }
    
    // Get table statistics
    console.log('\n📊 Table Statistics:');
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        try {
          const countResult = await query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = countResult.rows[0].count;
          console.log(`   ${table}: ${count} rows`);
        } catch (error) {
          console.log(`   ${table}: Error getting count`);
        }
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SETUP SUMMARY');
    console.log('='.repeat(60));
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`\n✅ Successful migrations: ${successCount}/${results.length}`);
    if (failCount > 0) {
      console.log(`❌ Failed migrations: ${failCount}/${results.length}`);
      console.log('\nFailed migrations:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.migration}: ${r.error}`);
      });
    }
    
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log('\n✅ All required tables exist');
    }
    
    console.log(`\n✅ Total indexes: ${indexCheck.rows.length}`);
    
    if (missingTables.length === 0 && failCount === 0) {
      console.log('\n🎉 UCIE DATABASE SETUP COMPLETE!');
      console.log('\n📋 Next steps:');
      console.log('   1. Test the database: npx tsx scripts/test-ucie-database.ts');
      console.log('   2. Run data replacement test: npx tsx scripts/test-data-replacement.ts');
      console.log('   3. Start using UCIE endpoints');
    } else {
      console.log('\n⚠️  SETUP COMPLETED WITH WARNINGS');
      console.log('   Please review the errors above and fix any issues');
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during database setup:', error);
    process.exit(1);
  }
}

// Run setup
setupUCIEDatabase().then(() => {
  console.log('\n✅ Setup script completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Setup script failed:', error);
  process.exit(1);
});
