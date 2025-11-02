/**
 * Emergency User Verification Script
 * 
 * Manually verifies a user's email (for emergency use only)
 * Usage: npx tsx scripts/emergency-verify-user.ts <email>
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { query } from '../lib/db';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function emergencyVerify() {
  const email = process.argv[2];

  if (!email) {
    console.log('\n❌ Error: Email address required');
    console.log('Usage: npx tsx scripts/emergency-verify-user.ts <email>');
    console.log('Example: npx tsx scripts/emergency-verify-user.ts morgan@arcane.group\n');
    process.exit(1);
  }

  console.log('\n🚨 Emergency User Verification\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Email: ${email}\n`);

  try {
    // Find user
    const userResult = await query(
      'SELECT id, email, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found\n');
      process.exit(1);
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      console.log('✅ User is already verified\n');
      console.log('User can login at: https://news.arcane.group\n');
      process.exit(0);
    }

    // Manually verify user
    console.log('⚠️  Manually verifying user...');
    
    await query(`
      UPDATE users 
      SET email_verified = TRUE,
          verification_token = NULL,
          verification_token_expires = NULL,
          updated_at = NOW()
      WHERE id = $1
    `, [user.id]);

    console.log('✅ User verified successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ SUCCESS! User can now login\n');
    console.log(`Email: ${user.email}`);
    console.log(`Status: Verified`);
    console.log(`Login URL: https://news.arcane.group\n`);
    console.log('💡 User should now be able to login with their email and password\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('❌ ERROR! Verification failed\n');
    console.error(error);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

// Run emergency verification
emergencyVerify();
