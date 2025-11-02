/**
 * Check Email Verification Status
 * 
 * Diagnostic script to check user verification status and identify issues
 * 
 * Usage:
 *   npx tsx scripts/check-verification-status.ts <email>
 *   npx tsx scripts/check-verification-status.ts --all
 */

import { query } from '../lib/db';

async function checkVerificationStatus(email?: string) {
  try {
    console.log('🔍 Checking Email Verification Status\n');
    console.log('=' .repeat(60));
    
    if (email) {
      // Check specific user
      console.log(`\n📧 Checking user: ${email}\n`);
      
      const result = await query(
        `SELECT 
          id,
          email,
          email_verified,
          verification_token IS NOT NULL as has_token,
          verification_token_expires,
          verification_sent_at,
          created_at,
          updated_at
        FROM users 
        WHERE email = $1`,
        [email.toLowerCase()]
      );
      
      if (result.rows.length === 0) {
        console.log(`❌ User not found: ${email}`);
        return;
      }
      
      const user = result.rows[0];
      
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Email Verified: ${user.email_verified ? '✅ YES' : '❌ NO'}`);
      console.log(`Has Verification Token: ${user.has_token ? 'YES' : 'NO'}`);
      
      if (user.verification_token_expires) {
        const expires = new Date(user.verification_token_expires);
        const now = new Date();
        const isExpired = expires < now;
        
        console.log(`Token Expires: ${expires.toISOString()}`);
        console.log(`Token Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
      }
      
      if (user.verification_sent_at) {
        console.log(`Verification Email Sent: ${new Date(user.verification_sent_at).toISOString()}`);
      }
      
      console.log(`Account Created: ${new Date(user.created_at).toISOString()}`);
      console.log(`Last Updated: ${new Date(user.updated_at).toISOString()}`);
      
      // Check if user has redeemed an access code
      const codeResult = await query(
        `SELECT code, redeemed_at 
        FROM access_codes 
        WHERE redeemed_by = $1`,
        [user.id]
      );
      
      if (codeResult.rows.length > 0) {
        const code = codeResult.rows[0];
        console.log(`\n✅ Access Code Redeemed: ${code.code}`);
        console.log(`   Redeemed At: ${new Date(code.redeemed_at).toISOString()}`);
      } else {
        console.log(`\n⚠️  No access code found for this user`);
      }
      
    } else {
      // Check all users
      console.log(`\n📊 All Users Summary\n`);
      
      const result = await query(
        `SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE email_verified = TRUE) as verified_users,
          COUNT(*) FILTER (WHERE email_verified = FALSE) as unverified_users,
          COUNT(*) FILTER (WHERE verification_token IS NOT NULL) as users_with_token,
          COUNT(*) FILTER (WHERE verification_token_expires < NOW()) as expired_tokens
        FROM users`
      );
      
      const stats = result.rows[0];
      
      console.log(`Total Users: ${stats.total_users}`);
      console.log(`Verified Users: ${stats.verified_users} (${Math.round(stats.verified_users / stats.total_users * 100)}%)`);
      console.log(`Unverified Users: ${stats.unverified_users} (${Math.round(stats.unverified_users / stats.total_users * 100)}%)`);
      console.log(`Users with Active Token: ${stats.users_with_token}`);
      console.log(`Expired Tokens: ${stats.expired_tokens}`);
      
      // List unverified users
      const unverifiedResult = await query(
        `SELECT 
          email,
          verification_sent_at,
          verification_token_expires,
          created_at
        FROM users 
        WHERE email_verified = FALSE
        ORDER BY created_at DESC
        LIMIT 10`
      );
      
      if (unverifiedResult.rows.length > 0) {
        console.log(`\n❌ Unverified Users (most recent 10):\n`);
        
        unverifiedResult.rows.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email}`);
          console.log(`   Created: ${new Date(user.created_at).toISOString()}`);
          
          if (user.verification_sent_at) {
            console.log(`   Email Sent: ${new Date(user.verification_sent_at).toISOString()}`);
          }
          
          if (user.verification_token_expires) {
            const expires = new Date(user.verification_token_expires);
            const now = new Date();
            const isExpired = expires < now;
            console.log(`   Token: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
          }
          
          console.log('');
        });
      }
    }
    
    console.log('=' .repeat(60));
    console.log('\n✅ Verification status check complete\n');
    
  } catch (error) {
    console.error('❌ Error checking verification status:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0] === '--all' ? undefined : args[0];

if (args.length === 0) {
  console.log('Usage:');
  console.log('  npx tsx scripts/check-verification-status.ts <email>');
  console.log('  npx tsx scripts/check-verification-status.ts --all');
  process.exit(1);
}

checkVerificationStatus(email);
