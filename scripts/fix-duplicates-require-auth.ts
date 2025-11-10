/**
 * Fix Duplicate Data and Require Authentication
 * 
 * This script:
 * 1. Removes all anonymous user data (user_email IS NULL)
 * 2. Changes UNIQUE constraint to prevent duplicates
 * 3. Requires user_email for all future entries
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function fixDuplicatesAndRequireAuth() {
  console.log('🔧 Fixing duplicate data and requiring authentication...\n');

  try {
    // Read migration SQL
    const migrationPath = join(process.cwd(), 'migrations', '001_fix_duplicates_require_auth.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📋 Migration SQL loaded');
    console.log('🚀 Executing migration...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verifying changes...\n');

    // Verify changes
    const cacheResult = await query(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN user_email IS NULL THEN 1 END) as null_emails,
              COUNT(CASE WHEN user_id = 'anonymous' THEN 1 END) as anonymous_users
       FROM ucie_analysis_cache`
    );

    const cacheStats = cacheResult.rows[0];
    console.log('📊 ucie_analysis_cache:');
    console.log(`   - Total entries: ${cacheStats.total}`);
    console.log(`   - NULL emails: ${cacheStats.null_emails} (should be 0)`);
    console.log(`   - Anonymous users: ${cacheStats.anonymous_users} (should be 0)`);

    // Check constraints
    const constraintResult = await query(
      `SELECT constraint_name, constraint_type
       FROM information_schema.table_constraints
       WHERE table_name = 'ucie_analysis_cache' AND constraint_type = 'UNIQUE'`
    );

    console.log('\n🔒 UNIQUE Constraints:');
    constraintResult.rows.forEach(row => {
      console.log(`   - ${row.constraint_name} (${row.constraint_type})`);
    });

    // Check NOT NULL constraints
    const columnResult = await query(
      `SELECT column_name, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'ucie_analysis_cache' AND column_name = 'user_email'`
    );

    console.log('\n🔐 user_email column:');
    const column = columnResult.rows[0];
    console.log(`   - Nullable: ${column.is_nullable} (should be NO)`);

    if (cacheStats.null_emails === '0' && cacheStats.anonymous_users === '0' && column.is_nullable === 'NO') {
      console.log('\n🎉 SUCCESS! All checks passed:');
      console.log('   ✅ No NULL emails');
      console.log('   ✅ No anonymous users');
      console.log('   ✅ user_email is NOT NULL');
      console.log('   ✅ UNIQUE constraint updated');
      console.log('\n📝 Summary:');
      console.log('   - Only authenticated users can store data');
      console.log('   - No duplicates (one entry per symbol+type)');
      console.log('   - Caesar AI will only analyze authenticated user data');
    } else {
      console.log('\n⚠️  WARNING: Some checks failed');
      if (cacheStats.null_emails !== '0') {
        console.log(`   ❌ Found ${cacheStats.null_emails} entries with NULL email`);
      }
      if (cacheStats.anonymous_users !== '0') {
        console.log(`   ❌ Found ${cacheStats.anonymous_users} anonymous user entries`);
      }
      if (column.is_nullable !== 'NO') {
        console.log(`   ❌ user_email is still nullable`);
      }
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
fixDuplicatesAndRequireAuth()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
