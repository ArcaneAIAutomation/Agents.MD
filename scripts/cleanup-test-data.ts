/**
 * ATGE Test Data Cleanup Script
 * 
 * Removes all test users, access codes, and associated data
 * 
 * Usage:
 *   npx tsx scripts/cleanup-test-data.ts
 */

import { query } from '../lib/db';

/**
 * Clean up test users and their data
 */
async function cleanupTestUsers(): Promise<void> {
  console.log('\n🧹 Cleaning up test users...');
  
  try {
    // Delete test users (cascade will handle related data)
    const result = await query(`
      DELETE FROM users 
      WHERE email LIKE '%@atge-test.com'
      RETURNING email
    `);
    
    if (result.rows.length > 0) {
      console.log(`✅ Deleted ${result.rows.length} test users:`);
      result.rows.forEach((row: any) => {
        console.log(`   • ${row.email}`);
      });
    } else {
      console.log('ℹ️  No test users found');
    }
  } catch (error) {
    console.error('❌ Failed to clean up test users:', error);
  }
}

/**
 * Clean up test access codes
 */
async function cleanupAccessCodes(): Promise<void> {
  console.log('\n🧹 Cleaning up test access codes...');
  
  try {
    const result = await query(`
      DELETE FROM access_codes 
      WHERE code LIKE 'ATGE-TEST-%' OR code LIKE 'ATGE-DEV-%'
      RETURNING code
    `);
    
    if (result.rows.length > 0) {
      console.log(`✅ Deleted ${result.rows.length} test access codes:`);
      result.rows.forEach((row: any) => {
        console.log(`   • ${row.code}`);
      });
    } else {
      console.log('ℹ️  No test access codes found');
    }
  } catch (error) {
    console.error('❌ Failed to clean up access codes:', error);
  }
}

/**
 * Clean up orphaned trade signals
 */
async function cleanupOrphanedTrades(): Promise<void> {
  console.log('\n🧹 Cleaning up orphaned trade signals...');
  
  try {
    const result = await query(`
      DELETE FROM trade_signals 
      WHERE user_id NOT IN (SELECT id FROM users)
      RETURNING id
    `);
    
    if (result.rows.length > 0) {
      console.log(`✅ Deleted ${result.rows.length} orphaned trade signals`);
    } else {
      console.log('ℹ️  No orphaned trade signals found');
    }
  } catch (error) {
    console.error('❌ Failed to clean up orphaned trades:', error);
  }
}

/**
 * Clean up old sessions
 */
async function cleanupOldSessions(): Promise<void> {
  console.log('\n🧹 Cleaning up expired sessions...');
  
  try {
    const result = await query(`
      DELETE FROM sessions 
      WHERE expires_at < NOW()
      RETURNING id
    `);
    
    if (result.rows.length > 0) {
      console.log(`✅ Deleted ${result.rows.length} expired sessions`);
    } else {
      console.log('ℹ️  No expired sessions found');
    }
  } catch (error) {
    console.error('❌ Failed to clean up sessions:', error);
  }
}

/**
 * Display cleanup summary
 */
function displaySummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('🧹 ATGE Test Data Cleanup Complete');
  console.log('='.repeat(60));
  console.log('\n✅ All test data has been removed');
  console.log('\n💡 To re-seed test data, run:');
  console.log('   npx tsx scripts/seed-test-data.ts');
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main cleanup function
 */
async function main(): Promise<void> {
  try {
    console.log('🧹 Starting ATGE test data cleanup...');
    
    // Confirm cleanup
    console.log('\n⚠️  WARNING: This will delete all test data!');
    console.log('   • Test users (@atge-test.com)');
    console.log('   • Test access codes (ATGE-TEST-*, ATGE-DEV-*)');
    console.log('   • Orphaned trade signals');
    console.log('   • Expired sessions');
    
    // Clean up data
    await cleanupTestUsers();
    await cleanupAccessCodes();
    await cleanupOrphanedTrades();
    await cleanupOldSessions();
    
    // Display summary
    displaySummary();
    
    console.log('✅ Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { cleanupTestUsers, cleanupAccessCodes, cleanupOrphanedTrades, cleanupOldSessions };
