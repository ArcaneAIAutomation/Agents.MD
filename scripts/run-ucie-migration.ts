#!/usr/bin/env tsx
/**
 * UCIE Database Migration Runner
 * 
 * Creates all necessary database tables for the Universal Crypto Intelligence Engine
 * 
 * Usage: npx tsx scripts/run-ucie-migration.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  console.log('🚀 Starting UCIE database migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'ucie_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📊 Executing migration...\n');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'ucie_%'
      ORDER BY table_name;
    `);

    if (result.rows.length > 0) {
      console.log('✅ UCIE tables created:');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    } else {
      console.log('⚠️  No UCIE tables found. Migration may have failed.\n');
    }

    // Get table counts
    console.log('📊 Table statistics:\n');

    const tables = ['ucie_analysis_cache', 'ucie_watchlist', 'ucie_alerts', 'ucie_api_costs', 'ucie_analysis_history'];

    for (const table of tables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ${table}: ${countResult.rows[0].count} rows`);
      } catch (error) {
        console.log(`   ${table}: Table not found or error`);
      }
    }

    console.log('\n✅ UCIE database migration complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify tables in Supabase dashboard');
    console.log('   2. Test UCIE API endpoints');
    console.log('   3. Monitor cache performance');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();
