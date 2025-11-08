/**
 * Check UCIE Database Status
 * Verifies database connection and checks for UCIE tables
 */

import { testConnection, query } from '../lib/db';

async function checkDatabase() {
  console.log('🔍 Checking UCIE Database Status...\n');
  
  // Test connection
  console.log('1. Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('❌ Database connection failed!');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful\n');
  
  // Check all tables
  console.log('2. Checking all existing tables...');
  const allTables = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log(`\nFound ${allTables.rows.length} tables in database:`);
  allTables.rows.forEach((row: any) => {
    console.log(`  - ${row.table_name}`);
  });
  
  // Check specifically for UCIE tables
  console.log('\n3. Checking for UCIE tables...');
  const ucieTables = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'ucie_%'
    ORDER BY table_name
  `);
  
  const requiredTables = [
    'ucie_analysis_cache',
    'ucie_phase_data',
    'ucie_watchlist',
    'ucie_alerts'
  ];
  
  if (ucieTables.rows.length > 0) {
    console.log(`\n✅ Found ${ucieTables.rows.length} UCIE tables:`);
    ucieTables.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if all required tables exist
    const existingTableNames = ucieTables.rows.map((row: any) => row.table_name);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️ Missing ${missingTables.length} required UCIE tables:`);
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    } else {
      console.log('\n✅ All required UCIE tables exist!');
    }
  } else {
    console.log('\n⚠️ No UCIE tables found!');
    console.log('\nRequired tables:');
    requiredTables.forEach(table => {
      console.log(`  - ${table}`);
    });
    console.log('\n📝 Run migration: migrations/002_ucie_tables.sql');
  }
  
  // Check auth tables (should exist)
  console.log('\n4. Checking authentication tables...');
  const authTables = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'access_codes', 'sessions', 'auth_logs')
    ORDER BY table_name
  `);
  
  if (authTables.rows.length > 0) {
    console.log(`\n✅ Found ${authTables.rows.length} auth tables:`);
    authTables.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });
  } else {
    console.log('\n⚠️ No auth tables found (this is unexpected)');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tables: ${allTables.rows.length}`);
  console.log(`UCIE tables: ${ucieTables.rows.length}/4 required`);
  console.log(`Auth tables: ${authTables.rows.length}/4 expected`);
  
  if (ucieTables.rows.length === 4) {
    console.log('\n✅ Database is ready for UCIE!');
  } else {
    console.log('\n⚠️ Database needs UCIE tables migration');
    console.log('Run: migrations/002_ucie_tables.sql in Supabase dashboard');
  }
  
  process.exit(0);
}

checkDatabase().catch((error) => {
  console.error('❌ Error checking database:', error);
  process.exit(1);
});
