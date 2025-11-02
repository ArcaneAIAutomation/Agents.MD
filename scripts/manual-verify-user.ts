/**
 * Manual User Verification Script
 * 
 * Emergency script to manually verify a user's email address
 * Use this when users are stuck and can't verify through normal flow
 * 
 * Usage:
 *   npx tsx scripts/manual-verify-user.ts <email>
 */

import { query } from '../lib/db';
import { logAuthEvent } from '../lib/auth/auditLog';

async function manualVerifyUser(email: string) {
  try {
    console.log('🔧 Manual User Verification Tool\n');
    console.log('=' .repeat(60));
    console.log(`\n📧 Verifying user: ${email}\n`);
    
    // Find user
    const userResult = await query(
      'SELECT id, email, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      console.log(`\nPlease check the email address and try again.`);
      return;
    }
    
    const user = userResult.rows[0];
    
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Current Status: ${user.email_verified ? '✅ VERIFIED' : '❌ UNVERIFIED'}`);
    
    if (user.email_verified) {
      console.log(`\n✅ User is already verified!`);
      console.log(`   They can log in at: https://news.arcane.group`);
      return;
    }
    
    // Verify the user
    console.log(`\n🔄 Updating database...`);
    
    const updateResult = await query(
      `UPDATE users 
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, email_verified`,
      [user.id]
    );
    
    if (updateResult.rows.length === 0) {
      console.error(`❌ Failed to update user`);
      throw new Error('Database update failed');
    }
    
    const updatedUser = updateResult.rows[0];
    
    // Verify the update
    const verifyResult = await query(
      'SELECT id, email, email_verified FROM users WHERE id = $1',
      [user.id]
    );
    
    if (verifyResult.rows.length === 0 || !verifyResult.rows[0].email_verified) {
      console.error(`❌ CRITICAL: Verification did not persist in database!`);
      throw new Error('Database verification failed');
    }
    
    console.log(`✅ Database updated successfully`);
    console.log(`   Email Verified: ${updatedUser.email_verified}`);
    
    // Log the manual verification
    await query(
      `INSERT INTO auth_logs (user_id, event_type, success, error_message, timestamp)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        user.id,
        'security_alert',
        true,
        JSON.stringify({ 
          action: 'manual_verification',
          email: user.email,
          verified_by: 'admin_script',
          reason: 'emergency_manual_verification'
        })
      ]
    );
    
    console.log(`\n✅ User verified successfully!`);
    console.log(`\n📧 Next Steps for User:`);
    console.log(`   1. Go to: https://news.arcane.group`);
    console.log(`   2. Click "Login"`);
    console.log(`   3. Enter email: ${user.email}`);
    console.log(`   4. Enter password`);
    console.log(`   5. Access the platform`);
    
    console.log(`\n✅ Manual verification complete!`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error during manual verification:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  npx tsx scripts/manual-verify-user.ts <email>');
  console.log('');
  console.log('Example:');
  console.log('  npx tsx scripts/manual-verify-user.ts user@example.com');
  process.exit(1);
}

const email = args[0];
manualVerifyUser(email);
