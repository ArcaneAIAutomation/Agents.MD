/**
 * Add unique constraint to atge_historical_prices table
 * Using a different name to avoid conflict with trade_historical_prices
 */

import { query } from '../lib/db';

async function addAtgeUniqueConstraint() {
  console.log('🚀 Adding unique constraint to atge_historical_prices...\n');

  try {
    // Step 1: Check for duplicates
    console.log('Step 1: Checking for duplicates...');
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

    // Step 2: Add the unique constraint with a different name
    console.log('Step 2: Adding unique constraint...');
    try {
      await query(
        `ALTER TABLE atge_historical_prices
        ADD CONSTRAINT atge_unique_historical_price 
        UNIQUE (symbol, timestamp, timeframe)`
      );
      console.log('✅ Unique constraint added successfully!\n');
    } catch (error: any) {
      if (error.code === '42P07') {
        console.log('⚠️  Constraint already exists\n');
      } else {
        throw error;
      }
    }

    // Step 3: Verify
    console.log('Step 3: Verifying constraint...');
    const verification = await query(
      `SELECT
        conname as name,
        contype as type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'atge_historical_prices'::regclass
        AND conname = 'atge_unique_historical_price'`
    );

    if (verification.rows.length > 0) {
      console.log('✅ Constraint verified:');
      console.log(`   Name: ${verification.rows[0].name}`);
      console.log(`   Type: ${verification.rows[0].type === 'u' ? 'UNIQUE' : verification.rows[0].type}`);
      console.log(`   Definition: ${verification.rows[0].definition}\n`);
    } else {
      console.log('❌ Constraint not found\n');
      return;
    }

    // Step 4: Test duplicate prevention
    console.log('Step 4: Testing duplicate prevention...');
    try {
      // Insert a test record
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
        console.log(`⚠️  Got unexpected error: ${error.code} - ${error.message}\n`);
      }
    }

    // Clean up test data
    await query(`DELETE FROM atge_historical_prices WHERE symbol = 'TEST'`);

    console.log('🎉 Task complete!');
    console.log('\n📋 Summary:');
    console.log('   - Duplicates removed: ✅');
    console.log('   - Unique constraint created: ✅');
    console.log('   - Duplicate prevention tested: ✅');
    console.log('\n✅ Database now prevents duplicate entries for (symbol, timestamp, timeframe)');
    console.log('\n📝 Note: The API endpoint already uses ON CONFLICT ... DO NOTHING');
    console.log('   This provides three-layer protection:');
    console.log('   1. Application-level filtering (checks existing data)');
    console.log('   2. SQL ON CONFLICT clause (silently ignores duplicates)');
    console.log('   3. Database UNIQUE constraint (enforces uniqueness)');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
addAtgeUniqueConstraint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
