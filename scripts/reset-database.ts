/**
 * Reset Database Script
 * Clears all test data and releases access codes
 */

import { query, closePool } from '../lib/db';

async function resetDatabase() {
  console.log('\n🔄 Resetting database for fresh testing...\n');
  
  try {
    // Release all access codes FIRST (before deleting users)
    console.log('Releasing all access codes...');
    await query(`
      UPDATE access_codes 
      SET redeemed = FALSE, 
          redeemed_by = NULL, 
          redeemed_at = NULL
      WHERE redeemed = TRUE
    `);
    console.log('✅ Access codes released');
    
    // Delete all users (after releasing codes)
    console.log('Deleting all test users...');
    await query('DELETE FROM users');
    console.log('✅ Users deleted');
    
    // Delete all sessions
    console.log('Deleting all sessions...');
    await query('DELETE FROM sessions');
    console.log('✅ Sessions cleared');
    
    // Clear auth logs
    console.log('Clearing auth logs...');
    await query('DELETE FROM auth_logs');
    console.log('✅ Auth logs cleared');
    
    // Show available codes
    const codes = await query('SELECT code, redeemed FROM access_codes ORDER BY code');
    console.log('\n📋 Available access codes:');
    codes.rows.forEach((row: any, i: number) => {
      console.log(`  ${i+1}. ${row.code} - ${row.redeemed ? 'USED' : 'AVAILABLE'}`);
    });
    
    console.log('\n✅ Database reset complete!\n');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

resetDatabase();
