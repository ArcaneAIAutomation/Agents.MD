/**
 * Check Access Codes Status
 * 
 * This script displays all access codes and their redemption status
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

async function checkAccessCodes() {
  console.log('🔍 Checking Access Codes Status\n');

  try {
    // Get all access codes
    const result = await query(`
      SELECT 
        code,
        redeemed,
        redeemed_by,
        redeemed_at,
        created_at
      FROM access_codes
      ORDER BY created_at DESC
    `);

    const codes = result.rows;
    const available = codes.filter(c => !c.redeemed);
    const redeemed = codes.filter(c => c.redeemed);

    console.log('📊 Summary:');
    console.log(`   Total Codes: ${codes.length}`);
    console.log(`   Available: ${available.length}`);
    console.log(`   Redeemed: ${redeemed.length}\n`);

    if (available.length > 0) {
      console.log('✅ Available Access Codes:');
      available.forEach((code, index) => {
        const createdDate = new Date(code.created_at).toLocaleDateString();
        console.log(`   ${index + 1}. ${code.code} (created: ${createdDate})`);
      });
      console.log('');
    }

    if (redeemed.length > 0) {
      console.log('🔒 Redeemed Access Codes:');
      redeemed.forEach((code, index) => {
        const redeemedDate = new Date(code.redeemed_at).toLocaleDateString();
        console.log(`   ${index + 1}. ${code.code} (redeemed: ${redeemedDate})`);
      });
      console.log('');
    }

    // Get user count
    const userResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = userResult.rows[0].count;

    console.log('👥 User Statistics:');
    console.log(`   Total Users: ${userCount}`);
    console.log(`   Codes Redeemed: ${redeemed.length}`);
    console.log(`   Codes Available: ${available.length}\n`);

    if (available.length === 0) {
      console.log('⚠️  WARNING: No available access codes!');
      console.log('   Generate more codes with: npx tsx scripts/generate-access-codes.ts\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to check access codes:', error);
    process.exit(1);
  }
}

checkAccessCodes();
