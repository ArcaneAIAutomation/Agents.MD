/**
 * Release Access Code Script
 * 
 * Releases a specific access code by marking it as unredeemed
 * and optionally removes a user account
 * 
 * Usage: npx tsx scripts/release-access-code.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { query } from '../lib/db';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function releaseAccessCode() {
  console.log('\n🔓 Releasing Access Code\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const accessCode = 'BTC-SOVEREIGN-K3QYMQ-01';
  const userEmail = 'morgan@arcane.group';

  try {
    // Step 1: Check access code status FIRST
    console.log('📋 Step 1: Checking access code status...');
    const codeResult = await query(
      'SELECT id, code, redeemed, redeemed_by, redeemed_at FROM access_codes WHERE code = $1',
      [accessCode]
    );

    if (codeResult.rows.length === 0) {
      console.log(`   ❌ Access code not found: ${accessCode}`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      process.exit(1);
    }

    const code = codeResult.rows[0];
    console.log(`   ✅ Found access code: ${code.code}`);
    console.log(`   Status: ${code.redeemed ? 'Redeemed' : 'Available'}`);
    if (code.redeemed) {
      console.log(`   Redeemed by: ${code.redeemed_by}`);
      console.log(`   Redeemed at: ${code.redeemed_at}`);
    }

    // Step 2: Release access code BEFORE deleting user
    if (code.redeemed) {
      console.log('\n📋 Step 2: Releasing access code...');
      await query(
        'UPDATE access_codes SET redeemed = false, redeemed_by = NULL, redeemed_at = NULL WHERE id = $1',
        [code.id]
      );
      console.log(`   ✅ Access code released: ${accessCode}`);
      console.log(`   Status: Available for use`);
    } else {
      console.log('\n📋 Step 2: Access code already available');
      console.log(`   ℹ️  No action needed`);
    }

    // Step 3: Check if user exists
    console.log('\n📋 Step 3: Checking for existing user...');
    const userResult = await query(
      'SELECT id, email, created_at FROM users WHERE email = $1',
      [userEmail]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`   ✅ Found user: ${user.email} (ID: ${user.id})`);
      console.log(`   Created: ${user.created_at}`);

      // Step 4: Delete user sessions
      console.log('\n📋 Step 4: Deleting user sessions...');
      const sessionResult = await query(
        'DELETE FROM sessions WHERE user_id = $1 RETURNING id',
        [user.id]
      );
      console.log(`   ✅ Deleted ${sessionResult.rowCount} session(s)`);

      // Step 5: Delete user
      console.log('\n📋 Step 5: Deleting user account...');
      await query('DELETE FROM users WHERE id = $1', [user.id]);
      console.log(`   ✅ User account deleted: ${user.email}`);
    } else {
      console.log(`   ℹ️  No user found with email: ${userEmail}`);
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ SUCCESS! Access code released and user removed\n');
    console.log('📋 Summary:');
    console.log(`   Access Code: ${accessCode}`);
    console.log(`   Status: Available`);
    console.log(`   User: ${userEmail} (removed)`);
    console.log('\n💡 You can now register with this access code again!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('❌ ERROR! Failed to release access code\n');
    console.error(error);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

// Run the script
releaseAccessCode();
