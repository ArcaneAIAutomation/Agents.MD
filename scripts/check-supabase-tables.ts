/**
 * Check Supabase Database Tables
 * Verifies all required tables exist for UCIE analysis
 */

import { query } from '../lib/db';

async function checkSupabaseTables() {
  console.log('🔍 Checking Supabase Database Tables...\n');

  try {
    // Get all tables in public schema
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Current Tables in Supabase:');
    console.log('═══════════════════════════════════════\n');
    
    const tables = result.rows.map((r: any) => r.table_name);
    tables.forEach((table: string) => {
      console.log(`  ✅ ${table}`);
    });

    console.log(`\n📈 Total Tables: ${tables.length}\n`);

    // Check for required UCIE tables
    const requiredTables = [
      'ucie_analysis_cache',
      'ucie_phase_data',
      'ucie_watchlist',
      'ucie_alerts',
      'users',
      'access_codes',
      'sessions',
      'auth_logs'
    ];

    console.log('🔍 Checking Required Tables:');
    console.log('═══════════════════════════════════════\n');

    const missingTables: string[] = [];
    
    requiredTables.forEach(table => {
      if (tables.includes(table)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - MISSING`);
        missingTables.push(table);
      }
    });

    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing ${missingTables.length} required tables:`);
      missingTables.forEach(table => console.log(`     - ${table}`));
      console.log('\n💡 Run migration scripts to create missing tables');
    } else {
      console.log('\n✅ All required tables exist!');
    }

    // Check table row counts
    console.log('\n📊 Table Row Counts:');
    console.log('═══════════════════════════════════════\n');

    for (const table of tables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult.rows[0].count;
        console.log(`  ${table}: ${count} rows`);
      } catch (error) {
        console.log(`  ${table}: Error counting rows`);
      }
    }

    console.log('\n✅ Database check complete!\n');

  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkSupabaseTables();
