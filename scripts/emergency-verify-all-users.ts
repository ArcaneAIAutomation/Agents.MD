/**
 * EMERGENCY: Verify All Unverified Users
 * 
 * This script will immediately verify ALL unverified users
 * so they can access the site while we fix the verification system
 * 
 * Usage:
 *   npx tsx scripts/emergency-verify-all-users.ts
 */

import dotenv from 'dotenv';
import { query } from '../lib/db';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function emergencyVerifyAllUsers() {
  try {
    console.log('🚨 EMERGENCY: Verifying All Unverified Users\n');
    console.log('=' .repeat(60));
    
    // Get all unverified users
    console.log('\n📊 Finding unverified users...');
    
    const unverifiedResult = await query(
      'SELECT id, email, created_at FROM users WHERE email_verified = FALSE ORDER BY created_at DESC'
    );
    
    const unverifiedUsers = unverifiedResult.rows;
    
    if (unverifiedUsers.length === 0) {
      console.log('✅ No unverified users found - all users are already verified!');
      return;
    }
    
    console.log(`\n❌ Found ${unverifiedUsers.length} unverified user(s):\n`);
    
    unverifiedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (created: ${new Date(user.created_at).toISOString()})`);
    });
    
    console.log(`\n🔄 Verifying all ${unverifiedUsers.length} users...`);
    
    // Verify all users in one query
    const updateResult = await query(
      `UPDATE users 
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires = NULL,
           updated_at = NOW()
       WHERE email_verified = FALSE
       RETURNING id, email, email_verified`
    );
    
    console.log(`\n✅ Updated ${updateResult.rows.length} user(s)`);
    
    // Verify the updates persisted
    console.log(`\n🔍 Verifying updates persisted...`);
    
    const verifyResult = await query(
      'SELECT COUNT(*) as unverified_count FROM users WHERE email_verified = FALSE'
    );
    
    const remainingUnverified = verifyResult.rows[0].unverified_count;
    
    if (remainingUnverified === 0) {
      console.log(`✅ SUCCESS: All users are now verified!`);
      console.log(`\n📧 Verified users can now login at: https://news.arcane.group`);
      console.log(`\nVerified users:`);
      updateResult.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} ✅`);
      });
    } else {
      console.error(`\n❌ WARNING: ${remainingUnverified} user(s) still unverified`);
      console.error(`   This indicates a database persistence issue`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Emergency verification complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error during emergency verification:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

emergencyVerifyAllUsers();
