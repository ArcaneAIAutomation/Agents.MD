/**
 * Delete User and Release Access Code
 * 
 * Deletes a user and releases their access code for reuse
 * 
 * Usage:
 *   npx tsx scripts/delete-user.ts <email>
 */

import dotenv from 'dotenv';
import { query } from '../lib/db';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function deleteUser(email: string) {
  try {
    console.log('🗑️  Deleting User and Releasing Access Code\n');
    console.log('=' .repeat(60));
    console.log(`\n📧 User: ${email}\n`);
    
    // Find user
    const userResult = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ User found: ${user.id}`);
    
    // Find their access code
    const codeResult = await query(
      'SELECT id, code FROM access_codes WHERE redeemed_by = $1',
      [user.id]
    );
    
    let accessCode = null;
    if (codeResult.rows.length > 0) {
      accessCode = codeResult.rows[0];
      console.log(`✅ Access code found: ${accessCode.code}`);
    }
    
    // Delete user's sessions
    console.log(`\n🔄 Deleting sessions...`);
    const sessionsResult = await query(
      'DELETE FROM sessions WHERE user_id = $1',
      [user.id]
    );
    console.log(`✅ Deleted ${sessionsResult.rowCount || 0} session(s)`);
    
    // Delete user's auth logs
    console.log(`\n🔄 Deleting auth logs...`);
    const logsResult = await query(
      'DELETE FROM auth_logs WHERE user_id = $1',
      [user.id]
    );
    console.log(`✅ Deleted ${logsResult.rowCount || 0} log(s)`);
    
    // Release access code
    if (accessCode) {
      console.log(`\n🔄 Releasing access code...`);
      await query(
        'UPDATE access_codes SET redeemed = FALSE, redeemed_by = NULL, redeemed_at = NULL WHERE id = $1',
        [accessCode.id]
      );
      console.log(`✅ Access code released: ${accessCode.code}`);
    }
    
    // Delete user
    console.log(`\n🔄 Deleting user...`);
    await query(
      'DELETE FROM users WHERE id = $1',
      [user.id]
    );
    console.log(`✅ User deleted: ${user.email}`);
    
    // Verify deletion
    const verifyResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (verifyResult.rows.length === 0) {
      console.log(`\n✅ SUCCESS: User completely removed from database`);
      if (accessCode) {
        console.log(`✅ Access code ${accessCode.code} is now available for reuse`);
      }
    } else {
      console.error(`\n❌ ERROR: User still exists in database`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ User deletion complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error deleting user:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  npx tsx scripts/delete-user.ts <email>');
  console.log('');
  console.log('Example:');
  console.log('  npx tsx scripts/delete-user.ts morgan@arcane.group');
  process.exit(1);
}

const email = args[0];
deleteUser(email);
