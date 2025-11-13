/**
 * Verify Kiro Test Users
 * 
 * Checks that all Kiro test users exist and have email_verified set to TRUE
 */

import { query } from '../lib/db';

async function main() {
  console.log('🔍 Verifying Kiro test users...\n');
  
  try {
    const result = await query(`
      SELECT id, email, email_verified, created_at
      FROM users
      WHERE email LIKE '%test.local'
      ORDER BY email
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No test users found');
      console.log('   Run: npx tsx scripts/kiro-setup.ts');
      process.exit(1);
    }
    
    console.log(`✅ Found ${result.rows.length} test users:\n`);
    
    result.rows.forEach((user: any) => {
      const verified = user.email_verified ? '✅' : '❌';
      console.log(`${verified} ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    const allVerified = result.rows.every((user: any) => user.email_verified);
    
    if (allVerified) {
      console.log('✅ All test users have email_verified = TRUE');
    } else {
      console.log('⚠️  Some users are not verified');
      console.log('   Run: npx tsx scripts/kiro-setup.ts');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
