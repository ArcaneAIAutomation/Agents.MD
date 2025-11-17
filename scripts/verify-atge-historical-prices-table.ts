/**
 * Verify ATGE Historical Prices Table Exists
 * 
 * This script checks if the atge_historical_prices table exists in the database
 * and displays its schema if it does.
 */

import { query, testConnection } from '../lib/db';

async function verifyHistoricalPricesTable() {
  console.log('🔍 Verifying ATGE Historical Prices Table...\n');

  try {
    // Test database connection first
    console.log('1️⃣ Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful\n');

    // Check if atge_historical_prices table exists
    console.log('2️⃣ Checking if atge_historical_prices table exists...');
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'atge_historical_prices'
      ) as table_exists;
    `;
    
    const tableCheckResult = await query(tableCheckQuery);
    const tableExists = tableCheckResult.rows[0]?.table_exists;

    if (!tableExists) {
      console.log('❌ Table atge_historical_prices does NOT exist');
      console.log('\n📋 Note: The migration file shows trade_historical_prices exists.');
      console.log('   The task requires atge_historical_prices (different name).');
      console.log('\n💡 Next steps:');
      console.log('   1. Create migration file: migrations/005_create_atge_historical_prices.sql');
      console.log('   2. Run the migration to create the table');
      process.exit(1);
    }

    console.log('✅ Table atge_historical_prices EXISTS\n');

    // Get table schema
    console.log('3️⃣ Fetching table schema...');
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'atge_historical_prices'
      ORDER BY ordinal_position;
    `;
    
    const schemaResult = await query(schemaQuery);
    
    console.log('\n📊 Table Schema:');
    console.log('─'.repeat(80));
    schemaResult.rows.forEach((col: any) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const type = col.character_maximum_length 
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;
      console.log(`  ${col.column_name.padEnd(25)} ${type.padEnd(20)} ${nullable}`);
    });
    console.log('─'.repeat(80));

    // Get indexes
    console.log('\n4️⃣ Fetching indexes...');
    const indexQuery = `
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'atge_historical_prices'
      ORDER BY indexname;
    `;
    
    const indexResult = await query(indexQuery);
    
    if (indexResult.rows.length > 0) {
      console.log('\n📇 Indexes:');
      console.log('─'.repeat(80));
      indexResult.rows.forEach((idx: any) => {
        console.log(`  ${idx.indexname}`);
        console.log(`    ${idx.indexdef}`);
        console.log('');
      });
      console.log('─'.repeat(80));
    } else {
      console.log('⚠️  No indexes found on atge_historical_prices table');
    }

    // Get row count
    console.log('\n5️⃣ Checking row count...');
    const countQuery = 'SELECT COUNT(*) as count FROM atge_historical_prices';
    const countResult = await query(countQuery);
    const rowCount = countResult.rows[0]?.count || 0;
    
    console.log(`📊 Current row count: ${rowCount}`);

    console.log('\n✅ Verification complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Table exists: ✅`);
    console.log(`   - Columns: ${schemaResult.rows.length}`);
    console.log(`   - Indexes: ${indexResult.rows.length}`);
    console.log(`   - Rows: ${rowCount}`);

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    process.exit(1);
  }
}

// Run verification
verifyHistoricalPricesTable()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
