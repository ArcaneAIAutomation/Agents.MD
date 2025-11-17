import { query } from '../lib/db';

async function checkATGEIndexes() {
  console.log('🔍 Checking indexes on atge_historical_prices table...\n');
  
  try {
    // Check if table exists
    const tableCheck = await query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'atge_historical_prices'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Table atge_historical_prices does not exist');
      console.log('   Run migration: npx tsx scripts/run-migrations.ts');
      process.exit(1);
    }
    
    console.log('✅ Table atge_historical_prices exists\n');
    
    // Check indexes
    const indexCheck = await query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'atge_historical_prices'
      ORDER BY indexname
    `);
    
    if (indexCheck.rows.length === 0) {
      console.log('❌ No indexes found on atge_historical_prices table');
      console.log('   Indexes need to be created');
      process.exit(1);
    }
    
    console.log(`✅ Found ${indexCheck.rows.length} indexes:\n`);
    
    indexCheck.rows.forEach((row: any, index: number) => {
      console.log(`${index + 1}. ${row.indexname}`);
      console.log(`   ${row.indexdef}\n`);
    });
    
    // Check for required indexes
    const requiredIndexes = [
      'idx_historical_prices_lookup',
      'idx_historical_prices_symbol_timeframe'
    ];
    
    const foundIndexes = indexCheck.rows.map((row: any) => row.indexname);
    const missingIndexes = requiredIndexes.filter(idx => !foundIndexes.includes(idx));
    
    if (missingIndexes.length > 0) {
      console.log('⚠️  Missing required indexes:');
      missingIndexes.forEach(idx => console.log(`   - ${idx}`));
      process.exit(1);
    }
    
    console.log('✅ All required indexes are present!');
    console.log('\nRequired indexes:');
    console.log('  ✓ idx_historical_prices_lookup (symbol, timestamp, timeframe)');
    console.log('  ✓ idx_historical_prices_symbol_timeframe (symbol, timeframe)');
    
  } catch (error) {
    console.error('❌ Error checking indexes:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkATGEIndexes();
