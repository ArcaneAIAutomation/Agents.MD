/**
 * Run ATGE Display Fields Migration
 * 
 * Adds data quality fields to trade_results table
 * Usage: npx tsx scripts/run-atge-display-fields-migration.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import { query, testConnection } from '../lib/db';

config({ path: '.env.local' });

async function runMigration() {
  console.log('\n🚀 Running ATGE Display Fields Migration...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Database connection failed');
      console.error('   Check your DATABASE_URL in .env.local');
      process.exit(1);
    }
    
    console.log('✅ Database connected\n');

    // Read migration file
    const migrationPath = resolve(process.cwd(), 'migrations/004_add_trade_display_fields.sql');
    console.log('📄 Reading migration file...');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration file loaded\n');

    // Execute migration
    console.log('⚙️  Executing migration...');
    await query(migrationSQL);
    console.log('✅ Migration executed successfully\n');

    // Verify columns were added
    console.log('🔍 Verifying migration...');
    const result = await query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'trade_results'
        AND column_name IN ('data_source', 'data_resolution', 'data_quality_score')
      ORDER BY column_name
    `);

    if (result.rows.length === 3) {
      console.log('✅ All 3 columns added successfully:\n');
      result.rows.forEach((row: any) => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
        if (row.column_default) {
          console.log(`     Default: ${row.column_default}`);
        }
      });
    } else {
      console.warn(`⚠️  Only ${result.rows.length} of 3 columns found`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration Complete!\n');
    console.log('Next steps:');
    console.log('1. Update API response mapping (see ATGE-BACKEND-INTEGRATION-GUIDE.md)');
    console.log('2. Test trade detail modal\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runMigration();
