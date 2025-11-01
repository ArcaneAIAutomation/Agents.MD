#!/usr/bin/env tsx
/**
 * Simple Reset - Delete user and unredeemed access codes
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';

config({ path: resolve(process.cwd(), '.env.local') });

async function simpleReset() {
  console.log('\n🔧 Simple Reset\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  try {
    // Step 1: Get user ID first
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = 'morgan@arcane.group'"
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      console.log(`Found user: ${userId}`);

      // Step 2: Unredeemed access codes used by this user
      console.log('Unredeemed access codes...');
      await pool.query(
        "UPDATE access_codes SET redeemed = FALSE, redeemed_by = NULL, redeemed_at = NULL WHERE redeemed_by = $1",
        [userId]
      );
      console.log('✅ Access codes reset');

      // Step 3: Delete sessions
      console.log('Deleting sessions...');
      await pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
      console.log('✅ Sessions deleted');

      // Step 4: Delete user
      console.log('Deleting user...');
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      console.log('✅ User deleted');
    } else {
      console.log('⚠️  User not found');
    }

    // Show status
    const codes = await pool.query(
      "SELECT COUNT(*) FILTER (WHERE redeemed = FALSE) as available FROM access_codes"
    );
    console.log(`\n✅ Available access codes: ${codes.rows[0].available}\n`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

simpleReset();
