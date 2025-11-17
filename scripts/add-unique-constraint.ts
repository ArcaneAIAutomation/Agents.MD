/**
 * Add unique constraint to atge_historical_prices table
 * This ensures no duplicate entries for the same symbol, timestamp, and timeframe
 */

import { query } from '../lib/db';

async function addUniqueConstraint() {
  console.log('🚀 Adding unique constraint to atge_historical_prices...\n');

  try {
    // First, check if there are any existing duplicates
    console.log('Step 1: Checking for existing duplicates...');
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
      console.log(`⚠️  Found ${duplicates.rows.length} duplicate entries. Removing duplicates first...\n`);
      
      // Remove duplicates, keeping only the oldest entry (by created_at)
      for (const dup of duplicates.rows) {
        console.log(`  Removing duplicates for ${dup.symbol} at ${dup.timestamp} (${dup.timeframe})...`);
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

    // Now add the unique constraint
    console.log('Step 2: Adding unique constraint...');
    try {
      await query(
        `ALTER TABLE atge_historical_prices
        ADD CONSTRAINT unique_historical_price 
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

    // Verify the constraint
    console.log('Step 3: Verifying constraint...');
    const verification = await query(
      `SELECT
        conname as name,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'atge_historical_prices'::regclass
        AND conname = 'unique_historical_price'`
    );

    if (verification.rows.length > 0) {
      console.log('✅ Constraint verified:');
      console.log(`   Name: ${verification.rows[0].name}`);
      console.log(`   Definition: ${verification.rows[0].definition}\n`);
    } else {
      console.log('❌ Constraint not found after adding\n');
    }

    console.log('🎉 Task complete!');
    console.log('\n📋 Summary:');
    console.log('   - Duplicates removed: ✅');
    console.log('   - Unique constraint added: ✅');
    console.log('   - Database now prevents duplicate entries');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
addUniqueConstraint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
