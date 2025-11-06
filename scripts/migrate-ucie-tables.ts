#!/usr/bin/env tsx
/**
 * UCIE Tables Migration
 * Creates UCIE-specific database tables
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

async function migrateUCIETables() {
  console.log('\n============================================================');
  console.log('🔧 UCIE Database Migration');
  console.log('   Creating UCIE-specific tables');
  console.log('============================================================\n');

  try {
    // Read the UCIE migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '002_ucie_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Executing UCIE migration SQL...\n');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'ucie_%'
      ORDER BY table_name;
    `;
    
    const tables = await query(tablesQuery);
    
    console.log(`✅ Created/verified ${tables.rows.length} UCIE tables:`);
    tables.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('\n============================================================');
    console.log('✅ UCIE Database Migration Complete');
    console.log('============================================================\n');
    
    console.log('Next step: Test database with UCIE data');
    console.log('Run: npx tsx scripts/test-ucie-database.ts\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

migrateUCIETables();
