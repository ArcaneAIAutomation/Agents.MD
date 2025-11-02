/**
 * Diagnose Verification Issue
 * 
 * Checks why users can't verify their emails
 * Usage: npx tsx scripts/diagnose-verification-issue.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { query } from '../lib/db';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnoseIssue() {
  console.log('\n🔍 Diagnosing Email Verification Issue\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Check all unverified users
    console.log('📋 Checking unverified users...');
    const unverifiedResult = await query(`
      SELECT id, email, email_verified, verification_token, 
             verification_token_expires, verification_sent_at, created_at
      FROM users
      WHERE email_verified = FALSE
      ORDER BY created_at DESC
    `);

    if (unverifiedResult.rows.length === 0) {
      console.log('   ✅ No unverified users found - all users are verified!');
    } else {
      console.log(`   ⚠️  Found ${unverifiedResult.rows.length} unverified user(s):\n`);
      
      unverifiedResult.rows.forEach((user, index) => {
        console.log(`   User ${index + 1}:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Created: ${user.created_at}`);
        console.log(`   Token Set: ${user.verification_token ? 'Yes' : 'No'}`);
        console.log(`   Token Expires: ${user.verification_token_expires || 'N/A'}`);
        console.log(`   Email Sent: ${user.verification_sent_at || 'N/A'}`);
        
        // Check if token is expired
        if (user.verification_token_expires) {
          const now = new Date();
          const expires = new Date(user.verification_token_expires);
          const isExpired = now > expires;
          console.log(`   Token Status: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
          
          if (!isExpired) {
            const hoursLeft = Math.round((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
            console.log(`   Time Left: ${hoursLeft} hours`);
          }
        }
        console.log('');
      });
    }

    // Check verified users
    console.log('\n📋 Checking verified users...');
    const verifiedResult = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE email_verified = TRUE
    `);
    console.log(`   ✅ ${verifiedResult.rows[0].count} verified user(s)`);

    // Check database schema
    console.log('\n📋 Verifying database schema...');
    const schemaResult = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires', 'verification_sent_at')
      ORDER BY column_name
    `);

    if (schemaResult.rows.length === 4) {
      console.log('   ✅ All verification columns exist');
    } else {
      console.log('   ❌ Missing verification columns!');
      console.log('   💡 Run: npm run migrate:email-verification');
    }

    // Check environment variables
    console.log('\n📋 Checking environment configuration...');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const dbUrl = process.env.DATABASE_URL;
    
    console.log(`   App URL: ${appUrl || '❌ NOT SET'}`);
    console.log(`   Database: ${dbUrl ? '✅ Configured' : '❌ NOT SET'}`);

    // Provide recommendations
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 RECOMMENDATIONS\n');

    if (unverifiedResult.rows.length > 0) {
      console.log('For unverified users:');
      console.log('1. Check if verification page is deployed to production');
      console.log('2. Check if API endpoint /api/auth/verify-email exists');
      console.log('3. Verify DATABASE_URL in Vercel environment variables');
      console.log('4. Check Vercel function logs for errors');
      console.log('5. Test verification link manually');
      
      console.log('\n🔧 Quick Fix Options:');
      console.log('Option 1: Manually verify users (for testing):');
      unverifiedResult.rows.forEach(user => {
        console.log(`   UPDATE users SET email_verified = TRUE WHERE email = '${user.email}';`);
      });
      
      console.log('\nOption 2: Resend verification emails:');
      console.log('   Go to: https://news.arcane.group/resend-verification');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('❌ ERROR! Diagnosis failed\n');
    console.error(error);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

// Run diagnosis
diagnoseIssue();
