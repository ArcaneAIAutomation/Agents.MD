#!/usr/bin/env tsx
/**
 * Simple Database Migration
 * Creates authentication tables without strict validation
 */

import { query } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function simpleMigrate() {
  console.log('\n============================================================');
  console.log('🔧 Bitcoin Sovereign Technology');
  console.log('   Simple Database Migration');
  console.log('============================================================\n');

  try {
    // Read the clean migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '001_initial_schema_clean.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Executing migration SQL...\n');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'access_codes', 'sessions', 'auth_logs')
      ORDER BY table_name;
    `;
    
    const tables = await query(tablesQuery);
    
    console.log(`✅ Created ${tables.rows.length} tables:`);
    tables.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('\n============================================================');
    console.log('✅ Database Migration Complete');
    console.log('============================================================\n');
    
    console.log('Next step: Import access codes');
    console.log('Run: npx tsx scripts/import-access-codes.ts\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

simpleMigrate();
