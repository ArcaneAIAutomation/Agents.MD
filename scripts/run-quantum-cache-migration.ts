/**
 * Run Quantum API Cache Migration
 * 
 * Creates the quantum_api_cache table in production database.
 * This is a critical fix to enable caching for the Quantum BTC system.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running Quantum API Cache Migration...');
  console.log('=' .repeat(60));
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations', 'quantum-btc', '007_create_api_cache_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded');
    console.log('🔧 Executing SQL...');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully!');
    console.log('');
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const verifyResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quantum_api_cache'
      )
    `);
    
    if (verifyResult.rows[0].exists) {
      console.log('✅ quantum_api_cache table exists!');
      
      // Check table structure
      const columnsResult = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'quantum_api_cache'
        ORDER BY ordinal_position
      `);
      
      console.log('');
      console.log('📊 Table Structure:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
      
      console.log('');
      console.log('🎉 MIGRATION COMPLETE - CACHE SYSTEM READY!');
      console.log('=' .repeat(60));
      console.log('✅ The Quantum BTC system can now use database caching');
      console.log('✅ 5-minute TTL caching will reduce API calls');
      console.log('✅ Performance will improve significantly');
      console.log('');
      console.log('🚀 Ready to generate trades with real data!');
      
      process.exit(0);
    } else {
      console.error('❌ Table was not created!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check DATABASE_URL environment variable');
    console.error('   2. Verify database connection');
    console.error('   3. Check migration file syntax');
    console.error('   4. Ensure database user has CREATE TABLE permissions');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('💥 Script crashed:', error);
    process.exit(1);
  });
}

export { runMigration };
