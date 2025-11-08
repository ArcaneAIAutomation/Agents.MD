/**
 * Revoke All Access Script
 * 
 * This script will:
 * 1. Delete all existing users
 * 2. Invalidate all sessions
 * 3. Mark all old access codes as redeemed (unusable)
 * 4. Generate 10 new access codes
 * 
 * WARNING: This is a destructive operation!
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query, transaction } from '../lib/db';

/**
 * Generate a secure random access code
 */
function generateAccessCode(): string {
  const prefix = 'BTC-SOVEREIGN';
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-2);
  return `${prefix}-${randomPart}${timestamp}`;
}

/**
 * Main function to revoke all access and generate new codes
 */
async function revokeAllAccess() {
  console.log('🚨 REVOKE ALL ACCESS - STARTING\n');
  console.log('⚠️  WARNING: This will delete all users and invalidate all access codes!\n');

  try {
    await transaction(async (client) => {
      // Step 1: Count existing data
      console.log('📊 Current Database Status:');
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      const sessionCount = await client.query('SELECT COUNT(*) as count FROM sessions');
      const codeCount = await client.query('SELECT COUNT(*) as count FROM access_codes WHERE redeemed = FALSE');
      
      console.log(`   Users: ${userCount.rows[0].count}`);
      console.log(`   Active Sessions: ${sessionCount.rows[0].count}`);
      console.log(`   Available Access Codes: ${codeCount.rows[0].count}\n`);

      // Step 2: Delete all auth logs (to avoid foreign key constraints)
      console.log('🗑️  Step 1: Deleting all authentication logs...');
      const deletedLogs = await client.query('DELETE FROM auth_logs');
      console.log(`   ✅ Deleted ${deletedLogs.rowCount} auth log entries\n`);

      // Step 3: Delete all sessions
      console.log('🗑️  Step 2: Invalidating all sessions...');
      const deletedSessions = await client.query('DELETE FROM sessions');
      console.log(`   ✅ Deleted ${deletedSessions.rowCount} sessions\n`);

      // Step 4: Mark all old access codes as redeemed (before deleting users)
      console.log('🔒 Step 3: Marking all old access codes as redeemed...');
      const markedCodes = await client.query(
        `UPDATE access_codes 
         SET redeemed = TRUE, 
             redeemed_at = NOW(),
             redeemed_by = (SELECT id FROM users LIMIT 1)
         WHERE redeemed = FALSE`
      );
      console.log(`   ✅ Marked ${markedCodes.rowCount} codes as redeemed\n`);

      // Step 5: Delete all users (this will cascade to sessions and set access_codes.redeemed_by to NULL)
      // But since we already marked codes as redeemed, we need to delete the codes entirely
      console.log('🗑️  Step 4: Deleting all old access codes...');
      const deletedCodes = await client.query('DELETE FROM access_codes');
      console.log(`   ✅ Deleted ${deletedCodes.rowCount} old access codes\n`);

      // Step 6: Delete all users
      console.log('🗑️  Step 5: Deleting all users...');
      const deletedUsers = await client.query('DELETE FROM users');
      console.log(`   ✅ Deleted ${deletedUsers.rowCount} users\n`);

      // Step 7: Generate 10 new access codes
      console.log('🔑 Step 6: Generating 10 new access codes...');
      const newCodes: string[] = [];
      
      for (let i = 1; i <= 10; i++) {
        const code = generateAccessCode();
        await client.query(
          'INSERT INTO access_codes (code, redeemed) VALUES ($1, FALSE)',
          [code]
        );
        newCodes.push(code);
        console.log(`   ${i}. ${code}`);
      }
      
      console.log(`   ✅ Generated ${newCodes.length} new access codes\n`);

      // Step 8: Verify final state
      console.log('✅ Final Database Status:');
      const finalUserCount = await client.query('SELECT COUNT(*) as count FROM users');
      const finalSessionCount = await client.query('SELECT COUNT(*) as count FROM sessions');
      const finalCodeCount = await client.query('SELECT COUNT(*) as count FROM access_codes WHERE redeemed = FALSE');
      
      console.log(`   Users: ${finalUserCount.rows[0].count}`);
      console.log(`   Active Sessions: ${finalSessionCount.rows[0].count}`);
      console.log(`   Available Access Codes: ${finalCodeCount.rows[0].count}\n`);

      return newCodes;
    });

    console.log('✅ ALL ACCESS REVOKED SUCCESSFULLY!\n');
    console.log('📋 Summary:');
    console.log('   - All users deleted');
    console.log('   - All sessions invalidated');
    console.log('   - All old access codes marked as redeemed');
    console.log('   - 10 new access codes generated\n');
    console.log('🔐 Previous users can no longer access the site.');
    console.log('🎫 Only users with the new access codes can register.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to revoke access:', error);
    process.exit(1);
  }
}

// Confirmation prompt
console.log('⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️\n');
console.log('This script will:');
console.log('  1. DELETE all existing users');
console.log('  2. INVALIDATE all sessions');
console.log('  3. MARK all old access codes as redeemed');
console.log('  4. GENERATE 10 new access codes\n');
console.log('This action CANNOT be undone!\n');
console.log('Starting in 3 seconds...\n');

setTimeout(() => {
  revokeAllAccess();
}, 3000);
