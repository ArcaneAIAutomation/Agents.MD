/**
 * Generate Additional Access Codes
 * 
 * Usage: npx tsx scripts/generate-access-codes.ts [count]
 * Example: npx tsx scripts/generate-access-codes.ts 5
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

/**
 * Generate a secure random access code
 */
function generateAccessCode(): string {
  const prefix = 'BTC-SOVEREIGN';
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-2);
  return `${prefix}-${randomPart}${timestamp}`;
}

async function generateAccessCodes() {
  // Get count from command line argument (default: 10)
  const count = parseInt(process.argv[2]) || 10;

  if (count < 1 || count > 100) {
    console.error('❌ Error: Count must be between 1 and 100');
    process.exit(1);
  }

  console.log(`🔑 Generating ${count} new access codes...\n`);

  try {
    const newCodes: string[] = [];

    for (let i = 1; i <= count; i++) {
      const code = generateAccessCode();
      await query(
        'INSERT INTO access_codes (code, redeemed) VALUES ($1, FALSE)',
        [code]
      );
      newCodes.push(code);
      console.log(`   ${i}. ${code}`);
    }

    console.log(`\n✅ Successfully generated ${newCodes.length} new access codes!\n`);

    // Show summary
    const totalResult = await query('SELECT COUNT(*) as count FROM access_codes WHERE redeemed = FALSE');
    const totalAvailable = totalResult.rows[0].count;

    console.log('📊 Access Code Summary:');
    console.log(`   Total Available: ${totalAvailable}`);
    console.log(`   Just Generated: ${newCodes.length}\n`);

    console.log('💾 Codes saved to database and ready for distribution.');
    console.log('📋 Run "npx tsx scripts/check-access-codes.ts" to view all codes.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to generate access codes:', error);
    process.exit(1);
  }
}

generateAccessCodes();
