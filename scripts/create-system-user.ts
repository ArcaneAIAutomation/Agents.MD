/**
 * Create System User for Anonymous Caching
 * 
 * This script creates a "system" user in the database to allow
 * caching for anonymous requests while tracking authenticated users separately.
 */

import { query } from '../lib/db';

async function createSystemUser() {
  console.log('🤖 Creating system user for anonymous caching...\n');

  try {
    // Use a fixed UUID for system user (deterministic)
    const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000001';
    const SYSTEM_USER_EMAIL = 'system@arcane.group';
    
    // Check if system user already exists
    const existing = await query(
      `SELECT id, email FROM users WHERE email = $1`,
      [SYSTEM_USER_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log('✅ System user already exists:');
      console.log(`   ID: ${existing.rows[0].id}`);
      console.log(`   Email: ${existing.rows[0].email}`);
      console.log('\n✅ No action needed - system user is ready!');
      return;
    }

    // Create system user with UUID and dummy password hash
    // Password hash is required but system user will never login
    const DUMMY_PASSWORD_HASH = '$2b$12$SYSTEMUSERDUMMYHASH000000000000000000000000000000000';
    
    console.log('📝 Creating system user...');
    await query(
      `INSERT INTO users (id, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [SYSTEM_USER_UUID, SYSTEM_USER_EMAIL, DUMMY_PASSWORD_HASH]
    );

    console.log('✅ System user created successfully!');
    console.log(`   ID: ${SYSTEM_USER_UUID}`);
    console.log(`   Email: ${SYSTEM_USER_EMAIL}`);

    // Verify creation
    const verification = await query(
      `SELECT id, email, created_at FROM users WHERE email = $1`,
      [SYSTEM_USER_EMAIL]
    );

    if (verification.rows.length > 0) {
      const user = verification.rows[0];
      console.log('\n✅ Verification successful:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.created_at}`);
      
      console.log('\n📋 What this enables:');
      console.log('   ✅ Anonymous users can now cache data');
      console.log('   ✅ Prevents Vercel timeout errors');
      console.log('   ✅ Authenticated users still tracked separately');
      console.log('   ✅ Caesar AI gets reliable data access');
      
      console.log('\n🎯 Next steps:');
      console.log('   1. Deploy updated code to production');
      console.log('   2. Test with anonymous request');
      console.log('   3. Monitor cache hit rates');
    } else {
      console.error('❌ Verification failed - system user not found');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Failed to create system user:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      console.log('\n✅ System user already exists (duplicate key error)');
      console.log('   This is OK - system user is ready!');
    } else {
      process.exit(1);
    }
  }
}

// Run script
createSystemUser()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
