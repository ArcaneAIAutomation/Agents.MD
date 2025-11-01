#!/usr/bin/env tsx
/**
 * Reset Test Account and Access Codes
 * Removes specific user and resets all access codes for testing
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function resetTestAccount() {
  console.log('\n============================================================');
  console.log('🔧 Reset Test Account & Access Codes');
  console.log('============================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  try {
    // 1. Delete morgan@arcane.group account
    console.log('🗑️  Deleting morgan@arcane.group account...');
    const deleteResult = await pool.query(
      "DELETE FROM users WHERE email = 'morgan@arcane.group' RETURNING id, email"
    );

    if (deleteResult.rows.length > 0) {
      console.log(`✅ Deleted user: ${deleteResult.rows[0].email}`);
      console.log(`   User ID: ${deleteResult.rows[0].id}\n`);
    } else {
      console.log('⚠️  User not found (may already be deleted)\n');
    }

    // 2. Delete all sessions for deleted user
    console.log('🗑️  Cleaning up sessions...');
    await pool.query("DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)");
    console.log('✅ Sessions cleaned up\n');

    // 3. Reset ALL access codes (mark as unredeemed)
    // Must set all three fields together to satisfy constraint
    console.log('🔄 Resetting all access codes...');
    const resetResult = await pool.query(`
      UPDATE access_codes 
      SET redeemed = FALSE,
          redeemed_by = NULL,
          redeemed_at = NULL
      WHERE redeemed = TRUE
      RETURNING code
    `);

    if (resetResult.rows.length > 0) {
      console.log(`✅ Reset ${resetResult.rows.length} access codes:`);
      resetResult.rows.forEach((row: any) => {
        console.log(`   - ${row.code}`);
      });
    } else {
      console.log('✅ All access codes already available');
    }

    console.log('');

    // 4. Show current status
    console.log('📊 Current Status:');
    
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Users: ${usersCount.rows[0].count}`);

    const codesStatus = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE redeemed = FALSE) as available,
        COUNT(*) FILTER (WHERE redeemed = TRUE) as redeemed
      FROM access_codes
    `);
    
    console.log(`   Access Codes:`);
    console.log(`     Total: ${codesStatus.rows[0].total}`);
    console.log(`     Available: ${codesStatus.rows[0].available}`);
    console.log(`     Redeemed: ${codesStatus.rows[0].redeemed}`);

    console.log('\n============================================================');
    console.log('✅ Reset Complete - Ready for Testing');
    console.log('============================================================\n');

    console.log('🧪 Test Flow:');
    console.log('1. Register with morgan@arcane.group');
    console.log('2. Use any access code (all are now available)');
    console.log('3. Check email for verification link');
    console.log('4. Click verification link');
    console.log('5. Login with verified account\n');

  } catch (error: any) {
    console.error('\n❌ Reset failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetTestAccount();
