/**
 * Run Email Verification Migration
 * 
 * Adds email verification columns to users table
 * Usage: npx tsx scripts/run-email-verification-migration.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { query } from '../lib/db';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runMigration() {
  console.log('\n🔄 Running Email Verification Migration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Read migration file
    const migrationPath = path.resolve(process.cwd(), 'migrations/002_add_email_verification.sql');
    console.log('📋 Reading migration file...');
    console.log(`   Path: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      console.error('   ❌ Migration file not found!');
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('   ✅ Migration file loaded');

    // Execute migration
    console.log('\n📋 Executing migration...');
    await query(migrationSQL);
    console.log('   ✅ Migration executed successfully');

    // Verify columns exist
    console.log('\n📋 Verifying migration...');
    const verifyResult = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires', 'verification_sent_at')
      ORDER BY column_name
    `);

    if (verifyResult.rows.length === 4) {
      console.log('   ✅ All columns added successfully:');
      verifyResult.rows.forEach(col => {
        console.log(`      • ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.error('   ❌ Some columns are missing!');
      process.exit(1);
    }

    // Check existing users
    console.log('\n📋 Checking existing users...');
    const usersResult = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE email_verified = TRUE) as verified_users,
        COUNT(*) FILTER (WHERE email_verified = FALSE) as unverified_users
      FROM users
    `);

    const stats = usersResult.rows[0];
    console.log(`   Total users: ${stats.total_users}`);
    console.log(`   Verified: ${stats.verified_users}`);
    console.log(`   Unverified: ${stats.unverified_users}`);

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ SUCCESS! Email verification system is now active\n');
    console.log('📋 What was added:');
    console.log('   • email_verified column (BOOLEAN)');
    console.log('   • verification_token column (VARCHAR)');
    console.log('   • verification_token_expires column (TIMESTAMP)');
    console.log('   • verification_sent_at column (TIMESTAMP)');
    console.log('   • 3 indexes for performance');
    console.log('   • 2 constraints for data integrity');
    console.log('\n💡 Users must now verify their email before logging in');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('❌ ERROR! Migration failed\n');
    console.error(error);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

// Run migration
runMigration();
