/**
 * Run ATGE Historical Prices Migration
 * 
 * This script runs the migration to create the atge_historical_prices table
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query, testConnection } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running ATGE Historical Prices Migration...\n');

  try {
    // Test database connection first
    console.log('1️⃣ Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful\n');

    // Read migration file
    console.log('2️⃣ Reading migration file...');
    const migrationPath = join(process.cwd(), 'migrations', '005_create_atge_historical_prices.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration file loaded\n');

    // Execute migration
    console.log('3️⃣ Executing migration...');
    console.log('   Creating atge_historical_prices table...');
    
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully\n');

    // Verify table was created
    console.log('4️⃣ Verifying table creation...');
    const verifyQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'atge_historical_prices'
      ) as table_exists;
    `;
    
    const verifyResult = await query(verifyQuery);
    const tableExists = verifyResult.rows[0]?.table_exists;

    if (!tableExists) {
      console.error('❌ Table verification failed - table does not exist');
      process.exit(1);
    }

    console.log('✅ Table atge_historical_prices created successfully\n');

    // Get column count
    const columnQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'atge_historical_prices';
    `;
    
    const columnResult = await query(columnQuery);
    const columnCount = columnResult.rows[0]?.count || 0;

    // Get index count
    const indexQuery = `
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'atge_historical_prices';
    `;
    
    const indexResult = await query(indexQuery);
    const indexCount = indexResult.rows[0]?.count || 0;

    console.log('📊 Migration Summary:');
    console.log('─'.repeat(60));
    console.log(`   Table: atge_historical_prices`);
    console.log(`   Columns: ${columnCount}`);
    console.log(`   Indexes: ${indexCount}`);
    console.log(`   Status: ✅ Created`);
    console.log('─'.repeat(60));

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
