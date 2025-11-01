#!/usr/bin/env tsx
/**
 * Run Email Verification Migration
 * Adds email verification columns to users table
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { Pool } from 'pg';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function runMigration() {
  console.log('\n============================================================');
  console.log('🔧 Email Verification Migration');
  console.log('============================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'migrations', '002_add_email_verification.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Executing migration...\n');
    
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires', 'verification_sent_at')
      ORDER BY column_name
    `);

    console.log(`✅ Added ${result.rows.length}/4 columns:`);
    result.rows.forEach((row: any) => {
      console.log(`   - ${row.column_name}`);
    });

    console.log('\n============================================================');
    console.log('✅ Email Verification System Ready');
    console.log('============================================================\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
