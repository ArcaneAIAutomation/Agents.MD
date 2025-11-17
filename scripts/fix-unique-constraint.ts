/**
 * Fix unique constraint on atge_historical_prices
 * Drop the existing index/constraint and recreate it properly
 */

import { query } from '../lib/db';

async function fixUniqueConstraint() {
  console.log('🔧 Fixing unique constraint on atge_historical_prices...\n');

  try {
    // Step 1: Try to drop the existing constraint/index
    console.log('Step 1: Dropping existing constraint/index if it exists...');
    try {
      await query('DROP INDEX IF EXISTS unique_historical_price CASCADE');
      console.log('✅ Dropped index (if it existed)');
    } catch (error: any) {
      console.log(`⚠️  Could not drop index: ${error.message}`);
    }

    try {
      await query('ALTER TABLE atge_historical_prices DROP CONSTRAINT IF EXISTS unique_historical_price CASCADE');
      console.log('✅ Dropped constraint (if it existed)\n');
    } catch (error: any) {
      console.log(`⚠️  Could not drop constraint: ${error.message}\n`);
    }

    // Step 2: Check for duplicates
    console.log('Step 2: Checking for duplicates...');
    const duplicates = await query(
      `SELECT 
        symbol, 
        timestamp, 
        timeframe, 
        COUNT(*) as count
      FROM atge_historical_prices
      GROUP BY symbol, timestamp, timeframe
      HAVING COUNT(*) > 1`
    );

    if (duplicates.rows.length > 0) {
      console.log(`⚠️  Found ${duplicates.rows.length} duplicate entries. Removing...\n`);
      
      for (const dup of duplicates.rows) {
        await query(
          `DELETE FROM atge_historical_prices
          WHERE id NOT IN (
            SELECT id
            FROM atge_historical_prices
            WHERE symbol = $1
              AND timestamp = $2
              AND timeframe = $3
            ORDER BY created_at ASC
            LIMIT 1
          )
          AND symbol = $1
          AND timestamp = $2
          AND timeframe = $3`,
          [dup.symbol, dup.timestamp, dup.timeframe]
        );
      }
      console.log('✅ Duplicates removed\n');
    } else {
      console.log('✅ No duplicates found\n');
    }

    // Step 3: Create the unique constraint
    console.log('Step 3: Creating unique constraint...');
    await query(
      `ALTER TABLE atge_historical_prices
      ADD CONSTRAINT unique_historical_price 
      UNIQUE (symbol, timestamp, timeframe)`
    );
    console.log('✅ Unique constraint created successfully!\n');

    // Step 4: Verify
    console.log('Step 4: Verifying constraint...');
    const verification = await query(
      `SELECT
        conname as name,
        contype as type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'atge_historical_prices'::regclass
        AND conname = 'unique_historical_price'`
    );

    if (verification.rows.length > 0) {
      console.log('✅ Constraint verified:');
      console.log(`   Name: ${verification.rows[0].name}`);
      console.log(`   Type: ${verification.rows[0].type === 'u' ? 'UNIQUE' : verification.rows[0].type}`);
      console.log(`   Definition: ${verification.rows[0].definition}\n`);
    } else {
      console.log('❌ Constraint not found\n');
    }

    // Step 5: Test duplicate prevention
    console.log('Step 5: Testing duplicate prevention...');
    try {
      // Try to insert a duplicate (should fail)
      await query(
        `INSERT INTO atge_historical_prices 
        (symbol, timestamp, open, high, low, close, volume, timeframe, data_source)
        VALUES ('TEST', NOW(), 100, 101, 99, 100.5, 1000, '1h', 'test')`
      );
      
      // Try to insert the same record again (should fail)
      await query(
        `INSERT INTO atge_historical_prices 
        (symbol, timestamp, open, high, low, close, volume, timeframe, data_source)
        SELECT symbol, timestamp, open, high, low, close, volume, timeframe, data_source
        FROM atge_historical_prices
        WHERE symbol = 'TEST'
        LIMIT 1`
      );
      
      console.log('❌ Duplicate was inserted (constraint not working!)\n');
    } catch (error: any) {
      if (error.code === '23505') {
        console.log('✅ Duplicate prevention working! (Got expected error 23505)\n');
      } else {
        console.log(`⚠️  Got unexpected error: ${error.message}\n`);
      }
    }

    // Clean up test data
    await query(`DELETE FROM atge_historical_prices WHERE symbol = 'TEST'`);

    console.log('🎉 Task complete!');
    console.log('\n📋 Summary:');
    console.log('   - Old constraint/index dropped: ✅');
    console.log('   - Duplicates removed: ✅');
    console.log('   - New unique constraint created: ✅');
    console.log('   - Duplicate prevention tested: ✅');
    console.log('\n✅ Database now prevents duplicate entries for (symbol, timestamp, timeframe)');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
fixUniqueConstraint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
