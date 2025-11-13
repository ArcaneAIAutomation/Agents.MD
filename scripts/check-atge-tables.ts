/**
 * Check ATGE Tables - Database Inspection Script
 * 
 * This script checks what ATGE tables exist in the database
 * 
 * Usage: npx tsx scripts/check-atge-tables.ts
 */

import { query } from '../lib/db';

async function checkATGETables() {
  console.log('🔍 Checking ATGE Database Tables...\n');

  try {
    // Check for all tables in the database
    console.log('📋 All Tables in Database:');
    const allTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (allTables.rows.length === 0) {
      console.log('   ⚠️  No tables found in database\n');
    } else {
      allTables.rows.forEach((row: any) => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    }

    // Check specifically for ATGE tables
    console.log('🎯 ATGE-Specific Tables:');
    const atgeTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'atge_%'
      ORDER BY table_name
    `);
    
    if (atgeTables.rows.length === 0) {
      console.log('   ⚠️  No ATGE tables found\n');
      console.log('💡 You may need to run migrations first:\n');
      console.log('   npx tsx scripts/run-atge-migrations.ts\n');
    } else {
      atgeTables.rows.forEach((row: any) => {
        console.log(`   ✅ ${row.table_name}`);
      });
      console.log('');
      
      // Count records in each ATGE table
      console.log('📊 Record Counts:');
      for (const row of atgeTables.rows) {
        const tableName = row.table_name;
        const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = countResult.rows[0].count;
        console.log(`   ${tableName}: ${count} records`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  }
}

// Run the check
checkATGETables()
  .then(() => {
    console.log('✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
