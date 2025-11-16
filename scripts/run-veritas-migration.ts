/**
 * Run Veritas Alerts Table Migration
 * 
 * This script creates the veritas_alerts table in the database.
 * 
 * Usage:
 *   npx tsx scripts/run-veritas-migration.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query, testConnection } from '../lib/db';

async function runMigration() {
  console.log('🚀 Starting Veritas Alerts Table Migration...\n');
  
  // Test database connection
  console.log('📡 Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('❌ Database connection failed. Please check your DATABASE_URL environment variable.');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful\n');
  
  // Read migration file
  console.log('📄 Reading migration file...');
  const migrationPath = join(process.cwd(), 'migrations', '005_veritas_alerts.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  console.log('✅ Migration file loaded\n');
  
  // Execute migration
  console.log('⚙️  Executing migration...');
  
  try {
    // Execute the entire migration as one transaction
    await query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verify table was created
    console.log('🔍 Verifying table creation...');
    const result = await query(`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'veritas_alerts'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table verified:');
      console.log(`   - ${result.rows.length} columns created`);
      console.log(`   - Columns: ${result.rows.map((r: any) => r.column_name).join(', ')}`);
    } else {
      console.error('❌ Table verification failed - no columns found');
      process.exit(1);
    }
    
    // Check indexes
    console.log('\n🔍 Verifying indexes...');
    const indexResult = await query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'veritas_alerts'
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('✅ Indexes verified:');
      indexResult.rows.forEach((row: any) => {
        console.log(`   - ${row.indexname}`);
      });
    }
    
    console.log('\n🎉 Veritas Alerts table is ready!\n');
    console.log('Next steps:');
    console.log('  1. The alert system is now ready to use');
    console.log('  2. Alerts will be stored in the veritas_alerts table');
    console.log('  3. Email notifications will be sent to no-reply@arcane.group');
    console.log('  4. Access the admin dashboard at /admin/veritas-alerts (to be created)\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
