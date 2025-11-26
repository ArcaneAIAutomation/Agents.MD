#!/usr/bin/env tsx
/**
 * Einstein Trade Engine Database Migration
 * Creates Einstein tables for GPT-5.1 powered trade generation
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

async function migrateEinsteinTables() {
  console.log('\n============================================================');
  console.log('🧠 Einstein 100000x Trade Generation Engine');
  console.log('   Database Migration');
  console.log('============================================================\n');

  try {
    // Read the Einstein migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '008_create_einstein_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Executing Einstein migration SQL...\n');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'einstein_trade_signals',
        'einstein_analysis_cache',
        'einstein_performance'
      )
      ORDER BY table_name;
    `;
    
    const tables = await query(tablesQuery);
    
    console.log(`✅ Created ${tables.rows.length} tables:`);
    tables.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');
    
    // Verify indexes were created
    const indexesQuery = `
      SELECT 
        tablename,
        COUNT(*) as index_count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN (
        'einstein_trade_signals',
        'einstein_analysis_cache',
        'einstein_performance'
      )
      GROUP BY tablename
      ORDER BY tablename;
    `;
    
    const indexes = await query(indexesQuery);
    
    console.log('✅ Created indexes:');
    indexes.rows.forEach((row: any) => {
      console.log(`   - ${row.tablename}: ${row.index_count} indexes`);
    });
    console.log('');
    
    // Verify triggers were created
    const triggersQuery = `
      SELECT 
        event_object_table,
        COUNT(*) as trigger_count
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND event_object_table IN (
        'einstein_trade_signals',
        'einstein_analysis_cache',
        'einstein_performance'
      )
      GROUP BY event_object_table
      ORDER BY event_object_table;
    `;
    
    const triggers = await query(triggersQuery);
    
    console.log('✅ Created triggers:');
    triggers.rows.forEach((row: any) => {
      console.log(`   - ${row.event_object_table}: ${row.trigger_count} trigger(s)`);
    });
    console.log('');
    
    // Verify constraints
    const constraintsQuery = `
      SELECT
        tc.table_name,
        tc.constraint_type,
        COUNT(*) as constraint_count
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      AND tc.table_name IN (
        'einstein_trade_signals',
        'einstein_analysis_cache',
        'einstein_performance'
      )
      GROUP BY tc.table_name, tc.constraint_type
      ORDER BY tc.table_name, tc.constraint_type;
    `;
    
    const constraints = await query(constraintsQuery);
    
    console.log('✅ Created constraints:');
    constraints.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name} (${row.constraint_type}): ${row.constraint_count}`);
    });
    console.log('');
    
    console.log('============================================================');
    console.log('✅ Einstein Database Migration Complete');
    console.log('============================================================\n');
    
    console.log('Next steps:');
    console.log('1. Implement data collection module (Task 5)');
    console.log('2. Implement GPT-5.1 analysis engine (Task 13)');
    console.log('3. Create approval workflow manager (Task 26)\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

migrateEinsteinTables();
